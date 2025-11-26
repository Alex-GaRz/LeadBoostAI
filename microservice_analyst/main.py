import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fastapi import FastAPI
from datetime import datetime
import uvicorn
from models.schemas import MarketSignal
from services.analyst_service import AnalystService
from api.routes.advisor import router as advisor_router
from api.routes.governance import router as governance_router
from api.routes.search import router as search_router

app = FastAPI(title="LeadBoostAI Analyst Engine (Block 4)")

# --- MEMORIA COMPARTIDA DE ALERTAS (B6 escribe aquí, B9 lee de aquí) ---
ALERT_MEMORY = []

# Inyectar memoria en el Governance Engine (Monkey Patching para la demo)
from core.governance_engine import GovernanceEngine
# Re-instanciamos el engine global usado en el router
import api.routes.governance as gov_routes

# Función para que Governance reporte aquí
def report_alert(alert_data):
    ALERT_MEMORY.insert(0, alert_data)
    if len(ALERT_MEMORY) > 10: ALERT_MEMORY.pop()

# Vinculamos al engine existente
gov_routes.engine.report_callback = report_alert

# --- RESTO DEL SERVICIO ---
try:
    service = AnalystService()
except Exception as e:
    print(f"⚠️ Error iniciando AnalystService: {e}")
    service = None

app.include_router(advisor_router)
app.include_router(governance_router)
app.include_router(search_router)

@app.get("/alerts/active")
def get_active_alerts():
    """
    El BFF (Bloque 9) consulta este endpoint. 
    Ahora devuelve alertas reales generadas por Gobernanza.
    """
    # Alertas base
    base_alerts = [
        {
            "id": "LIVE-B4-001",
            "type": "SYSTEM_STATUS",
            "severity": "LOW",
            "message": "Bloque 4 Operativo - Monitoreando Mercado",
            "timestamp": datetime.now().isoformat()
        }
    ]
    return ALERT_MEMORY + base_alerts

@app.get("/")
def health():
    return {"status": "operational", "mode": "WAR_GAME_READY"}

@app.post("/predict")
def predict(signal: MarketSignal):
    if service:
        return service.analyze_signal(signal)
    return {"error": "Service not initialized"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)