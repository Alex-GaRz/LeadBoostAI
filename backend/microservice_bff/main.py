from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard, optimizer, safety, vision # Importamos nuevos routers

# --- CONFIGURACIÓN CORS (CRÍTICO PARA REACT) ---
origins = [
    "http://localhost:5173",  # Vite Development
    "http://localhost:3000",  # React Standard
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app = FastAPI(
    title="LeadBoostAI BFF & API Gateway", 
    version="Phase 1.0 - Omniscient Update",
    description="Orchestrates communication between Frontend and multiple Python Microservices (Analyst, Actuator, Optimizer, Enterprise, Vision)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS ---
app.include_router(dashboard.router, prefix="/dashboard")
app.include_router(optimizer.router, prefix="/optimizer")
app.include_router(safety.router, prefix="/safety")   # Nueva ruta de seguridad
app.include_router(vision.router, prefix="/vision")   # Nueva ruta de visión

@app.get("/")
def health_check():
    """Health Check público"""
    return {
        "status": "online", 
        "system": "LeadBoost BFF Gateway",
        "phase": "1.0 - Omniscient",
        "services": ["Dashboard", "Optimizer", "Safety", "Vision"]
    }