# microservice_memory/main.py

from fastapi import FastAPI, Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
from database import engine, Base, get_db # Asumimos que estos existen
from services.traceability import TraceabilityService
from services.learning_core import LearningCore # Asumimos que este existe
from pydantic import BaseModel
from typing import Dict, Any, Optional, List

# Creación de tablas de la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LeadBoostAI Block 10: Memory Brain")
router = APIRouter(prefix="/memory")

# Modelo de solicitud para el log de ciclo completo (POST /memory/log)
class LogCycleRequest(BaseModel):
    action_type: str
    context_data: Dict[str, Any]
    strategy_data: Dict[str, Any]
    governance_data: Dict[str, Any]
    execution_data: Optional[Dict[str, Any]] = None
    outcome_value: Optional[float] = None
    outcome_details: Optional[Dict[str, Any]] = None

# Modelo para el endpoint de historial (GET /memory/history)
class HistoryTrace(BaseModel):
    trace_id: str
    timestamp: str
    action: str
    status: str
    score: Optional[float]

@router.post("/log")
def log_decision_cycle(request: LogCycleRequest, db: Session = Depends(get_db)):
    """Endpoint principal de logging usado por B7/B6/B8."""
    service = TraceabilityService(db) 
    trace = service.log_full_cycle(**request.model_dump())
    return {"status": "logged", "trace_id": trace.trace_id}

# El endpoint que falló en el Paso 2
@router.get("/trace/{trace_id}")
def get_trace_details(trace_id: str, db: Session = Depends(get_db)):
    """Retorna el detalle forense completo de una traza (Usado por verify_trace.py)."""
    service = TraceabilityService(db) 
    trail = service.get_audit_trail(trace_id)
    if not trail:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trail

@router.get("/history", response_model=List[HistoryTrace])
def get_system_timeline(limit: int = 20, db: Session = Depends(get_db)):
    """Endpoint para el feed de actividad ligera (Usado por verify_trace.py - Paso 1)."""
    # Asumimos que LearningCore tiene un constructor que acepta db
    learner = LearningCore(db) 
    # El resultado de get_recent_activity debe coincidir con HistoryTrace
    return learner.get_recent_activity(limit)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    # Puerto de Memoria Central
    uvicorn.run(app, host="0.0.0.0", port=8010)