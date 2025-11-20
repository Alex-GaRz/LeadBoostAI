import requests
import uuid
import random
import time
from datetime import datetime

API_URL = "http://localhost:8001/feedback/webhook"

def generate_mock_payload():
    sources = ["META_ADS", "GOOGLE_ADS", "MOCK_GENERATOR"]
    source = random.choice(sources)
    
    # Simulamos un ID de ejecución que vendría del Bloque 7
    execution_id = f"act_{uuid.uuid4().hex[:8]}"
    
    data = {}
    
    if source == "META_ADS":
        spend = round(random.uniform(10.0, 500.0), 2)
        # A veces va bien, a veces mal (simulación realista)
        roas_factor = random.uniform(0.5, 4.0) 
        data = {
            "spend": spend,
            "conversion_value": spend * roas_factor,
            "clicks": random.randint(50, 1000),
            "impressions": random.randint(1000, 50000)
        }
    elif source == "GOOGLE_ADS":
        cost = round(random.uniform(10.0, 500.0), 2)
        roas_factor = random.uniform(0.8, 3.5)
        data = {
            "cost_micros": cost * 1000000,
            "conversions_value": cost * roas_factor,
            "interactions": random.randint(20, 800)
        }
    else:
        data = {
            "simulated_score": random.random(),
            "metrics": {"custom_kpi": random.randint(1, 100)}
        }

    payload = {
        "source": source,
        "execution_id": execution_id,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data
    }
    return payload

def run_simulation(n=5, delay=1):
    print(f"🚀 Iniciando simulación de tráfico hacia Bloque 8 ({n} eventos)...")
    
    for i in range(n):
        payload = generate_mock_payload()
        try:
            response = requests.post(API_URL, json=payload)
            print(f"[{i+1}/{n}] Enviado {payload['source']} -> Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Error conectando con API: {e}")
        time.sleep(delay)
        
    print("✅ Simulación completada.")

if __name__ == "__main__":
    # Asegúrate de que el servidor (main.py) esté corriendo en otra terminal
    run_simulation(10, 0.5)