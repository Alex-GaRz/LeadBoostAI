import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.network.ghost_client import GhostClient

async def test_rotation():
    print("🛡️ INICIANDO PRUEBA DE INFRAESTRUCTURA (PROXY ROTATION)...")
    
    # Simulamos una lista de proxies SI NO hay en el .env (Solo para ver la lógica)
    # En producción, esto viene del .env
    os.environ["PROXIES_LIST"] = os.getenv("PROXIES_LIST", "") 
    
    client = GhostClient()
    
    url = "https://httpbin.org/ip" # Devuelve la IP desde la que te conectas
    
    print(f"   🔧 Configuración: {len(client.proxies)} proxies cargados.")
    if not client.proxies:
        print("   ⚠️ ADVERTENCIA: Sin proxies en .env. La IP será siempre la misma (Directa).")

    for i in range(3):
        try:
            print(f"\n🚀 Petición #{i+1}...")
            response = await client.get(url)
            if response:
                data = response.json()
                print(f"   ✅ ÉXITO. IP Visible: {data['origin']}")
        except Exception as e:
            print(f"   ❌ Fallo: {e}")

if __name__ == "__main__":
    asyncio.run(test_rotation())