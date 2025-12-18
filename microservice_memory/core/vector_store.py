import json
from models.memory_models import MemoryEntry, MemoryMetrics, ContextCard
"""
Vector Store Manager - FASE 6.1
Wrapper de ChromaDB con lógica de aislamiento de tenants.
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from models.memory_models import MemoryEntry
from .config import get_settings

logger = logging.getLogger(__name__)


class VectorStoreManager:
    """
    Gestor centralizado del almacén vectorial (ChromaDB).
    Implementa el patrón Singleton y garantiza aislamiento de tenants.
    """
    
    _instance = None
    
    def __new__(cls):
        """Singleton: Solo una instancia del store."""
        if cls._instance is None:
            cls._instance = super(VectorStoreManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Inicializa la conexión con ChromaDB."""
        if self._initialized:
            return
        
        self.settings = get_settings()
        
        try:
            # Crear cliente persistente de ChromaDB
            self.client = chromadb.PersistentClient(
                path=self.settings.CHROMA_PERSIST_DIRECTORY,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=False
                )
            )
            
            # Obtener o crear colección
            self.collection = self.client.get_or_create_collection(
                name=self.settings.CHROMA_COLLECTION_NAME,
                metadata={
                    "description": "Corporate Memory - Campaign Triads (Context-Action-Result)",
                    "created_at": datetime.utcnow().isoformat()
                }
            )
            
            logger.info(f"ChromaDB initialized. Collection: {self.settings.CHROMA_COLLECTION_NAME}")
            logger.info(f"Persist directory: {self.settings.CHROMA_PERSIST_DIRECTORY}")
            logger.info(f"Current collection size: {self.collection.count()}")
            
            self._initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            raise RuntimeError(f"ChromaDB initialization failed: {e}")
    
    def add_memory(
        self,
        entry: MemoryEntry,
        embedding: List[float]
    ) -> str:
        """
        Añade una memoria al vector store.
        
        Args:
            entry: La entrada de memoria completa
            embedding: Vector de embeddings (1536 dimensiones)
            
        Returns:
            memory_id: ID único de la memoria insertada
            
        Raises:
            ValueError: Si el embedding tiene dimensión incorrecta
            RuntimeError: Si falla la inserción
        """
        try:
            # Validar dimensión del embedding
            if len(embedding) != self.settings.EMBEDDING_DIMENSION:
                raise ValueError(
                    f"Embedding dimension mismatch. Expected {self.settings.EMBEDDING_DIMENSION}, "
                    f"got {len(embedding)}"
                )
            
            # Preparar metadatos para ChromaDB (aplanar campos complejos como JSON string)
            metadata = {
                "tenant_id": entry.tenant_id,
                "execution_id": entry.execution_id,
                "campaign_id": entry.campaign_id,
                "platform": entry.platform,
                "objective": entry.objective,
                "creation_date": entry.creation_date.isoformat(),
                "final_state": entry.final_state.value if hasattr(entry.final_state, 'value') else str(entry.final_state),
                "quality_verdict": entry.quality_verdict.value if hasattr(entry.quality_verdict, 'value') else str(entry.quality_verdict),
                # Aplanar campos complejos
                "metrics": json.dumps(entry.metrics.model_dump() if hasattr(entry.metrics, 'model_dump') else dict(entry.metrics)),
                "context_card": json.dumps(entry.context_card.model_dump() if hasattr(entry.context_card, 'model_dump') else dict(entry.context_card)),
                "strategy_summary": json.dumps(entry.strategy_summary),
                "creative_summary": json.dumps(entry.creative_summary),
            }
            document = entry.context_card.summary_text
            self.collection.add(
                ids=[entry.memory_id],
                embeddings=[embedding],
                documents=[document],
                metadatas=[metadata]
            )
            
            logger.info(f"Memory stored: {entry.memory_id} (tenant: {entry.tenant_id})")
            return entry.memory_id
            
        except Exception as e:
            logger.error(f"Failed to add memory {entry.memory_id}: {e}")
            raise RuntimeError(f"Memory insertion failed: {e}")
    
    def search(
        self,
        query_vector: List[float],
        tenant_id: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 3
    ) -> List[MemoryEntry]:
        """
        Busca memorias similares usando búsqueda vectorial híbrida.
        
        Args:
            query_embedding: Vector de la consulta
            tenant_id: ID del tenant (OBLIGATORIO para aislamiento)
            filters: Filtros adicionales (platform, min_quality, etc)
            limit: Número máximo de resultados
            
        Returns:
            Lista de memorias con sus metadatos y scores de similitud
            
        Raises:
            ValueError: Si no se proporciona tenant_id
        """
        try:
            # SEGURIDAD CRÍTICA: Validar tenant_id
            if not tenant_id:
                raise ValueError("tenant_id is required for memory search")
            
            # Construir filtro base (AISLAMIENTO DE TENANT)
            where_filter = {"tenant_id": tenant_id}
            
            # Agregar filtros adicionales
            if filters:
                # Filtro por plataforma
                if "platform" in filters and filters["platform"]:
                    where_filter["platform"] = filters["platform"]
                
                # Filtro por calidad mínima
                if "min_quality" in filters and filters["min_quality"]:
                    # Solo buscar con verdict PASS o superior
                    if filters["min_quality"] == "PASS":
                        where_filter["quality_verdict"] = "PASS"
                
                # Filtro por objetivo
                if "objective" in filters and filters["objective"]:
                    where_filter["objective"] = filters["objective"]
            
            # Ejecutar búsqueda vectorial con filtros
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=min(limit, self.settings.MAX_RETRIEVAL_LIMIT),
                where=where_filter,
                include=["metadatas", "documents", "distances"]
            )
            # Formatear resultados: deserializar y devolver MemoryEntry
            entries = []
            if results and results.get("ids") and len(results["ids"][0]) > 0:
                for idx, memory_id in enumerate(results["ids"][0]):
                    metadata = results["metadatas"][0][idx]
                    # Re-inflar campos complejos
                    metrics = MemoryMetrics(**json.loads(metadata["metrics"])) if "metrics" in metadata else None
                    context_card = ContextCard(**json.loads(metadata["context_card"])) if "context_card" in metadata else None
                    strategy_summary = json.loads(metadata["strategy_summary"]) if "strategy_summary" in metadata else {}
                    creative_summary = json.loads(metadata["creative_summary"]) if "creative_summary" in metadata else {}
                    entry = MemoryEntry(
                        memory_id=memory_id,
                        tenant_id=metadata["tenant_id"],
                        execution_id=metadata["execution_id"],
                        campaign_id=metadata["campaign_id"],
                        platform=metadata["platform"],
                        objective=metadata["objective"],
                        creation_date=datetime.fromisoformat(metadata["creation_date"]),
                        final_state=metadata["final_state"],
                        quality_verdict=metadata["quality_verdict"],
                        metrics=metrics,
                        context_card=context_card,
                        strategy_summary=strategy_summary,
                        creative_summary=creative_summary
                    )
                    entries.append(entry)
            logger.info(
                f"Search completed: tenant={tenant_id}, "
                f"filters={filters}, results={len(entries)}"
            )
            return entries
            
        except Exception as e:
            # PATCH FASE 6.1: Logging robusto sin amnesia silenciosa
            logger.error(
                "VECTOR SEARCH FAILED - Returning empty results to avoid blocking campaign",
                exc_info=True,
                extra={
                    "tenant_id": tenant_id,
                    "filters": filters,
                    "limit": limit,
                    "error_type": type(e).__name__
                }
            )
            # NO fallar completamente, retornar lista vacía para no bloquear la campaña
            return []
    
    def get_memory_by_id(self, memory_id: str, tenant_id: str) -> Optional[Dict[str, Any]]:
        """
        Recupera una memoria específica por su ID.
        
        Args:
            memory_id: ID único de la memoria
            tenant_id: ID del tenant (para validar permisos)
            
        Returns:
            Diccionario con la memoria o None si no se encuentra
        """
        try:
            result = self.collection.get(
                ids=[memory_id],
                where={"tenant_id": tenant_id},
                include=["metadatas", "documents", "embeddings"]
            )
            
            if result and result["ids"] and len(result["ids"]) > 0:
                return {
                    "memory_id": result["ids"][0],
                    "metadata": result["metadatas"][0],
                    "document": result["documents"][0],
                    "embedding": result["embeddings"][0] if result.get("embeddings") else None
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get memory {memory_id}: {e}")
            return None
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estadísticas del vector store."""
        try:
            return {
                "total_memories": self.collection.count(),
                "collection_name": self.settings.CHROMA_COLLECTION_NAME,
                "persist_directory": self.settings.CHROMA_PERSIST_DIRECTORY,
                "initialized": self._initialized
            }
        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {"error": str(e)}
    
    def reset_collection(self):
        """
        PELIGRO: Elimina toda la colección.
        Solo para desarrollo/testing.
        """
        # PATCH FASE 6.1: Prevenir reset accidental en producción
        environment = getattr(self.settings, 'ENVIRONMENT', 'development')
        if environment and environment.lower() == 'production':
            raise RuntimeError(
                "Cannot reset collection in production environment. "
                "This operation is only allowed in development/testing."
            )
        
        logger.warning("RESETTING COLLECTION - ALL MEMORIES WILL BE DELETED")
        try:
            self.client.delete_collection(name=self.settings.CHROMA_COLLECTION_NAME)
            self.collection = self.client.create_collection(
                name=self.settings.CHROMA_COLLECTION_NAME
            )
            logger.info("Collection reset complete")
        except Exception as e:
            logger.error(f"Failed to reset collection: {e}")
            raise
