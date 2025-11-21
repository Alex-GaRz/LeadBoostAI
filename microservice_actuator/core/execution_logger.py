import requests
import logging
import json
from typing import Dict, Any

logger = logging.getLogger("ExecutionLogger")

class ExecutionLogger:
    """
    Bitácora de Vuelo del Actuador.
    Reporta al cerebro si el misil salió del silo o explotó en la rampa.
    """
    def __init__(self, memory_url: str = "http://localhost:8010"):
        self.endpoint = f"{memory_url}/memory/log"

    def log_execution_attempt(self, 
                              action_type: str,
                              execution_details: Dict[str, Any],
                              success: bool) -> bool:
        
        status = "EXECUTED" if success else "EXECUTION_ERROR"
        
        payload = {
            "action_type": action_type,
            # No tenemos el contexto completo aquí, pero lo vinculamos por ID
            "context_data": {"source": "actuator_execution_log"}, 
            "strategy_data": {"note": "Post-execution report"},
            "governance_data": {"approved": True, "note": "Implicit approval"},
            "execution_data": execution_details,
            "outcome_value": 1.0 if success else 0.0, # KPI Técnico (No de negocio)
            "outcome_details": {"status": status}
        }

        try:
            requests.post(self.endpoint, json=payload, timeout=2)
            return True
        except Exception as e:
            logger.error(f"⚠️ No se pudo loguear la ejecución en B10: {e}")
            return False