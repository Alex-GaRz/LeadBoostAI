import logging
import uuid
import random
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# Intentamos importar tu lógica existente. 
# Si fallan los imports porque no tienes los archivos, comenta estas 2 líneas:
try:
    from core.dispatcher import ActionDispatcher
    from models.schemas import ActionProposal, ActionType
except ImportError:
    # Fallback por si faltan archivos en este entorno específico
    pass

# 1. INICIALIZAR LA APP (ESTO ES LO QUE BUSCA UVICORN)
app = FastAPI(title="Block 7: Actuator Engine")

# Configuración global de logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ActuatorAPI")

# 2. ENDPOINT PARA EL BFF (DASHBOARD)
@app.get("/campaigns/active")
async def get_active_campaigns():
    """
    Endpoint consumido por el Bloque 9 para mostrar campañas en tiempo real.
    """
    logger.info("BFF solicitando estado de campañas...")
    
    # SIMULACIÓN DE DATOS REALES (MOCK)
    # En el futuro, esto consultará tu base de datos de ejecución o las APIs de Meta/Google
    return [
        {
            "id": "CMP-901", 
            "platform": "META ADS", 
            "status": "ACTIVE", 
            "spend": 450.20, 
            "roas": 2.8
        },
        {
            "id": "CMP-902", 
            "platform": "GOOGLE ADS", 
            "status": "LEARNING", 
            "spend": 120.00, 
            "roas": 1.1
        },
        {
            "id": "CMP-903", 
            "platform": "LINKEDIN", 
            "status": "PAUSED", 
            "spend": 850.00, 
            "roas": 3.5
        }
    ]

# 3. ENDPOINT PARA EJECUTAR ACCIONES (FUNCIONALIDAD ORIGINAL)
class WebProposal(BaseModel):
    action_type: str
    parameters: Dict[str, Any]

@app.post("/actuate")
async def execute_action(proposal: WebProposal):
    """
    Recibe una orden de ejecución (probablemente del Bloque 6)
    """
    logger.info(f"Recibida orden de ejecución: {proposal.action_type}")
    
    # Aquí conectaríamos con tu ActionDispatcher original
    # dispatcher = ActionDispatcher()
    # result = dispatcher.dispatch(...)
    
    return {
        "status": "EXECUTED",
        "execution_id": str(uuid.uuid4()),
        "details": f"Acción {proposal.action_type} enviada a la plataforma."
    }

@app.get("/")
def health_check():
    return {"status": "online", "service": "Block 7 - Actuator Engine"}

# Bloque para correr como script si se desea (opcional)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)