import logging
import uuid
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List

app = FastAPI(title="Block 7: Actuator Engine")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ActuatorAPI")

# --- MODELOS ---
class WebProposal(BaseModel):
    action_type: str 
    parameters: Dict[str, Any]

# --- ENDPOINTS ---

@app.get("/campaigns/active")
async def get_active_campaigns():
    """
    Endpoint consumido por el BFF (Bloque 9) para el Dashboard.
    """
    logger.info("📢 Reportando estado de campañas al Comando Central...")
    return [
        {
            "id": "ACT-001",
            "platform": "Meta Ads",
            "status": "ACTIVE",
            "spend": 1250.00,
            "roas": 3.2
        },
        {
            "id": "ACT-002",
            "platform": "Google Search",
            "status": "LEARNING",
            "spend": 450.50,
            "roas": 1.8
        },
        {
            "id": "ACT-003",
            "platform": "LinkedIn",
            "status": "PAUSED",
            "spend": 200.00,
            "roas": 0.9
        }
    ]

@app.post("/actuate")
async def execute_action(proposal: WebProposal):
    logger.info(f"🔔 Ejecutando acción: {proposal.action_type}")
    return {
        "status": "EXECUTED",
        "execution_id": str(uuid.uuid4()), 
        "platform_response": "success"
    }

@app.get("/")
def health_check():
    return {"status": "online", "service": "Block 7 - Actuator Engine"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)