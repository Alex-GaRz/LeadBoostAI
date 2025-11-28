import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from core.tiktok_scout import TikTokScout

async def test_scout():
    print("🟣 Iniciando TikTokScout Integration Test...")
    scout = TikTokScout()
    
    # Usamos tags de prueba
    tags = ["test", "marketing"]
    
    # Ejecutamos escaneo manual
    findings = await scout.scan_tag_feed(tags)
    
    print(f"\n📊 Hallazgos totales: {len(findings)}")
    
    if findings:
        print("✅ Ejemplo de señal generada:")
        print(findings[0])
    else:
        print("⚠️ No se encontraron videos o falló la descarga (revisar logs).")

if __name__ == "__main__":
    asyncio.run(test_scout())
