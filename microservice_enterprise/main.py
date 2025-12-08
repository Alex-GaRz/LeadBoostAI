import os
import logging
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Configuración
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EnterpriseCore")

# --- MASTER KEY DE EMERGENCIA ---
MASTER_SECRET_KEY = "PHASE3_MASTER_KEY_2025"

app = FastAPI(title="LeadBoostAI Enterprise", version="3.0.FIX")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenRequest(BaseModel):
    service_id: str
    client_secret: str
    scopes: List[str] = []

@app.get("/health")
async def health_check():
    return {"status": "active", "mode": "emergency_fix"}

@app.post("/sts/token")
async def issue_token(req: TokenRequest):
    logger.info(f"🔐 AUTH CHECK: Service={req.service_id}")
    
    # Validación Directa contra la Clave Maestra
    if req.client_secret == MASTER_SECRET_KEY:
        logger.info("✅ ACCESS GRANTED")
        return {
            "access_token": f"token_for_{req.service_id}_signed_by_master",
            "token_type": "bearer",
            "expires_in": 3600
        }
    
    logger.warning(f"❌ ACCESS DENIED. Recibido: '{req.client_secret}'")
    raise HTTPException(status_code=401, detail="Invalid Credentials")

@app.get("/sts/jwks")
async def get_jwks():
    return {"keys": []}

# --- MOTOR DE ARRANQUE (CRÍTICO) ---
if __name__ == "__main__":
    print("🔥 ENGINE IGNITION: Enterprise starting on port 8011...")
    uvicorn.run(app, host="0.0.0.0", port=8011)
