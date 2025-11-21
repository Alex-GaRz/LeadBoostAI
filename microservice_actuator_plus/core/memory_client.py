import requests
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Configuración de Logging
logger = logging.getLogger("MemoryClient")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter('%(asctime)s - [MEMORY_CLIENT] - %(levelname)s - %(message)s'))
    logger.addHandler(handler)

class MemoryClient:
    """
    Cliente HTTP encargado de transmitir el conocimiento del Bloque 8 (Resultados)
    hacia el Bloque 10 (Cerebro Central).
    """
    
    def __init__(self, base_url: str = "http://localhost:8010"):
        self.base_url = base_url
        self.endpoint = f"{base_url}/memory/log"
        self.fallback_file = "memory_fallback_queue.json"

    def send_cycle_result(self, 
                          action_type: str,
                          execution_data: Dict[str, Any],
                          outcome_metric: float,
                          outcome_details: Dict[str, Any]) -> bool:
        """
        Intenta enviar el ciclo al cerebro. Si falla, activa protocolo de fallback.
        """
        
        payload = {
            "action_type": action_type,
            "context_data": {
                "source": "closed_loop_integration",
                "inferred_from": "actuator_plus_feedback"
            },
            "strategy_data": {
                "strategy": "dynamic_adjustment", 
                "note": "Logged via feedback loop"
            },
            "governance_data": {
                "approved": True,
                "method": "auto_validated"
            },
            "execution_data": execution_data,
            "outcome_value": outcome_metric,
            "outcome_details": outcome_details
        }

        try:
            response = requests.post(self.endpoint, json=payload, timeout=5)
            
            if response.status_code == 200:
                trace_id = response.json().get("trace_id")
                logger.info(f"✅ Sincronización Exitosa. Trace ID: {trace_id}")
                return True
            else:
                logger.error(f"❌ Error del Servidor de Memoria: {response.status_code}")
                self._save_to_fallback(payload)
                return False

        except Exception as e:
            logger.warning(f"⚠️ Servidor de Memoria (B10) NO DISPONIBLE: {e}. Activando Fallback.")
            self._save_to_fallback(payload)
            return False

    def _save_to_fallback(self, payload: Dict[str, Any]):
        """
        Mecanismo de seguridad: Guarda los datos en disco si el cerebro no responde.
        """
        try:
            queue = []
            try:
                with open(self.fallback_file, 'r') as f:
                    queue = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                queue = []

            payload['_local_timestamp'] = str(datetime.now())
            queue.append(payload)

            with open(self.fallback_file, 'w') as f:
                json.dump(queue, f, indent=2)
            
            logger.info(f"💾 Datos guardados en Fallback Local ({len(queue)} items en cola)")
        except Exception as e:
            logger.error(f"💀 ERROR FATAL: No se pudo guardar ni en red ni en disco: {e}")