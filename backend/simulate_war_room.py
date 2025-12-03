import redis
import time
import json

# CONFIGURACIÓN
REDIS_HOST = 'localhost'
REDIS_PORT = 6379
CHANNEL = 'system_events'

def publish_event(r, source, status, meta):
    payload = { "source": source, "status": status, "meta": meta }
    r.publish(CHANNEL, json.dumps(payload))
    print(f"📡 {source.upper()} -> {status}: {meta}")

def run_simulation():
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        print("--- INICIANDO PROTOCOLO COMPLETO (6 FASES) ---")
        
        # 1. RADAR
        publish_event(r, "radar", "PROCESSING", "Scanning feeds...")
        time.sleep(1.5)
        publish_event(r, "radar", "COMPLETE", "Threat Detected")
        
        # 2. ANALYST
        publish_event(r, "analyst", "PROCESSING", "Correlating data...")
        time.sleep(2)
        publish_event(r, "analyst", "COMPLETE", "High Impact Confirmed")

        # 3. ADVISOR (Consejero)
        publish_event(r, "advisor", "PROCESSING", "Consulting B12...")
        time.sleep(2)
        publish_event(r, "advisor", "COMPLETE", "Strategy #404 Ready")

        # 4. ACTUATOR (Ejecutor)
        publish_event(r, "actuator", "PROCESSING", "Deploying Ads...")
        time.sleep(2)
        publish_event(r, "actuator", "COMPLETE", "Deployed to Meta")

        # 5. QUALITY (Revisión) - NUEVO
        publish_event(r, "quality", "PROCESSING", "Verifying links...")
        time.sleep(1.5)
        publish_event(r, "quality", "COMPLETE", "Integrity 100%")

        # 6. RESULT (Final) - NUEVO
        publish_event(r, "result", "COMPLETE", "Mission Success")
        
        print("--- CICLO FINALIZADO ---")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run_simulation()