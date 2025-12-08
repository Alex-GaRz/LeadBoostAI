import requests
import json
import time

URL = "http://localhost:8002/actuate"

# Payload simulando una orden estratégica de alto nivel
payload = {
    # CAMBIO AQUÍ: Usamos "CREATE_CAMPAIGN" en lugar de "MARKETING_CAMPAIGN"
    "action_type": "CREATE_CAMPAIGN", 
    "reasoning": "Lanzamiento de verano de zapatillas urbanas ecológicas. Enfoque en libertad y naturaleza.",
    "parameters": {
        "sku": "SNEAKER-ECO-001",
        "platform_focus": "Meta Ads",
        "target_audience": "Gen Z, eco-conscious, urban explorers",
        "budget_cap": 500
    }
}

print("🚀 [TEST] Enviando solicitud a la Fábrica de Realidad...")
start_time = time.time()

try:
    response = requests.post(URL, json=payload)
    duration = time.time() - start_time
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ ÉXITO ({duration:.2f}s)")
        print(json.dumps(data, indent=2))
        print("\n🔍 Busca la evidencia física en la carpeta 'microservice_actuator/assets/generated' del microservicio.")
    else:
        print(f"\n❌ ERROR {response.status_code}: {response.text}")

except Exception as e:
    print(f"\n❌ ERROR DE CONEXIÓN: {e}")
    print("Asegúrate de que 'python -m microservice_actuator.main' esté corriendo.")