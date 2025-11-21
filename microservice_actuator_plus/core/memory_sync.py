import logging
from core.memory_client import MemoryClient

logger = logging.getLogger("MemorySyncService")

class MemorySyncService:
    """
    Servicio de Alto Nivel que desacopla la lógica de negocio (Actuator)
    de la lógica de transporte (MemoryClient).
    """
    
    def __init__(self):
        # Instanciamos el cliente Enterprise
        self.client = MemoryClient()

    def sync_decision_outcome(self, platform: str, data: dict, normalized_metrics: dict):
        """
        Orquesta el envío de datos normalizados al cerebro central.
        """
        logger.info(f"🔄 Iniciando sincronización para {platform}...")

        # 1. Extraer métrica clave (normalización simple)
        outcome_value = normalized_metrics.get('roi', 0) / 10.0 
        if outcome_value > 1.0: outcome_value = 1.0
        
        # 2. Preparar datos de ejecución
        execution_snapshot = {
            "platform": platform,
            "raw_id": data.get('id', 'unknown'),
            "timestamp": data.get('timestamp', 'now')
        }

        # 3. Delegar al cliente
        success = self.client.send_cycle_result(
            action_type=f"MARKETING_CAMPAIGN_{platform.upper()}",
            execution_data=execution_snapshot,
            outcome_metric=outcome_value,
            outcome_details=normalized_metrics
        )

        return success