import requests
import json
import random
import time

BASE_URL = "http://127.0.0.1:8012/optimizer"

def get_recommendation():
    # Payload COMPLETO que cumple rigurosamente con OptimizationContext
    payload = {
        "inventory_snapshot": [
            {
                "sku": "PROD-001", 
                "qty": 100, 
                "cost": 10.0, 
                "margin": 0.5,
                "lead_time_days": 7
            }
        ],
        "active_campaigns": [],
        "market_trends": {}, # Diccionario está bien aquí usualmente
        "financial_status": {
            "cash_on_hand": 50000.0,
            "monthly_burn_rate": 2000.0,
            # --- CAMPOS QUE FALTABAN ---
            "total_budget": 10000.0,
            "used_budget": 2000.0,
            "fiscal_year_margin_avg": 0.25
        },
        "historical_performance": [] # --- CORRECCIÓN: Debe ser una LISTA, no un dict ---
    }
    try:
        resp = requests.post(f"{BASE_URL}/recommendation", json=payload)
        if resp.status_code == 200:
            return resp.json()
        else:
            print(f"Error {resp.status_code}: {resp.text}")
            return None
    except Exception as e:
        print(f"Error conectando: {e}")
        return None

def send_training_data(budget, roi):
    payload = {
        "budget_spent": budget,
        "platform_id": "META",
        "historical_ctr": 0.02,
        "actual_roi_achieved": roi
    }
    try:
        requests.post(f"{BASE_URL}/train", json=payload)
    except Exception as e:
        print(f"Error enviando training: {e}")

print("\n--- 1. CONSULTA INICIAL (Sin conocimiento) ---")
rec = get_recommendation()
if rec:
    print(f"Recomendación: {rec['recommended_action_type']}")
    print(f"ROI Proyectado: {rec['projected_roi']:.4f}")
else:
    print("❌ Falló la consulta inicial. Revisa los logs del servidor.")
    exit()

print("\n--- 2. ENTRENAMIENTO INTENSIVO (Inyectando realidad) ---")
print("Simulando 10 campañas exitosas en META (ROI ~3.5)...")
for i in range(10):
    budget = random.uniform(800, 1200)
    real_roi = random.uniform(3.4, 3.8) # ROI alto constante
    send_training_data(budget, real_roi)
    print(".", end="", flush=True)

print("\nDatos enviados. Esperando que el background task procese (3 seg)...")
time.sleep(3) 

print("\n--- 3. CONSULTA FINAL (Cerebro entrenado) ---")
rec_v2 = get_recommendation()
if rec_v2:
    print(f"Recomendación: {rec_v2['recommended_action_type']}")
    print(f"ROI Proyectado: {rec_v2['projected_roi']:.4f}")
    print(f"Justificación: {rec_v2['justification']}")
    
    diff = rec_v2['projected_roi'] - rec['projected_roi']
    print(f"\n✅ RESULTADO: El modelo aprendió y ajustó su predicción en {diff:+.4f} puntos.")