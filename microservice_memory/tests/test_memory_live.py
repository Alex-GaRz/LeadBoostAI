import asyncio
import httpx
import uuid

BASE_URL = "http://localhost:8006/api/v1/memory"

def log(msg, ok=True):
    print(("✅" if ok else "❌") + " " + msg)

async def main():
    tenant_id = str(uuid.uuid4())
    campaign_id = str(uuid.uuid4())
    payload = {
        "payload": {
            "tenant_id": tenant_id,
            "campaign_id": campaign_id,
            "current_state": "LEARN",
            "strategy": {
                "channels": ["LINKEDIN"],
                "budget_allocation": {"roas": 2.5}
            }
        }
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Paso 1: Ingesta
        resp = await client.post(f"{BASE_URL}/ingest", json=payload)
        if resp.status_code in (200, 201):
            log("Ingesta OK")
        else:
            log(f"Fallo Ingesta: {resp.status_code} {resp.text}", ok=False)
            return
        # Paso 2: Recuperación con tenant correcto
        retrieve = {
            "tenant_id": tenant_id,
            "query_text": "campaña",
            "limit": 5
        }
        resp2 = await client.post(f"{BASE_URL}/retrieve", json=retrieve)
        if resp2.status_code == 200 and resp2.json().get("results"):
            log("Recuperación OK")
        else:
            log(f"Fallo Recuperación: {resp2.status_code} {resp2.text}", ok=False)
            return
        # Paso 3: Recuperación con tenant diferente
        retrieve2 = dict(retrieve)
        retrieve2["tenant_id"] = str(uuid.uuid4())
        resp3 = await client.post(f"{BASE_URL}/retrieve", json=retrieve2)
        if resp3.status_code == 200 and resp3.json().get("results") == []:
            log("Aislamiento OK")
        else:
            log(f"Fallo Aislamiento: {resp3.status_code} {resp3.text}", ok=False)

if __name__ == "__main__":
    asyncio.run(main())
