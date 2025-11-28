from fastapi import FastAPI, Depends, HTTPException, APIRouter, BackgroundTasks
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from services.traceability import TraceabilityService
from services.learning_core import LearningCore
from models.memory_models import DecisionTrace, VectorMemoryItem, FeedbackSignal
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import logging

# --- IMPORTACIONES FASE 1: MEMORIA EVOLUTIVA ---
from core.vector_store import ChromaDBAdapter
from core.retrieval_engine import StrategicRetriever
from datetime import datetime

# Logging Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MemoryAPI")

# Inicialización DB SQL
Base.metadata.create_all(bind=engine)

# Inicialización Vector DB (Singleton)
# Esto asegura que Chroma y OpenAI estén listos al arrancar
try:
    vector_db = ChromaDBAdapter()
    retriever = StrategicRetriever()
except Exception as e:
    logger.critical(f"Failed to initialize AI Memory Core: {e}")

app = FastAPI(title="LeadBoostAI Block 10: Evolutionary Memory Brain")
router = APIRouter(prefix="/memory")

# --- MODELOS ---
class LogCycleRequest(BaseModel):
    action_type: str
    context_data: Dict[str, Any]
    strategy_data: Dict[str, Any]
    governance_data: Dict[str, Any]
    execution_data: Optional[Dict[str, Any]] = None
    outcome_value: Optional[float] = None
    outcome_details: Optional[Dict[str, Any]] = None

class RetrievalRequest(BaseModel):
    query_context: str
    current_metrics: Dict[str, Any]

# --- ENDPOINTS ---

@router.post("/log")
async def log_decision_cycle(
    request: LogCycleRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Loguea en SQL y asíncronamente vectoriza la estrategia para el futuro.
    """
    # 1. Persistencia SQL (Traceability)
    service = TraceabilityService(db) 
    trace = service.log_full_cycle(**request.model_dump())
    
    # 2. Persistencia Vectorial (Evolutionary Memory) - Background Task
    # Solo vectorizamos si la estrategia fue aprobada y ejecutada
    if request.governance_data.get('approved', False):
        background_tasks.add_task(
            _vectorize_memory, 
            trace_id=trace.trace_id, 
            text=str(request.strategy_data.get('reasoning_text', '')),
            context=request.context_data
        )

    return {"status": "logged", "trace_id": trace.trace_id}

def _vectorize_memory(trace_id: str, text: str, context: Dict[str, Any]):
    """Helper function para vectorización en background."""
    if not text: return
    
    metadata = {
        "trace_id": trace_id,
        "timestamp": datetime.now().isoformat(),
        "month": datetime.now().month,
        "sector": context.get('sector', 'general'),
        "trust_score": 1.0 # Score inicial neutro
    }
    
    vector_db.add_memory(
        memory_id=trace_id,
        text=text,
        metadata=metadata,
        trust_score=1.0
    )

@router.post("/retrieve_strategy")
def retrieve_similar_strategies(request: RetrievalRequest):
    """
    Recupera estrategias pasadas exitosas basadas en el contexto actual.
    Aplica Re-ranking por Trust Score.
    """
    strategies = retriever.retrieve_strategy(
        query_text=request.query_context,
        current_context=request.current_metrics
    )
    return {"strategies": strategies}

@router.post("/feedback")
def process_feedback_loop(signal: FeedbackSignal):
    """
    Recibe el resultado real vs esperado y ajusta el Trust Score de la memoria.
    Esto permite al sistema 'aprender' y 'olvidar'.
    """
    retriever.process_feedback(
        memory_id=signal.trace_id,
        real_outcome=signal.real_outcome,
        expected_outcome=signal.expected_outcome
    )
    return {"status": "feedback_processed"}

# --- ENDPOINTS LEGACY (COMPATIBILIDAD) ---
@router.get("/trace/{trace_id}")
def get_trace_details(trace_id: str, db: Session = Depends(get_db)):
    service = TraceabilityService(db) 
    trail = service.get_audit_trail(trace_id)
    if not trail:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trail

@router.get("/history")
def get_system_timeline(limit: int = 20, db: Session = Depends(get_db)):
    learner = LearningCore(db) 
    return learner.get_recent_activity(limit)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)