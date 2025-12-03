from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# --- NUEVOS IMPORTS ---
from fastapi.staticfiles import StaticFiles
from routers import dashboard, optimizer, safety, vision, strategy 

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

# --- SERVICIO DE ARCHIVOS ESTÁTICOS ---
# NOTA: Debes crear una carpeta 'assets' en la raíz de tu proyecto para que esto funcione.
# Por simplicidad, montaremos la carpeta 'assets' bajo la URL '/static'.
app.mount("/static", StaticFiles(directory="assets"), name="static")

# --- REGISTRO DE RUTAS ---
app.include_router(dashboard.router, prefix="/dashboard")
app.include_router(optimizer.router, prefix="/optimizer")
app.include_router(safety.router, prefix="/safety")
app.include_router(vision.router, prefix="/vision")
app.include_router(strategy.router, prefix="") # Nuevo router de estrategia

@app.get("/")
def health_check():
    """Health Check público"""
    return {
        "status": "online", 
        "system": "LeadBoost BFF Gateway",
        "phase": "1.0 - Omniscient",
        "services": ["Dashboard", "Optimizer", "Safety", "Vision", "Strategy (New)"]
    }