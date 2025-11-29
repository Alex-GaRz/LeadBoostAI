import logging
import uuid
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv
import os

# Cargar .env de la raíz y backend antes de cualquier uso de la API Key
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env'))

# Importar Handler actualizado
from microservice_actuator.handlers.marketing_handler import MarketingHandler
from microservice_actuator.models.schemas import ActionRequest

app = FastAPI(title="Block 7: Actuator Engine - Reality Factory")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ActuatorAPI")

# Instancia del Handler
marketing_handler = MarketingHandler()

class WebProposal(BaseModel):
    action_type: str 
    parameters: Dict[str, Any]
    reasoning: str = "Direct command"

@app.post("/actuate")
async def execute_action(proposal: WebProposal):
    logger.info(f"🔔 Solicitud de actuación recibida: {proposal.action_type}")
    
    # Crear ID de acción/campaña
    action_id = str(uuid.uuid4())
    
    # Construir objeto ActionRequest interno
    action_req = ActionRequest(
        action_id=action_id,
        action_type=proposal.action_type,
        priority="HIGH",
        reasoning=proposal.reasoning,
        parameters=proposal.parameters
    )

    # Ejecutar a través del Handler (que llama a CreativeFactory)
    result = await marketing_handler.execute(action_req)
    
    return result

@app.get("/")
def health_check():
    return {"status": "online", "mode": "REALITY_FACTORY_V1"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)