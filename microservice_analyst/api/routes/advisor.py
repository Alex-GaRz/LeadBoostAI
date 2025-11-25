from fastapi import APIRouter, HTTPException
from microservice_analyst.models.schemas import CriticalAlert, ActionProposal
from microservice_analyst.services.strategy_engine import strategy_engine

# Router para todas las rutas del Advisor
router = APIRouter(prefix="/api/advisor", tags=["Advisor"])

@router.post("/recommend", response_model=ActionProposal)
async def generate_recommendation(alert: CriticalAlert):
    """
    Recibe una CriticalAlert y devuelve ActionProposal.
    Endpoint principal para recomendaciones estratégicas.
    """
    try:
        proposal = strategy_engine.generate_strategy(alert)
        return proposal
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando recomendación: {str(e)}")

@router.get("/health")
async def advisor_health_check():
    """
    Health check específico para el subsistema Advisor.
    Verifica que OpenAI esté disponible sin hacer llamadas costosas.
    """
    return {
        "status": "OK",
        "service": "LeadBoostAI Advisor",
        "block": "5",
        "ai_engine": "openai-gpt4"
    }