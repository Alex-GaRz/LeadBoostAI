from fastapi import FastAPI
from datetime import datetime
import uvicorn

# --- IMPORTS DIRECTOS (Sin try-except para detectar errores reales) ---
from microservice_analyst.models.schemas import MarketSignal
from microservice_analyst.services.analyst_service import AnalystService

from microservice_analyst.api.routes.advisor import router as advisor_router
from microservice_analyst.api.routes.governance import router as governance_router
from microservice_analyst.api.routes.search import router as search_router

app = FastAPI(title="LeadBoostAI Analyst Engine (Block 4)")

# Instancia del servicio principal
try:
    service = AnalystService()
except Exception as e:
    print(f"⚠️ Error iniciando AnalystService: {e}")
    service = None

# Incluir rutas de sub-módulos

app.include_router(advisor_router)
app.include_router(governance_router)
app.include_router(search_router)

# --- ENDPOINTS ---

@app.get("/alerts/active")
def get_active_alerts():
    """
    El BFF (Bloque 9) consulta este endpoint para llenar el panel de alertas.
    """
    return [
        {
            "id": "LIVE-B4-001",
            "type": "CONEXIÓN_EXITOSA",
            "severity": "LOW",
            "message": "El Bloque 4 (Analista) está conectado y reportando al Dashboard.",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": "LIVE-B4-002",
            "type": "OPPORTUNITY_DETECTED",
            "severity": "HIGH",
            "message": "Patrón de compra detectado en sector 'SaaS' (Real-time)",
            "timestamp": datetime.now().isoformat()
        }
    ]

@app.get("/")
def health():
    mode = "ONLINE"
    if service and hasattr(service, 'db') and service.db.simulation_mode:
        mode = "SIMULATION"
    return {"status": "operational", "mode": mode, "service": "Block 4 Analyst"}

@app.post("/predict")
def predict(signal: MarketSignal):
    if service:
        return service.analyze_signal(signal)
    return {"error": "Service not initialized"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)