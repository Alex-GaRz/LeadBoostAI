import requests
import random
from abc import ABC, abstractmethod
from typing import Dict, Any
from firebase_admin import firestore

# Asegúrate de copiar security.py a este microservicio también
try:
    from .security import decrypt_token
except ImportError:
    def decrypt_token(t): return t 

def generate_mock_metrics(platform: str):
    """Fallback si falla la API real"""
    print(f"⚠️ [MOCK] Usando datos simulados para {platform}")
    return {
        "spend": round(random.uniform(50, 200), 2),
        "clicks": random.randint(10, 100),
        "impressions": random.randint(1000, 5000),
        "roas": round(random.uniform(1.2, 3.5), 2)
    }

class BaseIngestor(ABC):
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.db = firestore.client()

    def get_creds(self, platform: str):
        doc = self.db.collection("user_credentials").document(self.user_id).get()
        return doc.to_dict().get(platform) if doc.exists else None

    @abstractmethod
    def fetch_data(self) -> Dict[str, Any]:
        pass

class MetaRealIngestor(BaseIngestor):
    def fetch_data(self):
        creds = self.get_creds("meta")
        if not creds or not creds.get("is_active"):
            return generate_mock_metrics("Meta Ads (No Creds)")

        try:
            token = decrypt_token(creds['access_token'])
            account_id = creds['account_id']
            # Llamada Real a Graph API
            url = f"https://graph.facebook.com/v19.0/{account_id}/insights"
            resp = requests.get(url, params={
                "access_token": token,
                "date_preset": "today",
                "fields": "spend,clicks,impressions"
            })
            
            if resp.status_code == 200 and 'data' in resp.json():
                data = resp.json()['data'][0]
                return {
                    "spend": float(data.get('spend', 0)),
                    "clicks": int(data.get('clicks', 0)),
                    "impressions": int(data.get('impressions', 0)),
                    "roas": 0.0 # Calcular externamente
                }
            return generate_mock_metrics(f"Meta Ads (API Error {resp.status_code})")
        except Exception as e:
            print(f"Error Meta: {e}")
            return generate_mock_metrics("Meta Ads (Exception)")

class GoogleRealIngestor(BaseIngestor):
    def fetch_data(self):
        # Placeholder para integración real de Google Ads (más compleja)
        return generate_mock_metrics("Google Ads (WIP)")