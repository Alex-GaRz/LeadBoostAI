import sys
import os
import requests

# Ajustar path para importar módulos core
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.vision_engine import VisionEngine

def test_vision():
    print("👁️ Iniciando Test de VisionEngine...")
    
    # 1. Descargar video de prueba pequeño (500KB)
    url = "https://www.w3schools.com/html/mov_bbb.mp4"
    print(f"⬇️ Descargando sample: {url}")
    response = requests.get(url)
    video_bytes = response.content
    print(f"📦 Bytes recibidos: {len(video_bytes)}")

    # 2. Inicializar Motor
    engine = VisionEngine()
    
    # 3. Procesar
    print("⚙️ Procesando video (esto puede tardar unos segundos)...")
    result = engine.analyze_video_buffer(video_bytes)
    
    # 4. Resultados
    print("\n✅ RESULTADOS DEL ANÁLISIS:")
    print(f"   - Emoción Dominante: {result.get('dominant_emotion')}")
    print(f"   - Texto OCR Detectado: {result.get('ocr_text')[:100]}...") # Mostrar primeros 100 chars
    print(f"   - Logos: {result.get('logos_detected')}")

if __name__ == "__main__":
    test_vision()
