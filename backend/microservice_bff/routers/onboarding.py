from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from firebase_admin import firestore
from datetime import datetime
from typing import Optional

# Importamos la utilidad de seguridad que acabamos de crear
from utils.security import encrypt_token
from auth_middleware import verify_firebase_token

router = APIRouter(prefix="/onboarding", tags=["Data Foundation"])
db = firestore.client()

class ConnectRequest(BaseModel):
    platform: str
    access_token: str
    account_id: str
    refresh_token: Optional[str] = None

@router.post("/connect/{platform}")
async def connect_platform(
    platform: str, 
    payload: ConnectRequest, 
    user_token: dict = Depends(verify_firebase_token)
):
    user_id = user_token.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if platform not in ["meta", "google_ads", "analytics"]:
        raise HTTPException(status_code=400, detail="Plataforma no soportada")

    # 1. Encriptar Tokens (Seguridad Bancaria)
    encrypted_access = encrypt_token(payload.access_token)
    
    # 2. Guardar en Firestore
    doc_ref = db.collection("user_credentials").document(user_id)
    
    data = {
        f"{platform}": {
            "access_token": encrypted_access,
            "account_id": payload.account_id,
            "status": "connected",
            "last_updated": datetime.utcnow().isoformat(),
            "is_active": True
        }
    }
    
    doc_ref.set(data, merge=True)
    return {"status": "success", "platform": platform}

@router.get("/status")
async def get_status(user_token: dict = Depends(verify_firebase_token)):
    """Devuelve qué plataformas están conectadas (sin revelar tokens)."""
    user_id = user_token.get("uid")
    doc = db.collection("user_credentials").document(user_id).get()
    
    status = {"meta": "disconnected", "google_ads": "disconnected", "analytics": "disconnected"}
    
    if doc.exists:
        data = doc.to_dict()
        for p in status.keys():
            if data.get(p, {}).get("is_active"):
                status[p] = "connected"
                
    return status