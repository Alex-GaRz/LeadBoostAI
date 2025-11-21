# microservice_memory/services/traceability.py

from sqlalchemy.orm import Session
from models.memory_models import DecisionTrace # Asumimos que este modelo existe
import json
from typing import Dict, Any, Optional

class TraceabilityService:
    """Servicio de trazabilidad forense para el Bloque 10."""
    
    # CORRECCIÓN CLAVE: El constructor debe aceptar la sesión
    def __init__(self, db: Session): 
        self.db = db

    def log_full_cycle(self, 
                       action_type: str,
                       context_data: dict,
                       strategy_data: dict,
                       governance_data: dict,
                       execution_data: Optional[dict] = None,
                       outcome_value: Optional[float] = None,
                       outcome_details: Optional[dict] = None):
        """
        Crea el Registro Maestro de la decisión.
        """
        
        status = governance_data.get("governance_status", "PENDING")
        if status == "REJECTED":
            status = "BLOCKED_BY_GOVERNANCE"
        elif execution_data and execution_data.get("status") == "EXECUTED":
             status = "COMPLETED"
        elif execution_data and execution_data.get("status") == "FAILED":
             status = "EXECUTION_ERROR"

        new_trace = DecisionTrace(
            action_type=action_type,
            status=status,
            context_snapshot=context_data,
            strategy_snapshot=strategy_data,
            governance_result=governance_data,
            # Aseguramos que los campos se tomen del diccionario
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
        Retorna la historia lineal completa para un auditor (usada por verify_trace.py).
        """
        record = self.db.query(DecisionTrace).filter(DecisionTrace.trace_id == trace_id).first()
        if not record:
            return None
            
        # IMPORTANTE: Los datos de ejecución deben ser serializados antes de retornar
        return {
            "meta": {
                "trace_id": record.trace_id,
                "timestamp": str(record.timestamp),
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