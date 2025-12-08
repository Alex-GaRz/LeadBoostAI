import asyncio
import httpx
import time
import json

BASE_URL = "http://localhost:8011/enterprise"
TEST_URL = "http://localhost:8011/test/simulate-sale"

async def attack_concurrency(sku: str, total_requests: int):
    print(f"\n⚔️ INICIANDO ATAQUE DE CONCURRENCIA SOBRE {sku}...")
    
    async with httpx.AsyncClient() as client:
        tasks = []
        for i in range(total_requests):
            tasks.append(client.post(TEST_URL, json={"sku": sku, "qty": 1}))
        
        start = time.time()
        responses = await asyncio.gather(*tasks)
        end = time.time()
        
        success = []
        failures = []
        errors = []

        for r in responses:
            if r.status_code == 200 and "Sale Processed" in r.text:
                success.append(r)
            elif r.status_code == 200 and "Insufficient stock" in r.text:
                failures.append(r) # Fallo de negocio (correcto)
            else:
                # Error técnico (500, 422, etc)
                errors.append(f"{r.status_code}: {r.text[:100]}...") 

        print(f"⏱️ Tiempo: {end - start:.2f}s")
        print(f"✅ Éxitos (Ventas): {len(success)}")
        print(f"🛡️ Bloqueos de Negocio: {len(failures)}")
        
        if errors:
            print(f"🔥 ERRORES TÉCNICOS ({len(errors)}):")
            for e in errors[:3]: # Mostrar solo los primeros 3
                print(f"   -> {e}")

async def trigger_kill_switch(sku: str):
    print(f"\n📉 FORZANDO NIVEL CRÍTICO DE INVENTARIO EN {sku}...")
    async with httpx.AsyncClient() as client:
        # PROD-002 tiene 500 unidades por defecto.
        # Compramos 496 para que queden 4. Esto DEBE disparar la alarma (< 5).
        qty_to_crash = 496 
        
        res = await client.post(TEST_URL, json={"sku": sku, "qty": qty_to_crash})
        
        try:
            print(f"Respuesta de compra crítica: {res.json()}")
        except json.JSONDecodeError:
            print(f"❌ ERROR CRÍTICO: El servidor no devolvió JSON.")
            print(f"Status: {res.status_code}")
            print(f"Body: {res.text}")
            
async def main():
    # Prueba de Concurrencia
    await attack_concurrency("PROD-001", 10)
    
    # Prueba de Kill Switch
    await trigger_kill_switch("PROD-002")

if __name__ == "__main__":
    asyncio.run(main())