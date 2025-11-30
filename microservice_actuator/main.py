import logging
import uuid
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any
from dotenv import load_dotenv
import os

# Cargar .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', '.env'))

from microservice_actuator.handlers.marketing_handler import MarketingHandler
from microservice_actuator.models.schemas import ActionRequest
# Nuevas importaciones para Inyección de Dependencias
from microservice_actuator.core.memory_client import MemoryClient
from microservice_actuator.core.creative_factory import CreativeFactory

app = FastAPI(title="Block 7: Actuator Engine - Reality Factory")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ActuatorAPI")

# --- COMPOSITION ROOT ---
# Inicializamos el cliente de memoria (Singleton en la app)
memory_client = MemoryClient()

# Inicializamos la Fábrica Creativa con el cliente de memoria
creative_factory = CreativeFactory(memory_client=memory_client)

# Inicializamos el Handler inyectando la fábrica personalizada
# (Asumimos que MarketingHandler acepta creative_factory en init o lo seteamos manualmente)
marketing_handler = MarketingHandler()
# Monkey-patching o inyección por setter si el Handler no lo soporta en __init__
# Idealmente MarketingHandler.__init__ debería aceptar la fábrica.
# Para este ejercicio, asumimos que asignamos la instancia:
marketing_handler.creative_factory = creative_factory

class WebProposal(BaseModel):
    action_type: str 
    parameters: Dict[str, Any]
    reasoning: str = "Direct command"

@app.post("/actuate")
async def execute_action(proposal: WebProposal):
    logger.info(f"🔔 Solicitud de actuación recibida: {proposal.action_type}")
    
    action_id = str(uuid.uuid4())
    
    action_req = ActionRequest(
        action_id=action_id,
        action_type=proposal.action_type,
        priority="HIGH",
        reasoning=proposal.reasoning,
        parameters=proposal.parameters
    )

    # El handler llamará a creative_factory.generate_asset, que ahora usa RAG
    result = await marketing_handler.execute(action_req)
    
    return result

@app.get("/")
def health_check():
    return {"status": "online", "mode": "REALITY_FACTORY_V1_RAG_ENABLED"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)