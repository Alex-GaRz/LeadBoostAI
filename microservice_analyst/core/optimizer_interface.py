import requests
import logging

B12_OPTIMIZER_URL = "http://localhost:8012/api/v1/optimizer/recommendation"
logger = logging.getLogger("GlobalOptimizerClient")

class GlobalOptimizerClient:
    """
    Cliente para consultar el servicio de optimización global (B12).
    """
    def get_optimal_strategy(self, financial_status, inventory_snapshot, history):
        payload = {
            "financial_status": financial_status,
            "inventory_snapshot": inventory_snapshot,
            "historical_performance": history,
            "current_strategy_id": "STRAT-AUTO-GEN"
        }
        try:
            response = requests.post(B12_OPTIMIZER_URL, json=payload, timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Error consultando B12: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"No se pudo conectar con B12: {e}")
            return None
