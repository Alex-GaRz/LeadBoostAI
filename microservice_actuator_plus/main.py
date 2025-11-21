from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any
import uvicorn
import logging

# Importaciones internas
from core.normalizer import MetricsNormalizer
from core.memory_sync import MemorySyncService

# Configuración de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ActuatorPlus")

app = FastAPI(title="LeadBoostAI Block 8: Actuator+ (Feedback Loop Integration)")

# Instancias Singleton de Servicios
normalizer = MetricsNormalizer()
memory_service = MemorySyncService()

class WebhookPayload(BaseModel):
    source: str
    data: Dict[str, Any]

@app.get("/")
def health_check():
    return {"status": "operational", "mode": "integrated_closed_loop"}

@app.post("/webhook/feedback")
async def receive_feedback(payload: WebhookPayload):
    """
    Endpoint principal que recibe datos de plataformas externas (Meta/Google),
    los normaliza y los envía al Cerebro Central (B10).
    """
    try:
        logger.info(f"📥 Webhook recibido de: {payload.source}")
        
        # PASO 1: Normalización (Estandarizar el caos de las APIs externas)
        normalized_metrics = normalizer.normalize(payload.source, payload.data)
        logger.info(f"📊 Métricas Normalizadas: {normalized_metrics}")
        
        # PASO 2: Sincronización Neural (Enviar a Memoria)
        # Aquí es donde ocurre la magia de la integración B8 -> B10
        sync_success = memory_service.sync_decision_outcome(
            platform=payload.source,
            data=payload.data,
            normalized_metrics=normalized_metrics
        )
        
        status_msg = "Synced with Brain" if sync_success else "Saved to Fallback"
        
        return {
            "status": "processed", 
            "normalization": "success",
            "memory_sync": status_msg,
            "metrics": normalized_metrics
        }

    except Exception as e:
        logger.error(f"🔥 Error procesando feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Correr en puerto 8001 (Diferente al B10 que está en 8010)
    uvicorn.run(app, host="0.0.0.0", port=8001)

@app.get("/health")
def health_check():
    return {"status": "operational", "block": "8 - Actuator+"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)