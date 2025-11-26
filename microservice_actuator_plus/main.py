from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

# --- IMPORTS DEL MOTOR HÍBRIDO ---
# Asumimos que ya creaste 'microservice_actuator_plus/core/ingestors.py'
from core.ingestors import MetaRealIngestor, GoogleRealIngestor

app = FastAPI(title="Microservice Actuator Plus - Ingestion Engine")

# --- CONFIGURACIÓN CORS ---
# Permitimos todo porque este servicio es interno o llamado por el BFF
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {
        "status": "online", 
        "module": "Actuator Plus", 
        "mode": "Hybrid (Real + Mock Fallback)"
    }

# --- ENDPOINT MAESTRO DE INGESTA (PHASE 1) ---
@app.post("/ingest/trigger/{user_id}")
async def trigger_manual_ingestion(user_id: str):
    """
    Este endpoint es llamado cuando queremos actualizar métricas.
    Intenta conectar a Meta/Google reales. Si falla, usa el mock.
    """
    print(f"🚀 [ACTUATOR] Iniciando secuencia de ingesta para User: {user_id}")
    
    results = {}
    
    # 1. EJECUCIÓN PIPELINE META ADS
    try:
        print("   ... Consultando Meta Graph API")
        meta_ingestor = MetaRealIngestor(user_id)
        results['meta'] = meta_ingestor.fetch_data()
    except Exception as e:
        print(f"❌ Error crítico en Meta Pipeline: {e}")
        results['meta'] = {"status": "error", "details": str(e)}

    # 2. EJECUCIÓN PIPELINE GOOGLE ADS
    try:
        print("   ... Consultando Google Ads API")
        google_ingestor = GoogleRealIngestor(user_id)
        results['google'] = google_ingestor.fetch_data()
    except Exception as e:
        print(f"❌ Error crítico en Google Pipeline: {e}")
        results['google'] = {"status": "error", "details": str(e)}
    
    # Aquí en el futuro guardaríamos 'results' en la base de datos de Analytics
    
    return {
        "status": "ingestion_completed",
        "timestamp": "now", 
        "payload": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=False)