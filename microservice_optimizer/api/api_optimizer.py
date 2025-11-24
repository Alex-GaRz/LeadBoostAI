
from fastapi import APIRouter, HTTPException
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.memory_client import MemoryClient
from models.global_context_models import OptimizationContext
from models.optimization_result_models import GlobalRecommendation
from logic.optimizer_engine import MonteCarloOptimizer # Importamos el motor
import logging


# Configuración de Logs
logger = logging.getLogger("B12_Optimizer")

router = APIRouter()

def calculate_global_optimization(context: OptimizationContext) -> GlobalRecommendation:
    """
    Punto de entrada de la lógica de negocio.
    Instancia el motor de Monte Carlo y ejecuta la simulación.
    """
    try:
        # Inicializar el motor con el contexto recibido
        # Simulamos 7 días con 500 iteraciones para respuesta rápida en API
        optimizer = MonteCarloOptimizer(context, simulation_days=7, iterations=500)
        
        # Ejecutar la búsqueda de la "Ruta Dorada"
        result = optimizer.run_simulation()
        
        logger.info(f"Optimización completada. Acción: {result.recommended_action_type} | ROI: {result.projected_roi:.4f}")
        return result
        
    except Exception as e:
        logger.error(f"Error crítico en el motor de optimización: {str(e)}")
        # Fallback seguro en caso de error matemático
        return GlobalRecommendation(
            recommended_action_type="NO_ACTION",
            pricing_adjustment=0.0,
            logistics_change="ERROR_INVESTIGATION_REQUIRED",
            projected_roi=0.0,
            justification=f"Error interno en cálculo de optimización: {str(e)}"
        )

@router.post("/optimizer/recommendation", response_model=GlobalRecommendation, status_code=200)
async def get_global_recommendation(context: OptimizationContext):
    """
    Endpoint principal. Recibe el snapshot B10/B11 y devuelve la estrategia ganadora.
    """
    recommendation = calculate_global_optimization(context)
    # 2. Recordar (Efecto secundario asíncrono)
    # Convertimos modelos Pydantic a dict para el logger
    try:
        mem_client = MemoryClient()
        mem_client.log_optimization_event(
            context=context.model_dump(), 
            recommendation=recommendation.model_dump()
        )
    except Exception as e:
        logger.error(f"No se pudo registrar en memoria (Non-blocking): {e}")

    return recommendation

# --- CORRECCIÓN AQUÍ ---
# Definir la APP a nivel global para que Uvicorn la encuentre
from fastapi import FastAPI
app = FastAPI(
    title="B12: Global Optimization Service",
    description="API para recomendar acciones estratégicas basadas en el contexto total del negocio.",
    version="1.0.0"
)

# Conectar el router
app.include_router(router, prefix="/api/v1")

# El bloque main solo sirve si ejecutas el archivo directamente con python (python api_optimizer.py)
if __name__ == "__main__":
    import uvicorn
    print("Iniciando servicio de Bloque 12 en http://127.0.0.1:8012")
    uvicorn.run(app, host="0.0.0.0", port=8012)
