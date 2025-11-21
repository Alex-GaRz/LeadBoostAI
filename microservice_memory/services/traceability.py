from sqlalchemy.orm import Session
from models.memory_models import DecisionTrace
import json

class TraceabilityService:
    def __init__(self, db: Session):
        self.db = db

    def log_full_cycle(self, 
                       action_type: str,
                       context_data: dict,
                       strategy_data: dict,
                       governance_data: dict,
                       execution_data: dict = None,
                       outcome_value: float = None,
                       outcome_details: dict = None):
        """
        Crea el Registro Maestro. 
        Idealmente llamado por el Orquestador al finalizar el ciclo o 
        por el Bloque 8 cuando cierra el feedback loop.
        """
        
        # Determinar estado final basado en gobernanza y ejecución
        status = "COMPLETED"
        if not governance_data.get("approved", False):
            status = "BLOCKED_BY_GOVERNANCE"
        elif execution_data and execution_data.get("error"):
            status = "EXECUTION_ERROR"

        new_trace = DecisionTrace(
            action_type=action_type,
            status=status,
            context_snapshot=context_data,
            strategy_snapshot=strategy_data,
            governance_result=governance_data,
            execution_details=execution_data,
            execution_id=execution_data.get("id") if execution_data else None,
            outcome_metric=outcome_value,
            outcome_raw=outcome_details
        )
        
        self.db.add(new_trace)
        self.db.commit()
        self.db.refresh(new_trace)
        return new_trace

    def get_audit_trail(self, trace_id: str):
        """
        Reconstruye la historia lineal para un humano o auditor.
        """
        record = self.db.query(DecisionTrace).filter(DecisionTrace.trace_id == trace_id).first()
        if not record:
            return None
            
        return {
            "meta": {
                "trace_id": record.trace_id,
                "timestamp": record.timestamp,
                "status": record.status,
                "score": record.outcome_metric
            },
            "timeline": [
                {"step": "1. SIGNAL", "data": record.context_snapshot},
                {"step": "2. REASONING", "data": record.strategy_snapshot},
                {"step": "3. GOVERNANCE", "data": record.governance_result},
                {"step": "4. EXECUTION", "data": record.execution_details},
                {"step": "5. OUTCOME", "data": record.outcome_raw}
            ]
        }