import sys
import os
import logging
import asyncio # Necesario para ejecutar el Actuador (es asíncrono)

# Configuración de logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Asegurar que podemos importar los módulos
sys.path.append(os.getcwd())

try:
    # Bloque 6: Analista
    from microservice_analyst.services.strategy_engine import StrategyEngine
    # Bloque 7: Actuador
    from microservice_actuator.core.dispatcher import ActionDispatcher
    from microservice_actuator.models.schemas import ActionRequest, ActionType, MarketSignal
except ImportError as e:
    print("❌ Error de importación: Asegúrate de ejecutar este script desde la carpeta raíz 'LeadBoostAI'")
    print(f"Detalle: {e}")
    sys.exit(1)

async def run_full_system():
    print("\n" + "="*60)
    print("🚀 INICIANDO PRUEBA DE SISTEMA END-TO-END (B6 -> B11/B10 -> B7)")
    print("="*60 + "\n")

    # --- FASE 1: INTELIGENCIA (Bloque 6) ---
    print("1️⃣  [ANALISTA] Inicializando StrategyEngine...")
    engine = StrategyEngine()

    opportunity = "LANZAMIENTO_LAPTOP_GAMER_Q4"
    print(f"2️⃣  [ANALISTA] Evaluando oportunidad: {opportunity}...")
    
    # Creamos un objeto MarketSignal
    opportunity_signal = MarketSignal(
        source="Radar",
        content=opportunity,
        sentiment_score=0.8
    )
    decision_proposal = await engine.generate_strategy(opportunity_signal, {})

    # Validación rápida del resultado del Analista
    if not decision_proposal or getattr(decision_proposal, 'status', None) == "ERROR":
        print("❌ El Analista falló. Abortando misión.")
        return

    print(f"✅ [ANALISTA] Estrategia generada: {decision_proposal.action_type}")
    print(f"   Copy sugerido: {decision_proposal.parameters.get('ad_copy_draft', 'N/A')[:50]}...")

    # --- FASE 2: PUENTE (Traducción de Estrategia a Ejecución) ---
    print("\n" + "-"*60)
    print("🔄 [PUENTE] Convirtiendo Propuesta en Orden de Ejecución...")
    
    # Convertimos la 'ActionProposal' (Estrategia) en 'ActionRequest' (Táctica)
    # Nota: Mapeamos los campos necesarios para que el Actuador entienda la orden
    action_request = ActionRequest(
        action_type=decision_proposal.action_type,
        reasoning=decision_proposal.reasoning,
        parameters=decision_proposal.parameters,
        urgency=decision_proposal.urgency
    )
    print("✅ [PUENTE] Orden lista para despacho.")

    # --- FASE 3: EJECUCIÓN (Bloque 7) ---
    print("\n" + "-"*60)
    print("3️⃣  [ACTUADOR] Despachando orden al ActionDispatcher...")
    
    dispatcher = ActionDispatcher()
    
    # Ejecutamos la acción (Es asíncrono porque conecta con APIs externas simuladas)
    execution_result = await dispatcher.dispatch(action_request)

    # --- REPORTE FINAL ---
    print("\n" + "="*60)
    print("🏁 REPORTE DE MISIÓN COMPLETA")
    print("="*60)
    
    print(f"🆔 ID Ejecución:   {execution_result.execution_id}")
    print(f"📊 Estado Final:   {execution_result.status}")
    
    if execution_result.details:
        print("\n📝 Detalles de Ejecución (Feedback del Actuador):")
        for key, value in execution_result.details.items():
            print(f"   - {key}: {value}")
            
    if execution_result.error_message:
        print(f"\n❌ Errores reportados: {execution_result.error_message}")

if __name__ == "__main__":
    # Ejecutamos el loop asíncrono
    asyncio.run(run_full_system())