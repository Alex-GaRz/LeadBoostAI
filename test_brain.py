import requests
import json

# URL del Optimizador (asegúrate de que la terminal del Optimizador siga corriendo)
API_URL = "http://127.0.0.1:8000/predict"

def ask_brain(budget, platform, ctr):
    payload = {
        "budget": budget,
        "platform": platform,
        "ctr": ctr
    }
    try:
        response = requests.post(API_URL, params=payload)
        if response.status_code == 200:
            data = response.json()
            print(f"🤖 PREDICCIÓN [{platform} | ${budget}]:")
            print(f"   📈 ROI Estimado: {data['predicted_roi']:.2f}x")
            print(f"   🛡️ Confianza:    {data['confidence']*100:.1f}%")
        else:
            print(f"❌ Error API: {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

print("--- CONSULTANDO AL ORÁCULO LEADBOOST ---")
# Caso 1: LinkedIn (El trainer vio muchas quejas en Reddit, que mapeamos a LinkedIn/B2B)
ask_brain(1000, "LINKEDIN", 0.02)

# Caso 2: TikTok (Vimos señales visuales)
ask_brain(1000, "TIKTOK", 0.015)