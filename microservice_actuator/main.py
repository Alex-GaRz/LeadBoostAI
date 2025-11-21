import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

# Imports limpios
from core.dispatcher import ActionDispatcher
from models.schemas import ActionType, ActionRequest, ExecutionResult

app = FastAPI(title="Block 7: Actuator Engine")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ActuatorAPI")

# Instancia global del dispatcher (Se ejecuta una sola vez al inicio)
dispatcher = ActionDispatcher()

# Modelo simple para recibir JSON (desde B6 o Postman)
class WebProposal(BaseModel):
    action_type: ActionType 
    parameters: Dict[str, Any]

@app.get("/")
def health_check():
    return {"status": "online", "service": "Block 7 - Actuator Engine"}

@app.post("/actuate", response_model=ExecutionResult)
async def execute_action(proposal: WebProposal):
    """
    Recibe la orden APROBADA y la ejecuta.
    """
    logger.info(f"🔔 Orden de ejecución recibida: {proposal.action_type.value}")
    
    try:
        # 1. Crear objeto interno ActionRequest
        req = ActionRequest(
            action_type=proposal.action_type,
            parameters=proposal.parameters
        )
        
        # 2. Ejecutar (Await es CLAVE)
        result = await dispatcher.dispatch(req)
        
        return result
        
    except Exception as e:
        logger.error(f"Execution Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)