import requests
import sys

API_URL = "http://localhost:8011"  # Puerto asumido para B11

def trigger_stockout(sku="PROD-001"):
    print(f"⚠️  INICIANDO SIMULACIÓN DE CRISIS: STOCKOUT para {sku}...")
    try:
        # CORRECCIÓN AQUÍ: Agregamos '/enterprise' al path
        response = requests.post(
            f"{API_URL}/enterprise/admin/trigger-crisis",
            params={"type": "stockout", "sku": sku}
        )
        response.raise_for_status()
        print("✅ ERP Hackeado: Inventario forzado a 0.")
        print("👉 Ahora ejecuta el Bloque 6. Debería bloquear cualquier campaña para este SKU.")
    except Exception as e:
        print(f"❌ Error contactando al ERP Simulator: {e}")
        # Imprimir respuesta del servidor si existe, para debug
        if hasattr(e, 'response') and e.response is not None:
             print(f"   Detalle servidor: {e.response.text}")

if __name__ == "__main__":
    # Uso: python trigger.py stockout PROD-001
    action = sys.argv[1] if len(sys.argv) > 1 else "stockout"
    target_sku = sys.argv[2] if len(sys.argv) > 2 else "PROD-001"
    
    if action == "stockout":
        trigger_stockout(target_sku)