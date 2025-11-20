import json
import os
import logging
from models.schemas import StandardPerformanceMetric

# Configuración de persistencia simulada
MEMORY_FILE = "decision_memory_log.json"
logger = logging.getLogger("MemorySync")

class MemorySyncService:
    """
    Puente entre el Actuador+ y el Cerebro de Memoria (Bloque 10).
    En producción, esto sería una llamada gRPC o escritura en Kafka.
    """
    
    def append_to_log(self, metric: StandardPerformanceMetric):
        try:
            entry = metric.model_dump(mode='json')
            
            # Leemos historial existente
            history = []
            if os.path.exists(MEMORY_FILE):
                with open(MEMORY_FILE, 'r') as f:
                    try:
                        history = json.load(f)
                    except json.JSONDecodeError:
                        history = []
            
            # Agregamos nueva entrada
            history.append(entry)
            
            # Escribimos (Simulación de base de datos ACID)
            with open(MEMORY_FILE, 'w') as f:
                json.dump(history, f, indent=2)
                
            logger.info(f"✅ [B10 MEMORY] Feedback almacenado para ExecutionID: {metric.execution_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error sincronizando con memoria: {str(e)}")
            return False