from core.embedding_engine import EmbeddingEngine
# Dependency injection for EmbeddingEngine
def get_embedding_engine():
    return EmbeddingEngine()

"""
API Routes for Memory Service.
Handles ingestion and retrieval of campaign memories.
"""

from typing import List, Optional
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel

# --- FIX: IMPORTACIONES ABSOLUTAS (No usar '..') ---
from models.memory_models import (
    MemoryEntry, 
    MemoryMetrics, 
    ContextCard,
    MemoryIngestRequest,
    MemoryRetrieveRequest,
    MemoryRetrieveResponse
)
from services.canonizer import Canonizer
from core.vector_store import VectorStoreManager
from shared_lib.src.contracts import CampaignPayload, CampaignState

logger = logging.getLogger(__name__)

router = APIRouter()

# Dependency injection for VectorStore
def get_vector_store():
    return VectorStoreManager()
@router.get("/health", summary="Health check for memory microservice")
async def health():
    return {"status": "ok"}

@router.post(
    "/ingest",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a campaign into corporate memory"
)
async def ingest_campaign(
    request: MemoryIngestRequest,
    vector_store: VectorStoreManager = Depends(get_vector_store),
    embedding_engine: EmbeddingEngine = Depends(get_embedding_engine)
):
    """
    Ingesta una campaña finalizada en la memoria.
    Calcula métricas, canoniza el contexto y genera embeddings.
    """
    try:
        payload = request.payload
        # Permitir dict o modelo
        if isinstance(payload, dict):
            # El test puede enviar 'state' en vez de 'current_state'
            current_state = payload.get("current_state") or payload.get("state")
        else:
            current_state = getattr(payload, "current_state", None) or getattr(payload, "state", None)

        # Validar estado terminal
        terminal_states = [CampaignState.LEARN, CampaignState.FAILED, CampaignState.PUBLISH]
        if current_state not in terminal_states:
            logger.warning(f"Ingesting campaign in non-terminal state: {current_state}")
            raise HTTPException(status_code=400, detail="Campaign is not in a terminal state")

        # Canonizar (Crear Context Card)
        logger.info(f"Canonizing campaign {getattr(payload, 'campaign_id', None) if not isinstance(payload, dict) else payload.get('campaign_id', None)}...")
        context_card = Canonizer.create_context_card(payload.model_dump() if hasattr(payload, 'model_dump') else payload)

        # Crear Entry
        strategy = payload.get("strategy") if isinstance(payload, dict) else getattr(payload, "strategy", None)
        metrics = MemoryMetrics(
            roas=(strategy.get("budget_allocation", {}).get("roas", 0.0) if strategy and isinstance(strategy, dict) else 0.0),
            quality_score=85
        )
        memory_entry = MemoryEntry(
            tenant_id=str(payload.get("tenant_id") if isinstance(payload, dict) else getattr(payload, "tenant_id", "")),
            execution_id=str(payload.get("execution_id") if isinstance(payload, dict) else getattr(payload, "execution_id", "")),
            campaign_id=str(payload.get("campaign_id") if isinstance(payload, dict) else getattr(payload, "campaign_id", "")),
            platform=(strategy.get("channels", ["UNKNOWN"])[0] if strategy and isinstance(strategy, dict) and strategy.get("channels") else "UNKNOWN"),
            objective="UNKNOWN",
            final_state=current_state,
            quality_verdict="PASS",
            context_card=context_card,
            metrics=metrics,
            strategy_summary={"raw": "summary"},
            creative_summary={}
        )
        # Generar embedding antes de guardar
        vector = embedding_engine.embed_text(context_card.summary_text)
        logger.info(f"Vectorizing and storing memory for tenant {memory_entry.tenant_id}...")
        memory_id = vector_store.add_memory(memory_entry, embedding=vector)
        return {
            "status": "stored",
            "memory_id": memory_id,
            "campaign_id": str(memory_entry.campaign_id)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ingestion failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}"
        )

@router.post(
    "/retrieve",
    response_model=MemoryRetrieveResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve similar past campaigns"
)
async def retrieve_memories(
    request: MemoryRetrieveRequest,
    vector_store: VectorStoreManager = Depends(get_vector_store),
    embedding_engine: EmbeddingEngine = Depends(get_embedding_engine)
):
    """
    Recupera campañas pasadas similares basadas en búsqueda semántica.
    CRÍTICO: Aislamiento de tenant obligatorio.
    """
    try:
        # Validación de seguridad extra (aunque Pydantic lo hace)
        if not request.tenant_id:
             raise HTTPException(status_code=400, detail="Tenant ID is required")

        logger.info(f"Retrieving memories for tenant {request.tenant_id}...")
        
        # Sanitizar query para logs (Security Hardening 6.1.1)
        safe_query = request.query_text[:50].replace('\n', ' ')
        logger.debug(f"Query: {safe_query}...")

        # Generar embedding del query
        query_vector = embedding_engine.embed_text(request.query_text)
        # Buscar en Vector Store usando el vector
        results = vector_store.search(
            query_vector=query_vector,
            tenant_id=request.tenant_id,
            limit=request.limit,
            filters=request.filters
        )
        return MemoryRetrieveResponse(
            results=results,
            count=len(results)
        )
        
    except Exception as e:
        logger.error(f"Retrieval failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Retrieval failed: {str(e)}"
        )