import httpx
from fastapi import APIRouter, HTTPException
import os

router = APIRouter(tags=["Safety & Enterprise"])

# URL del servicio Enterprise (Safety)
ENTERPRISE_SERVICE_URL = os.getenv("ENTERPRISE_SERVICE_URL", "http://localhost:8011")

@router.get("/status")
async def get_safety_status():
    """
    Proxy para obtener el estado del 'Kill Switch' y alertas de inventario
    desde el Microservicio Enterprise.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Simulamos timeout corto para no bloquear el dashboard si Enterprise está caído
            resp = await client.get(f"{ENTERPRISE_SERVICE_URL}/api/safety/status", timeout=2.0)
            
            if resp.status_code == 200:
                return resp.json()
            else:
                # Si el servicio responde error, devolvemos estado degradado pero controlado
                return {
                    "kill_switch_active": False,
                    "inventory_status": "UNKNOWN",
                    "system_health": "DEGRADED",
                    "message": f"Enterprise Service returned {resp.status_code}"
                }
    except Exception as e:
        # Fallback si el servicio no está disponible (simulación para desarrollo)
        print(f"⚠️ [BFF] Enterprise Service unreachable: {e}")
        return {
            "kill_switch_active": False,
            "inventory_status": "OPTIMAL", # Asumimos óptimo por defecto para no bloquear UI
            "system_health": "OFFLINE",
            "active_alerts": [],
            "message": "Enterprise Service Unreachable - Using Cached/Default State"
        }
