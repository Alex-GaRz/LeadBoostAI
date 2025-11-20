from fastapi import FastAPI
from models.schemas import SignalInput
from services.analyst_service import AnalystService
from api.routes.advisor import router as advisor_router
import uvicorn

app = FastAPI(title="LeadBoostAI Analyst Engine")
service = AnalystService()

# Incluir rutas del Advisor (Bloque 5)
app.include_router(advisor_router)

@app.get("/")
def health():
    mode = "SIMULATION" if service.db.simulation_mode else "ONLINE"
    return {"status": "operational", "mode": mode}

@app.post("/predict")
def predict(signal: SignalInput):
    return service.analyze_signal(signal)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)