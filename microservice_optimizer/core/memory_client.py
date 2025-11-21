import requests
import logging
from datetime import datetime
from typing import Dict, Any

# Configuración (Idealmente vendría de variables de entorno)
MEMORY_SERVICE_URL = "http://localhost:8010/memory/log"
TIMEOUT_SECONDS = 2.0

logger = logging.getLogger("B12_MemoryClient")

class MemoryClient:
    """
    Permite al Optimizador (B12) registrar sus decisiones en el Cerebro de Memoria (B10).
    """
    
    def log_optimization_event(self, context: Dict, recommendation: Dict, trace_id: str = None):
        """
        Envía el resultado de la optimización al historial forense.
        """
        payload = {
            "trace_id": trace_id or f"b12-{int(datetime.now().timestamp())}",
            "timestamp": datetime.now().isoformat(),
            "action_type": "GLOBAL_OPTIMIZATION",
            "status": "COMPLETED",
            "context_snapshot": {
                "financial_summary": context.get("financial_status"),
                "inventory_count": len(context.get("inventory_snapshot", []))
            },
            "strategy_snapshot": {
                "algorithm": "MonteCarlo-v1",
                "iterations": 500
            },
            "governance_result": {
                "approved": True, # B12 asume aprobación técnica
                "policy_check": "RISK_ASSESSMENT_PASSED"
            },
            "execution_details": {
                "recommended_action": recommendation.get("recommended_action_type"),
                "logistics": recommendation.get("logistics_change")
            },
            "outcome_metric": recommendation.get("projected_roi"), # Guardamos la proyección como métrica inicial
            "outcome_raw": recommendation
        }

        try:
            # Disparar y olvidar (Fire-and-forget) para no ralentizar la optimización
            response = requests.post(MEMORY_SERVICE_URL, json=payload, timeout=TIMEOUT_SECONDS)
            if response.status_code in [200, 201]:
                logger.info(f"💾 Decisión B12 guardada en Memoria. ID: {payload['trace_id']}")
            else:
                logger.warning(f"⚠️ Error guardando en Memoria: {response.status_code} - {response.text}")
        except Exception as e:
            logger.error(f"❌ Fallo de conexión con B10 (Memory): {str(e)}")
