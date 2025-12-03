from fastapi import APIRouter, HTTPException, Depends
from services.aggregator_service import StrategyAggregator, CampaignBlueprint
from starlette.requests import Request

# Dependencia para el agregador
def get_aggregator(request: Request) -> StrategyAggregator:
    # Usamos la base_url de la request si está disponible, sino el default
    base_url = str(request.base_url)[:-1] if request else "http://localhost:8000"
    return StrategyAggregator(bff_url=base_url)

router = APIRouter(
    prefix="/strategy",
    tags=["Strategy & Blueprints"]
)

@router.get(
    "/{strategy_id}/blueprint", 
    response_model=CampaignBlueprint
)
async def get_strategy_blueprint(
    strategy_id: str,
    regenerate: bool = False,  # <--- NUEVO PARÁMETRO
    aggregator: StrategyAggregator = Depends(get_aggregator)
):
    try:
        # Pasamos el flag 'regenerate' al servicio
        blueprint = await aggregator.get_strategy_blueprint(strategy_id, force_regenerate=regenerate)
        return blueprint
    except Exception as e:
        print(f"Error al generar Blueprint para {strategy_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))