import requests
import time
import sys
from colorama import init, Fore, Style

# Inicializar colores para Windows/Mac
init(autoreset=True)

# --- CONFIGURACIÓN DE OBJETIVOS ---
PORTS = {
    "B11_ERP": "http://localhost:8011",
    "B4_ANALYST": "http://localhost:8001",
    "B9_BFF": "http://localhost:8000" # Asumiendo que B9 corre en puerto standard o via proxy
}

SKU_TARGET = "PROD-001"

def print_step(title, message):
    print(f"\n{Fore.CYAN}========================================")
    print(f"{Fore.WHITE}{Style.BRIGHT}{title}")
    print(f"{Fore.CYAN}========================================")
    print(f"{message}\n")
    time.sleep(1.5) # Pausa dramática

def check_health():
    print(f"{Fore.YELLOW}🏥 Verificando constantes vitales del sistema...")
    try:
        # Check B11
        r = requests.get(f"{PORTS['B11_ERP']}/enterprise/financials", timeout=1)
        if r.status_code == 200:
            print(f"{Fore.GREEN}✅ ERP (B11) ONLINE")
        else:
            print(f"{Fore.RED}❌ ERP (B11) OFFLINE o ERROR")
            sys.exit(1)

        # Check B4
        r = requests.get(f"{PORTS['B4_ANALYST']}/", timeout=1)
        if r.status_code == 200:
            print(f"{Fore.GREEN}✅ ANALYST (B4/B6) ONLINE")
        else:
            print(f"{Fore.RED}❌ ANALYST (B4) OFFLINE")
            sys.exit(1)
            
    except Exception as e:
        print(f"{Fore.RED}❌ ERROR DE CONEXIÓN: {e}")
        print("Asegúrate de ejecutar start_services.bat primero.")
        sys.exit(1)

def run_war_game():
    print_step("INICIANDO STRESS TEST: 'SCENARIO ZULU'", 
               "Objetivo: Intentar quemar presupuesto en un producto sin stock.")

    # ---------------------------------------------------------
    # PASO 1: EL SABOTAJE
    # ---------------------------------------------------------
    print(f"{Fore.YELLOW}📡 [PASO 1] Inyectando evento de crisis en ERP (Sabotaje)...")
    try:
        # Trigger crisis: Stockout
        url = f"{PORTS['B11_ERP']}/enterprise/admin/trigger-crisis?type=stockout&sku={SKU_TARGET}"
        r = requests.post(url)
        if r.status_code == 200:
            print(f"{Fore.RED}🚨 SABOTAJE EXITOSO: Inventario de {SKU_TARGET} establecido a 0 unidades.")
            print(f"{Fore.RED}🔥 EL ALMACÉN ESTÁ VACÍO.")
        else:
            print(f"{Fore.RED}❌ Fallo en sabotaje: {r.text}")
            return
    except Exception as e:
        print(f"{Fore.RED}❌ Error crítico: {e}")
        return

    time.sleep(2)

    # ---------------------------------------------------------
    # PASO 2: LA INTELIGENCIA (Verificación)
    # ---------------------------------------------------------
    print(f"{Fore.YELLOW}📡 [PASO 2] Verificando estado real en ERP...")
    r = requests.get(f"{PORTS['B11_ERP']}/enterprise/inventory/{SKU_TARGET}")
    data = r.json()
    print(f"   Estado actual ERP: SKU={data['sku']} | QTY={data['qty']}")
    
    if data['qty'] != 0:
        print(f"{Fore.RED}❌ EL SABOTAJE NO FUNCIONÓ. ABORTANDO.")
        return

    time.sleep(2)

    # ---------------------------------------------------------
    # PASO 3: EL ATAQUE (Intento de Campaña)
    # ---------------------------------------------------------
    print(f"{Fore.YELLOW}📡 [PASO 3] Simulando Agente de Marketing (B7) intentando gastar $5,000...")

    proposal_payload = {
        "action_type": "CREATE_CAMPAIGN",  # <--- CAMBIO: De "LAUNCH_CAMPAIGN" a "CREATE_CAMPAIGN"
        "parameters": {
            "sku": SKU_TARGET,
            "budget": 5000,
            "keywords": ["buy now", "sale"]
        },
        "reasoning": "Intento de campaña suicida durante crisis"
    }
    # Llamada a Governance
    gov_url = f"{PORTS['B4_ANALYST']}/api/governance/validate"
    start_time = time.time()
    r = requests.post(gov_url, json=proposal_payload)
    latency = time.time() - start_time
    
    if r.status_code != 200:
        print(f"{Fore.RED}❌ Error HTTP en Gobernanza: {r.status_code}")
        return

    response_data = r.json()

    # ---------------------------------------------------------
    # PASO 4: LA DEFENSA (El Escudo)
    # ---------------------------------------------------------
    print_step("RESULTADO DE GOBERNANZA", "Analizando respuesta del escudo...")

    status = response_data.get("governance_status")
    reason = response_data.get("block_reason")

    if status == "REJECTED":
        print(f"{Fore.GREEN}🛡️  ESCUDO ACTIVADO (SUCCESS)")
        print(f"{Fore.GREEN}✅ Estado: {status}")
        print(f"{Fore.GREEN}✅ Razón: {reason}")
        print(f"{Fore.CYAN}⚡ Tiempo de reacción: {latency:.4f} segundos")
    else:
        print(f"{Fore.RED}💀 FALLO CATASTRÓFICO: La campaña fue APROBADA con stock 0.")
        print(f"Respuesta: {response_data}")
        return

    time.sleep(2)

    # ---------------------------------------------------------
    # PASO 5: LA EVIDENCIA (Dashboard)
    # ---------------------------------------------------------
    print_step("CHECK FINAL: DASHBOARD FEED", "Verificando qué ve el usuario en el Frontend...")
    
    # Consultamos las alertas activas (simulando lo que hace el BFF)
    alerts_url = f"{PORTS['B4_ANALYST']}/alerts/active"
    r = requests.get(alerts_url)
    alerts = r.json()
    
    found_alert = False
    for alert in alerts:
        if "GOBERNANZA BLOQUEÓ" in alert.get("message", ""):
            print(f"{Fore.GREEN}🖥️  ALERTA VISIBLE EN DASHBOARD:")
            print(f"   mensaje: '{alert['message']}'")
            print(f"   severidad: {alert['severity']}")
            found_alert = True
            break
            
    if not found_alert:
        print(f"{Fore.YELLOW}⚠️  Aviso: La campaña fue bloqueada pero la alerta no apareció en el feed público.")
    
    print("\n")
    print(f"{Fore.GREEN}████████████████████████████████████████")
    print(f"{Fore.GREEN}   SIMULACIÓN DE GUERRA COMPLETADA: ÉXITO   ")
    print(f"{Fore.GREEN}   SISTEMA SEGURO. CLIENTE PROTEGIDO.       ")
    print(f"{Fore.GREEN}████████████████████████████████████████")

if __name__ == "__main__":
    check_health()
    run_war_game()