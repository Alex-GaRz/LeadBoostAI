from fastapi import APIRouter, Depends
from typing import Dict
import httpx
import asyncio
import os
import logging
from auth_middleware import get_current_user 

# Configuración de URLs
ANALYST_URL = os.getenv("URL_MICROSERVICE_ANALYST", "http://localhost:8001")
ACTUATOR_URL = os.getenv("URL_MICROSERVICE_ACTUATOR", "http://localhost:8002")

router = APIRouter(prefix="/dashboard", tags=["Dashboard BFF"])
logger = logging.getLogger("uvicorn")

async def fetch_data_from_service(client, url: str, endpoint: str, mock_fallback: any):
    """Intenta obtener datos reales. Si falla, usa el fallback (mock)."""
    try:
        # Timeout reducido a 1.5s para agilizar la UI
        response = await client.get(f"{url}{endpoint}", timeout=1.5)
        if response.status_code == 200:
            return response.json()
        logger.warning(f"Servicio {url} respondió {response.status_code}. Usando Mock.")
    except Exception as e:
        logger.warning(f"No se pudo conectar a {url}. Usando Mock.")
    return mock_fallback

@router.get("/snapshot")
async def get_dashboard_snapshot(user: Dict = Depends(get_current_user)):
    """
    Endpoint Gateway: Agrega datos de B4, B6 y B7 en paralelo.
    """
    user_email = user.get('email', 'unknown')
    
    # MOCKS (Datos de respaldo)
    mock_alerts = [
        {"id": "MOCK-01", "type": "SYSTEM_OFFLINE", "severity": "LOW", "message": "Servicios de IA desconectados - Mostrando simulación", "timestamp": "2024-01-01T00:00:00Z"}
    ]
    mock_execution = [
        {"id": "MOCK-CMP", "platform": "SIMULATION", "status": "PAUSED", "spend": 0.0, "roas": 0.0}
    ]
    
    # ORQUESTACIÓN PARALELA
    async with httpx.AsyncClient() as client:
        alerts_task = fetch_data_from_service(client, ANALYST_URL, "/alerts/active", mock_alerts)
        execution_task = fetch_data_from_service(client, ACTUATOR_URL, "/campaigns/active", mock_execution)
        
        # Esperamos a que ambas terminen
        alerts_data, execution_data = await asyncio.gather(alerts_task, execution_task)

    return {
        "meta": {
            "user": user_email,
            "mode": "live_integration", 
            "status": "connected"
        },
        "radar": {
            "health_score": 98, 
            "active_alerts": alerts_data 
        },
        "operations": {
            "governance": { 
                "budget_remaining": 4500.00,
                "approval_status": "AUTOMATIC"
            },
            "execution": execution_data
        }
    }