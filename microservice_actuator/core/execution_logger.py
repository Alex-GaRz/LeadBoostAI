import requests
import logging
from typing import Dict, Any
from models.schemas import ExecutionResult, ActionStatus
from datetime import datetime

logger = logging.getLogger("ExecutionLogger")
# CORRECCIÓN DE PUERTO: Usamos 8010, que es donde corre tu B10
MEMORY_BASE_URL = "http://localhost:8010/memory" 

class ExecutionLogger:
    """
    Cliente HTTP para registrar eventos de ejecución en el Bloque 10 (Central Memory).
    Envía datos simulando el ciclo completo (B4-B8) para cumplir con el contrato de B10 (LogCycleRequest).
    """
    
    def log_execution_result(self, result: ExecutionResult):
        """Envía el resultado final de la acción al endpoint POST /memory/log de B10."""
        
        # 1. Preparar la estructura de ejecución para B10
        execution_data = {
            "id": result.execution_id,
            "status": result.status.value,
            "details": result.details,
            "error": result.error_message,
            "timestamp": result.timestamp.isoformat()
        }
        
        # 2. Simular el resto de datos del ciclo (Contexto, Estrategia, Gobernanza)
        # B10 espera esto, por lo que B7 debe simular los datos de sus bloques predecesores.
        simulated_data = {
            "action_type": result.details.get("platform", "MARKETING_CAMPAIGN"), # Usamos el platform como tipo de acción
            "context_data": {"source": "B4_SIMULATED", "sku": result.details['erp_feedback'].get('sku', 'PROD-001')},
            "strategy_data": {"reasoning": "Quick execution after B6 approval."},
            "governance_data": {"approved": True, "reason": "Inventory checked by B6."},
            "execution_data": execution_data,
            "outcome_value": result.details['erp_feedback'].get('remaining_stock'), # Usamos stock como métrica de outcome principal
            "outcome_details": result.details
        }
        
        # 3. Llamada al endpoint correcto: POST /memory/log
        try:
            response = requests.post(f"{MEMORY_BASE_URL}/log", json=simulated_data, timeout=1)
            response.raise_for_status()
            logger.info(f"✅ Traceabilidad B7 -> B10 registrada (HTTP {response.status_code}).")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Fallo al reportar a B10 (Error no bloqueante): {e}.")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"   Detalle B10: {e.response.text}")
            return False