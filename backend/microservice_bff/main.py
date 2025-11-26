from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --- IMPORTS DE ROUTERS ---
# Asegúrate de que existan dashboard.py y onboarding.py en la carpeta /routers
from routers import dashboard
from routers import onboarding 

# Si tienes el websocket manager configurado, descomenta:
# from websocket_manager import manager

app = FastAPI(title="LeadBoost BFF & API Gateway", version="Phase 1.0")

# --- CONFIGURACIÓN CORS (CRÍTICO PARA REACT) ---
origins = [
    "http://localhost:5173",  # Vite Development (Tu puerto actual)
    "http://localhost:3000",  # React Standard
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, etc)
    allow_headers=["*"],  # Permite Auth Headers
)

# --- REGISTRO DE RUTAS ---
# 1. Router del Dashboard (Legacy/Visualización)
app.include_router(dashboard.router)

# 2. Router de Onboarding (NUEVO - Fase 1)
# Maneja la conexión segura de cuentas Meta/Google
app.include_router(onboarding.router)

@app.get("/")
def health_check():
    """Health Check público"""
    return {
        "status": "online", 
        "system": "LeadBoost BFF Gateway",
        "phase": "1 - Data Foundation",
        "services": ["Dashboard", "Onboarding Secure"]
    }