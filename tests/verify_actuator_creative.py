import requests
import os
import hmac
import hashlib
import json

BASE_URL = "http://localhost:8003"
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

# Configuración de seguridad (Hardcoded para Fase 4)
AUTH_TOKEN = "test-token-simulado"
ACTUATOR_SECRET = "PHASE4_ACTUATOR_SECRET_2025"

def print_result(success, description):
    icon = f"{GREEN}[✅]{RESET}" if success else f"{RED}[❌]{RESET}"
    print(f"{icon} {description}")

def generate_signature(action_id, platform, content_text):
    payload_string = f"{action_id}:{platform}:{content_text}"
    return hmac.new(ACTUATOR_SECRET.encode(), payload_string.encode(), hashlib.sha256).hexdigest()

print("\n--- 🚀 VERIFICACIÓN FINAL: ACTUATOR ENGINE ---\n")

# 1. HEALTH CHECK
try:
    resp = requests.get(f"{BASE_URL}/api/v1/actuator/health")
    if resp.status_code == 200:
        print_result(True, "Health Check: Sistema ONLINE")
    else:
        print_result(False, f"Health Check: Status {resp.status_code}")
except Exception as e:
    print_result(False, f"Health Check: Error {e}")

# 2. EJECUCIÓN MOCK (HAPPY PATH)
payload_mock = {
    "action_id": "test-uuid-123",
    "platform": "MOCK",
    "content_text": "Hello World from LeadBoost"
}
headers_mock = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "X-Command-Signature": generate_signature(payload_mock["action_id"], payload_mock["platform"], payload_mock["content_text"])
}

try:
    resp = requests.post(f"{BASE_URL}/api/v1/actuator/execute", json=payload_mock, headers=headers_mock)
    
    if resp.status_code == 200:
        data = resp.json()
        if data.get("status") == "COMPLETED" and "MOCK-" in data.get("platform_ref_id", ""):
            print_result(True, f"Ejecución Mock: EXITOSA. Ref ID: {data['platform_ref_id']}")
        else:
            print_result(False, f"Ejecución Mock: Respuesta incompleta {data}")
    elif resp.status_code == 409:
        print_result(False, "Ejecución Mock: FALLO (409). El registro está bloqueado en BD. Ejecuta el comando de reset.")
    else:
        print_result(False, f"Ejecución Mock: Código inesperado {resp.status_code} - {resp.text}")
except Exception as e:
    print_result(False, f"Ejecución Mock: Error {e}")

# 3. EJECUCIÓN INVÁLIDA (VALIDATION CHECK)
payload_bad = {
    "action_id": "test-uuid-123",
    "platform": "TIKTOK", # Plataforma no soportada
    "content_text": "Invalid content"
}
# Nota: La firma fallará o el payload fallará antes, ambos son validos para test negativo
headers_bad = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "X-Command-Signature": generate_signature(payload_bad["action_id"], payload_bad["platform"], payload_bad["content_text"])
}

try:
    resp = requests.post(f"{BASE_URL}/api/v1/actuator/execute", json=payload_bad, headers=headers_bad)
    # 422: Validation Error (Pydantic) - CORRECTO
    # 501: Not Implemented - CORRECTO
    if resp.status_code in [422, 501]:
        print_result(True, f"Validación Inválida: CORRECTO (Rechazado con {resp.status_code})")
    else:
        print_result(False, f"Validación Inválida: Falló. Esperaba 422/501, recibió {resp.status_code}")
except Exception as e:
    print_result(False, f"Validación Inválida: Error {e}")