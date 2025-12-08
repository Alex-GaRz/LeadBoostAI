import asyncio
import os
from dotenv import load_dotenv
from microservice_analyst.services.strategy_engine import strategy_engine
from microservice_analyst.models.schemas import MarketSignal

# Cargar variables de entorno
load_dotenv()

async def test_round_table():
    print("\n🧪 [TEST] Iniciando Protocolo de Mesa Redonda (CMO -> CFO -> CEO)...")
    
    # 1. Simular Señal
    signal = MarketSignal(
        source="reddit",
        content="Los usuarios se quejan de que las herramientas de email marketing son muy complejas y caras.",
        sentiment_score=-0.8,
        timestamp="2023-10-27T10:00:00"
    )
    
    context = {
        "budget_available": "$5,000 USD",
        "active_campaigns_count": 2
    }

    # 2. Ejecutar Motor
    proposal = await strategy_engine.generate_strategy(signal, context)

    # 3. Validar Resultados
    print("\n" + "="*50)
    print("📝 TRANSCRIPCIÓN DEL DEBATE")
    print("="*50)
    
    for entry in proposal.debate_transcript:
        print(f"\n🗣️  {entry.agent_role}:")
        print(f"    {entry.content[:150]}...") # Mostramos solo el inicio para no saturar

    print("\n" + "="*50)
    print("👔 DECISIÓN FINAL DEL CEO (JSON PARSEADO)")
    print("="*50)
    print(f"Tipo de Acción: {proposal.action_type}")
    print(f"Urgencia:       {proposal.urgency}")
    print(f"Confianza:      {proposal.confidence_score}")
    print(f"Razonamiento:   {proposal.reasoning}")
    print(f"Parámetros:     {proposal.parameters}")

if __name__ == "__main__":
    asyncio.run(test_round_table())