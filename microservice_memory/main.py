from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from services.traceability import TraceabilityService
from services.learning_core import LearningCore
from pydantic import BaseModel
from typing import Dict, Any, Optional

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LeadBoostAI Block 10: Memory Brain")

class LogCycleRequest(BaseModel):
    action_type: str
    context_data: Dict[str, Any]
    strategy_data: Dict[str, Any]
    governance_data: Dict[str, Any]
    execution_data: Optional[Dict[str, Any]] = None
    outcome_value: Optional[float] = None
    outcome_details: Optional[Dict[str, Any]] = None

@app.post("/memory/log")
def log_decision_cycle(request: LogCycleRequest, db: Session = Depends(get_db)):
    service = TraceabilityService(db)
    trace = service.log_full_cycle(
        action_type=request.action_type,
        context_data=request.context_data,
        strategy_data=request.strategy_data,
        governance_data=request.governance_data,
        execution_data=request.execution_data,
        outcome_value=request.outcome_value,
        outcome_details=request.outcome_details
    )
    return {"status": "logged", "trace_id": trace.trace_id}

@app.get("/memory/trace/{trace_id}")
def get_trace_details(trace_id: str, db: Session = Depends(get_db)):
    service = TraceabilityService(db)
    trail = service.get_audit_trail(trace_id)
    if not trail:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trail

@app.get("/memory/insights/performance")
def get_performance_insights(action_type: Optional[str] = None, db: Session = Depends(get_db)):
    learner = LearningCore(db)
    return learner.calculate_success_rate(action_type)

@app.get("/memory/insights/strategies")
def get_best_strategies(db: Session = Depends(get_db)):
    learner = LearningCore(db)
    return learner.get_top_strategies()

# --- NUEVO ENDPOINT ---
@app.get("/memory/history")
def get_system_timeline(limit: int = 20, db: Session = Depends(get_db)):
    """Endpoint para el feed de actividad en tiempo real"""
    learner = LearningCore(db)
    return learner.get_recent_activity(limit)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)