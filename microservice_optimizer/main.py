import asyncio
import json
import logging
import os
import sys
from contextlib import asynccontextmanager


# 1. FIX DE PATH: Permitir ver archivos en la raíz (math_core.py)
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi import FastAPI
import redis.asyncio as redis 


# 2. IMPORTS
from microservice_optimizer.core.math_core import ROIPredictor
from microservice_optimizer.core.trainer import ModelTrainer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OptimizerBrain")

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Instancia Global del Modelo
roi_model = ROIPredictor()
# Instancia del Entrenador
trainer = ModelTrainer(roi_model)

async def redis_listener():
    """Proceso en segundo plano que escucha el latido del sistema"""
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, decode_responses=True)
        pubsub = r.pubsub()
        await pubsub.subscribe("system_events")
        
        logger.info(f"👂 [Optimizer] Escuchando canal 'system_events' en Redis...")

        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message["data"]
                try:
                    event = json.loads(data)
                    if event.get("type") == "NEW_DATA":
                        logger.info(f"⚡ [TRIGGER] Señal recibida. Activando Trainer...")
                        trainer.process_pending_data()
                        
                except json.JSONDecodeError:
                    logger.warning(f"Mensaje corrupto: {data}")
    except Exception as e:
        logger.error(f"❌ Error en listener de Redis: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(redis_listener())
    yield
    task.cancel()

app = FastAPI(
    title="LeadBoost Optimizer API",
    description="Optimization engine with ROI prediction and Brand Genome governance",
    version="2.0.0",
    lifespan=lifespan
)

# ============================================================
# INCLUDE GOVERNANCE ROUTER (Phase 5.2)
# ============================================================
try:
    from microservice_optimizer.api.governance_routes import router as governance_router
    app.include_router(governance_router)
    logger.info("✅ Governance API routes registered")
except ImportError as e:
    logger.warning(f"⚠️ Could not load governance routes: {e}")
    logger.warning("Install shared_lib first: cd shared_lib && pip install -e .")

# ============================================================
# LEGACY ENDPOINTS (ROI Prediction)
# ============================================================

@app.get("/")
def health_check():
    return {
        "status": "active", 
        "model_fitted": roi_model.is_fitted,
        "training_samples": roi_model.training_count
    }

@app.post("/predict")
def predict_roi(budget: float, platform: str, ctr: float):
    roi, conf = roi_model.predict_roi(budget, platform, ctr)
    return {"predicted_roi": roi, "confidence": conf}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("microservice_optimizer.main:app", host="0.0.0.0", port=8000, reload=True)