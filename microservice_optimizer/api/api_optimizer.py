from fastapi import APIRouter, HTTPException, BackgroundTasks
import sys
import os
from pydantic import BaseModel

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.memory_client import MemoryClient
from core.math_core import ROIPredictor
from models.global_context_models import OptimizationContext
from models.optimization_result_models import GlobalRecommendation
from logic.optimizer_engine import MonteCarloOptimizer
import logging

# Configuración de Logs
logger = logging.getLogger("B12_Optimizer")
router = APIRouter()

# Instancia Global del Predictor para entrenamiento
predictor_engine = ROIPredictor()

class TrainingData(BaseModel):
    budget_spent: float
    platform_id: str
    historical_ctr: float
    actual_roi_achieved: float

@router.post("/recommendation", response_model=GlobalRecommendation)
async def get_global_recommendation(context: OptimizationContext):
    """
    Endpoint principal. Utiliza el ROIPredictor interno.
    """
    try:
        # Instanciar Optimizer (que carga el MathCore)
        optimizer = MonteCarloOptimizer(context)
        result = optimizer.run_simulation()
        
        logger.info(f"Optimización MathCore completada. ROI: {result.projected_roi:.4f}")
        return result
        
    except Exception as e:
        logger.error(f"Error en MathCore: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train", status_code=202)
async def train_model(data: TrainingData, background_tasks: BackgroundTasks):
    """
    Endpoint de Feedback Loop.
    Recibe datos reales de campañas finalizadas para calibrar el modelo SGD.
    """
    def _background_train():
        logger.info(f"Iniciando entrenamiento incremental para {data.platform_id}...")
        predictor_engine.train_incremental(
            budget=data.budget_spent,
            platform_id=data.platform_id,
            historical_ctr=data.historical_ctr,
            actual_roi=data.actual_roi_achieved
        )
        logger.info("Modelo calibrado y guardado correctamente.")

    background_tasks.add_task(_background_train)
    return {"status": "training_queued", "message": "El modelo está aprendiendo de estos nuevos datos."}

# Configuración Global de App (para ejecución standalone)
from fastapi import FastAPI
app = FastAPI(
    title="B12: MathCore Optimizer",
    version="2.0.0 (SGD Enabled)"
)
app.include_router(router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)