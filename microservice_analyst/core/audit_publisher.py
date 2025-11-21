import requests
import logging
import json
from datetime import datetime
from typing import Dict, Any

# Configuración de logs interna
logger = logging.getLogger("AuditPublisher")

class AuditPublisher:
    """
    Reportero oficial de Gobernanza.
    Acusa a la IA con el Cerebro Central (B10) sobre sus intenciones.
    """
    def __init__(self, memory_url: str = "http://localhost:8010"):
        self.endpoint = f"{memory_url}/memory/log"
        self.fallback_file = "audit_fallback.json"

    def log_governance_decision(self, 
                                strategy_name: str,
                                context: Dict[str, Any],
                                governance_result: Dict[str, Any]) -> bool:
        
        # Si approved=False, el estado es BLOCKED. Si es True, es PENDING_EXECUTION.
        status = "PENDING_EXECUTION" if governance_result.get("approved") else "BLOCKED_BY_GOVERNANCE"
        
        payload = {
            "action_type": strategy_name,
            "context_data": context,
            "strategy_data": {
                "intent": "strategy_proposal",
                "source": "Analyst_Block_6"
            },
            "governance_data": governance_result,
            # Si se bloquea, aquí termina la historia. Si se aprueba, esto es solo un capítulo.
            "execution_data": {"status": "skipped"} if status == "BLOCKED_BY_GOVERNANCE" else None,
            "outcome_value": None, 
            "outcome_details": {"audit_stage": "governance_check"}
        }

        try:
            # Timeout corto (2s) para no afectar latencia de decisión
            response = requests.post(self.endpoint, json=payload, timeout=2)
            if response.status_code == 200:
                trace_id = response.json().get("trace_id")
                logger.info(f"⚖️ Auditoría registrada. Trace ID: {trace_id} | Status: {status}")
                return True
        except Exception as e:
            logger.warning(f"⚠️ Fallo al contactar Memoria: {e}")
            self._save_fallback(payload)
            return False

    def _save_fallback(self, payload):
        # Guardado simple en disco (Append mode)
        try:
            with open(self.fallback_file, "a") as f:
                f.write(json.dumps(payload) + "\n")
        except:
            pass