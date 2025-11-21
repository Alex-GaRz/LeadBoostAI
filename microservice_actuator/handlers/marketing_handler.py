import logging
import time
from typing import Dict, Any
from interfaces.handler_interface import IActionHandler

logger = logging.getLogger("MarketingHandler")

class MarketingHandler(IActionHandler):
    """
    Ejecutor especializado en campañas de Marketing (Meta/Google).
    Simula la latencia y respuesta de APIs reales.
    """
    
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Normalización de Entrada (Dict vs Objeto)
        # Si es dict, usamos .get(). Si es objeto, usamos getattr o punto.
        if isinstance(payload, dict):
            proposal_id = payload.get("proposal_id", "unknown_id")
            platform = payload.get("platform", "generic_platform")
            budget = payload.get("budget", 0)
        else:
            # Fallback por si en el futuro usamos objetos Pydantic
            proposal_id = getattr(payload, "proposal_id", "unknown_id")
            platform = getattr(payload, "platform", "generic_platform")
            budget = getattr(payload, "budget", 0)

        logger.info(f"📢 Iniciando ejecución de campaña [{proposal_id}] en {platform}...")

        # 2. Simulación de Latencia de Red (API Call)
        time.sleep(0.5) 

        # 3. Simulación de Respuesta de API Externa
        # Aquí iría la llamada real: response = requests.post(...)
        
        return {
            "status": "success",
            "platform": platform,
            "external_id": f"EXT-{int(time.time())}",
            "cost_incurred": budget,
            "timestamp": time.time()
        }