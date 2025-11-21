import sys
import os
import logging

# Configuración de logs para ver qué pasa en tiempo real
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Truco para poder importar módulos desde la carpeta raíz
sys.path.append(os.getcwd())

try:
    from microservice_analyst.services.strategy_engine import StrategyEngine
except ImportError as e:
    print("❌ Error de importación: Asegúrate de ejecutar este script desde la carpeta raíz 'LeadBoostAI'")
    print(f"Detalle: {e}")
    sys.exit(1)

def run_integration_test():
    print("\n" + "="*60)
    print("🚀 INICIANDO PRUEBA DE SISTEMA COMPLETO (B6 -> B11/B10 -> B12)")
    print("="*60 + "\n")

    # 1. Instanciar el Cerebro del Consejero
    print("1️⃣  Inicializando StrategyEngine (Bloque 6)...")
    engine = StrategyEngine()

    # 2. Simular una oportunidad de mercado (Input del Radar)
    opportunity = "LANZAMIENTO_LAPTOP_GAMER_Q4"
    print(f"2️⃣  Oportunidad Detectada: {opportunity}")
    print("    -> Solicitando evaluación estratégica...")

    # 3. Ejecutar la magia (Esta función llama a B11, B10 y B12 internamente)
    decision = engine.evaluate_opportunity(opportunity)

    # 4. Imprimir el resultado final
    print("\n" + "="*60)
    print("🏁 RESULTADO FINAL DEL CONSEJERO")
    print("="*60)
    
    if decision.get("status") in ["ERROR", "ABORTED"]:
        print(f"❌ FALLO: {decision.get('reason')}")
        print("   (Verifica que B10, B11 y B12 estén corriendo y entregando datos)")
    else:
        print(f"✅ ESTRATEGIA GENERADA: {decision['strategy_id']}")
        print(f"🎯 Acción Recomendada:  {decision['action']}")
        print(f"🧠 Razonamiento:        {decision['reasoning']}")
        print(f"💰 ROI Proyectado:      {decision['financial_impact']['roi_projected']:.2%}")
        
        if decision['operational_impact']['logistics_alert'] != "N/A":
            print(f"🚚 Alerta Logística:    {decision['operational_impact']['logistics_alert']}")

if __name__ == "__main__":
    run_integration_test()