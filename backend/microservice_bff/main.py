from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard
from routers import optimizer # Importamos el nuevo router

# --- CONFIGURACIÓN CORS (CRÍTICO PARA REACT) ---
origins = [
    "http://localhost:5173",  # Vite Development (Tu puerto actual)
    "http://localhost:3000",  # React Standard
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app = FastAPI(
    title="LeadBoostAI BFF & API Gateway", 
    version="Phase 1.0",
    description="Orchestrates communication between Frontend and multiple Python Microservices (Analyst, Actuator, Optimizer)."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, etc)
    allow_headers=["*"],  # Permite Auth Headers
)

# --- REGISTRO DE RUTAS ---
app.include_router(dashboard.router, prefix="/dashboard")
app.include_router(optimizer.router, prefix="/optimizer") # Registramos el router del optimizador

@app.get("/")
def health_check():
    """Health Check público"""
    return {
        "status": "online", 
        "system": "LeadBoost BFF Gateway",
        "phase": "1 - Data Foundation",
        "services": ["Dashboard", "Optimizer"]
    }