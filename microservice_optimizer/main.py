import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from microservice_optimizer.api.api_optimizer import router as optimizer_router
from microservice_optimizer.core.math_core import ROIPredictor

# Inicialización del Bloque 12
app = FastAPI(title="Microservice Optimizer (B12 - MathCore)", version="2.0.0")

# Pre-carga del modelo al inicio para evitar latencia en la primera petición
print("--- SISTEMA: Inicializando MathCore ---")
try:
    predictor = ROIPredictor()
    state = "FITTED" if predictor.is_fitted else "COLD_START"
    print(f"--- SISTEMA: MathCore cargado. Estado: {state} ---")
except Exception as e:
    print(f"--- ERROR CRITICO: Fallo al cargar MathCore: {e} ---")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(optimizer_router, prefix="/optimizer", tags=["Optimizer"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "engine": "SGD_Regressor", 
        "training_mode": "online_incremental"
    }

if __name__ == "__main__":
    uvicorn.run("microservice_optimizer.main:app", host="0.0.0.0", port=8012, reload=True)