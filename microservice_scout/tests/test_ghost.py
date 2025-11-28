import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.network.ghost_client import GhostClient

async def test_network():
    client = GhostClient()
    
    print("👻 Iniciando Test de GhostClient...")
    
    # Haremos 3 peticiones a un sitio de prueba que devuelve tus headers
    url = "https://httpbin.org/user-agent"
    
    for i in range(3):
        print(f"\n--- Petición {i+1} ---")
        try:
            response = await client.get(url)
            print(f"Status: {response.status_code}")
            print(f"Identidad (User-Agent): {response.json()['user-agent']}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_network())
