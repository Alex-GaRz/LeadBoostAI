from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard
# Si tienes el websocket listo, descomenta la siguiente línea:
# from websocket_manager import manager

app = FastAPI(title="LeadBoost BFF & API Gateway")

# --- CONFIGURACIÓN CORS (CRÍTICO PARA REACT) ---
# Esto permite que tu Frontend (localhost:5173) envíe peticiones aquí.
origins = [
    "http://localhost:5173",  # Vite Development
    "http://localhost:3000",  # React Standard
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, OPTIONS, etc.
    allow_headers=["*"], # Permite enviar el header 'Authorization'
)

# --- RUTAS ---
app.include_router(dashboard.router)

@app.get("/")
def health_check():
    """Endpoint público para verificar que el servidor corre"""
    return {
        "status": "online", 
        "system": "LeadBoost BFF Gateway",
        "auth_mode": "Firebase Enterprise"
    }