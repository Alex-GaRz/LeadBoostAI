import requests
import os
from PIL import Image
import io

# Intentaremos conectar al puerto expuesto (8004)
# Si falla, es probable que necesitemos ajustar el mapeo de puertos.
BASE_URL = "http://localhost:8004/api"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_result(success, description):
    icon = f"{GREEN}[✅]{RESET}" if success else f"{RED}[❌]{RESET}"
    print(f"{icon} {description}")

def create_dummy_product():
    """Crea una imagen de producto simulada (Cuadrado Rojo)"""
    img = Image.new('RGBA', (600, 600), color=(255, 0, 0, 255))
    # Dibujar algo para que no sea plano
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    d.rectangle([200, 200, 400, 400], fill=(0, 255, 0, 255)) # Cuadrado verde centro
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf

def run_test():
    print(f"\n--- 🎨 VERIFICACIÓN MOTOR VISUAL (Fase 4) ---\n")
    
    # 1. Health Check
    try:
        resp = requests.get(f"{BASE_URL}/v1/health", timeout=2)
        if resp.status_code == 200:
            print_result(True, "Health Check: Sistema ONLINE")
        else:
            print_result(False, f"Health Check: Status {resp.status_code}")
            return
    except Exception as e:
        print_result(False, f"Health Check: Error de conexión ({e})")
        print(f"{YELLOW}⚠️  Posible error de puertos. Verifica si docker-compose mapea 8004->8000{RESET}")
        return

    # 2. Upload Asset
    print("\n[Subiendo Asset de Prueba...]")
    dummy_img = create_dummy_product()
    files = {'file': ('test_shoe.png', dummy_img, 'image/png')}
    data = {'sku_id': 'test-shoe-001'}
    
    try:
        resp = requests.post(f"{BASE_URL}/v1/upload_product_image", files=files, data=data)
        if resp.status_code == 200:
            print_result(True, "Upload Image: ÉXITO")
            print(f"   Response: {resp.json()}")
        else:
            print_result(False, f"Upload Image: Falló {resp.status_code} - {resp.text}")
            return
    except Exception as e:
        print_result(False, f"Upload Image: Error {e}")
        return

    # 3. Generate Visual Asset
    print("\n[Generando Anuncio Publicitario...]")
    payload = {
        "sku_id": "test-shoe-001",
        "sku_name": "UltraBoost X",
        "price": 120.50,
        "discount": 20,
        "campaign_copy": "Run Faster Than Ever",
        "background_strategy": "solid_color", # Usamos simple para test rápido
        "campaign_type": "promo_retail"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/v1/generate_asset", json=payload)
        
        if resp.status_code == 200:
            # Verificar headers y contenido
            content_type = resp.headers.get('content-type', '')
            if 'image' in content_type:
                size_kb = len(resp.content) / 1024
                print_result(True, f"Generación: ÉXITO. Imagen recibida ({size_kb:.2f} KB)")
                
                # Guardar evidencia
                with open("test_output_ad.png", "wb") as f:
                    f.write(resp.content)
                print(f"   💾 Imagen guardada en: test_output_ad.png")
            else:
                print_result(False, f"Generación: Recibido tipo incorrecto {content_type}")
        else:
            print_result(False, f"Generación: Falló {resp.status_code} - {resp.text}")
            
    except Exception as e:
        print_result(False, f"Generación: Error {e}")

if __name__ == "__main__":
    run_test()