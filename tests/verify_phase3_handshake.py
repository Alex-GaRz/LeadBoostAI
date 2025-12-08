import sys
import requests
import time

STS_URL = "http://localhost:8011/sts/token"
HEALTH_URL = "http://localhost:8011/health"
MASTER_KEY = "PHASE3_MASTER_KEY_2025"

print("\n--- 🕵️ FORENSE FASE 3: HANDSHAKE FINAL ---\n")

# 1. Esperar servicio
print("[⏳] Esperando disponibilidad del servicio (8011)...")
for i in range(10):
    try:
        requests.get(HEALTH_URL)
        print("[✅] Servicio Enterprise ONLINE.")
        break
    except:
        time.sleep(1)
        if i == 9:
            print("[❌] El servicio no responde. Verifica 'docker logs leadboost_enterprise'.")
            sys.exit(1)

# 2. Prueba Hacker
print("\n[🔒] Test 1: Intento de Intrusión...")
try:
    res = requests.post(STS_URL, json={"service_id": "hacker", "client_secret": "wrong"})
    if res.status_code == 401:
        print("[✅] CORRECTO: Intruso bloqueado (401).")
    else:
        print(f"[❌] FALLO: Recibimos {res.status_code} en lugar de 401.")
        sys.exit(1)
except Exception as e:
    print(f"[❌] Error de conexión: {e}")
    sys.exit(1)

# 3. Prueba Legítima
print("\n[🔑] Test 2: Acceso Legítimo...")
try:
    payload = {"service_id": "bff", "client_secret": MASTER_KEY, "scopes": ["read"]}
    res = requests.post(STS_URL, json=payload)
    if res.status_code == 200:
        print(f"[✅] ÉXITO: Token recibido: {res.json().get('access_token')}")
        print("\n🚀 FASE 3 CERTIFICADA.")
    else:
        print(f"[❌] FALLO: Recibimos {res.status_code}. Mensaje: {res.text}")
        sys.exit(1)
except Exception as e:
    print(f"[❌] Error crítico: {e}")
    sys.exit(1)
