import requests
import os
import sys
import time

# Configuración
BASE_URL = "http://localhost:8004/api"
INPUT_FILENAME = "real_product.jpg" # O .png, asegúrate que coincida
SKU_ID = "demo-real-001"
OUTPUT_FILENAME = "resultado_final_demo.png"

# Colores para la consola
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_step(step, msg):
    print(f"{CYAN}[Paso {step}]{RESET} {msg}")

def run_demo():
    print(f"\n--- ✨ DEMOSTRACIÓN DE MOTOR VISUAL CON PRODUCTO REAL ---\n")

    global INPUT_FILENAME  # <-- Mover aquí antes de cualquier uso

    # 1. Verificar que el usuario puso la imagen
    if not os.path.exists(INPUT_FILENAME):
        # Intentar con png si jpg no existe
        if os.path.exists("real_product.png"):
            INPUT_FILENAME = "real_product.png"
        else:
            print(f"{RED}❌ ERROR: No encuentro el archivo '{INPUT_FILENAME}' en la carpeta raíz.{RESET}")
            print(f"{YELLOW}   -> Descarga una foto de un producto, guárdala en la raíz y llámala 'real_product.jpg'{RESET}")
            return

    # 2. Subir la Imagen
    print_step(1, f"Subiendo imagen original ({INPUT_FILENAME})...")
    try:
        with open(INPUT_FILENAME, 'rb') as f:
            files = {'file': (INPUT_FILENAME, f, 'image/jpeg')}
            data = {'sku_id': SKU_ID}
            resp = requests.post(f"{BASE_URL}/v1/upload_product_image", files=files, data=data)
            
            if resp.status_code == 200:
                print(f"{GREEN}   ✅ Imagen subida correctamente.{RESET}")
            else:
                print(f"{RED}   ❌ Falló la subida: {resp.text}{RESET}")
                return
    except Exception as e:
        print(f"{RED}   ❌ Error de conexión: {e}{RESET}")
        return

    # 3. Generar el Anuncio
    print_step(2, "Solicitando generación a la IA (Esto tomará unos segundos)...")
    print(f"   {YELLOW}➤ Recortando fondo con u2net...{RESET}")
    print(f"   {YELLOW}➤ Renderizando tipografía con Playwright...{RESET}")
    print(f"   {YELLOW}➤ Validando precios con OCR...{RESET}")

    payload = {
        "sku_id": SKU_ID,
        "sku_name": "Producto Premium",
        "price": 249.99,
        "discount": 0,     # <--- Cero descuento = Menos cosas que validar
        "campaign_copy": "PRECIO ESPECIAL",
        "background_strategy": "solid_color",
        "campaign_type": "promo_retail"
    }

    start_time = time.time()
    try:
        resp = requests.post(f"{BASE_URL}/v1/generate_asset", json=payload)
        duration = time.time() - start_time
        
        if resp.status_code == 200:
            # Verificar si es imagen
            if 'image' in resp.headers.get('content-type', ''):
                with open(OUTPUT_FILENAME, "wb") as f:
                    f.write(resp.content)
                
                print(f"\n{GREEN}🎉 ¡ÉXITO! Anuncio generado en {duration:.2f} segundos.{RESET}")
                print(f"{GREEN}   💾 Imagen guardada como: {OUTPUT_FILENAME}{RESET}")
                print(f"\n{CYAN}👉 Ve a abrir el archivo '{OUTPUT_FILENAME}' y mira el resultado.{RESET}")
            else:
                print(f"{RED}❌ El servidor respondió 200 pero no envió una imagen.{RESET}")
                print(f"Contenido: {resp.text}")
        else:
            print(f"{RED}❌ Error en generación ({resp.status_code}): {resp.text}{RESET}")

    except Exception as e:
        print(f"{RED}❌ Error crítico: {e}{RESET}")

if __name__ == "__main__":
    run_demo()