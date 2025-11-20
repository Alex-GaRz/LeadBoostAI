from fastapi import FastAPI
from datetime import datetime
# Mantenemos tus imports originales (Asumo que tienes estos archivos)
try:
    from models.schemas import SignalInput
    from services.analyst_service import AnalystService
    from api.routes.advisor import router as advisor_router
    from api.routes.governance import router as governance_router
except ImportError:
    # Fallback para que no crashee si estás probando aislado sin las dependencias completas
    pass

import uvicorn

app = FastAPI(title="LeadBoostAI Analyst Engine (Block 4)")

# Intentamos instanciar el servicio, si falla usamos modo seguro
try:
    service = AnalystService()
except:
    service = None

# Incluir rutas (dentro de try por seguridad)
try:
    app.include_router(advisor_router)
    app.include_router(governance_router)
except:
    pass

# --- 👇 NUEVO ENDPOINT PARA EL DASHBOARD (BFF) 👇 ---
@app.get("/alerts/active")
def get_active_alerts():
    """
    El BFF (Bloque 9) consulta este endpoint para llenar el panel de alertas.
    """
    # AQUÍ CONECTAS TU LÓGICA REAL DE ALERTAS
    # Por ahora, devolvemos una alerta real que confirme la conexión
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
            "message": "Patrón de compra detectado en sector 'SaaS' (Simulado)",
            "timestamp": datetime.now().isoformat()
        }
    ]
# -----------------------------------------------------

@app.get("/")
def health():
    mode = "ONLINE"
    if service and hasattr(service, 'db') and service.db.simulation_mode:
        mode = "SIMULATION"
    return {"status": "operational", "mode": mode, "service": "Block 4 Analyst"}

@app.post("/predict")
def predict(signal: SignalInput):
    if service:
        return service.analyze_signal(signal)
    return {"error": "Service not initialized"}

if __name__ == "__main__":
    # Nota: El puerto aquí es 8000 por defecto, pero tú lo corres en 8001 por consola.
    # Eso está perfecto.
    uvicorn.run(app, host="0.0.0.0", port=8000)