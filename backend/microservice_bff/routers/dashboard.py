from fastapi import APIRouter, Depends
from typing import Dict
# 👇 CORRECCIÓN: Usamos imports absolutos, sin los ".."
from auth_middleware import get_current_user
from services.aggregator_service import AggregatorService

router = APIRouter(prefix="/dashboard", tags=["Dashboard BFF"])

# Instancia Singleton del servicio (Mantiene la conexión a Firestore viva)
aggregator = AggregatorService()

@router.get("/snapshot")
async def get_dashboard_snapshot(user: Dict = Depends(get_current_user)):
    """
    Endpoint Gateway:
    Unifica B4 (Alertas), B7 (Ejecución) y B1 (Inteligencia de Mercado)
    """
    user_email = user.get('email', 'unknown')
    
    # Delegamos la lógica compleja al servicio agregador
    snapshot = await aggregator.get_dashboard_snapshot(user_email)
    
    return snapshot