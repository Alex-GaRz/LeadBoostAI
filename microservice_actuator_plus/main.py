from fastapi import FastAPI, HTTPException, BackgroundTasks
from models.schemas import WebhookPayload
from core.normalizer import MetricsNormalizerService
from core.memory_sync import MemorySyncService
import logging

# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ActuatorPlus")

app = FastAPI(title="LeadBoostAI Block 8: Actuator+ (Feedback Loop)")

# Inyección de Dependencias
normalizer_service = MetricsNormalizerService()
memory_service = MemorySyncService()

def process_feedback_task(payload: WebhookPayload):
    """Tarea en background para no bloquear la respuesta al webhook"""
    try:
        logger.info(f"📨 Recibido feedback de {payload.source} para {payload.execution_id}")
        
        # 1. Normalizar
        standard_metric = normalizer_service.process(payload)
        
        # 2. Sincronizar con Memoria (Bloque 10)
        success = memory_service.append_to_log(standard_metric)
        
        if success:
            logger.info(f"🔄 Ciclo cerrado exitosamente. Score: {standard_metric.performance_score}")
        else:
            logger.warning("⚠️ Fallo en sincronización de memoria")
            
    except Exception as e:
        logger.error(f"🔥 Error procesando feedback: {str(e)}")

@app.post("/feedback/webhook", status_code=202)
async def receive_feedback_webhook(payload: WebhookPayload, background_tasks: BackgroundTasks):
    """
    Endpoint universal para recibir datos de rendimiento.
    Responde 202 Accepted rápidamente y procesa en segundo plano.
    """
    # Validación básica ya hecha por Pydantic en payload
    background_tasks.add_task(process_feedback_task, payload)
    return {"status": "accepted", "message": "Processing feedback in background"}

@app.get("/health")
def health_check():
    return {"status": "operational", "block": "8 - Actuator+"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)