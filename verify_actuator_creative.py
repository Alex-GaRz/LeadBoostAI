import asyncio
import uuid
from datetime import datetime
from dotenv import load_dotenv
from microservice_actuator.handlers.marketing_handler import MarketingHandler
from microservice_actuator.models.schemas import ActionRequest, ActionType, UrgencyLevel

load_dotenv()

async def test_creative_generation():
    print("\n🧪 [TEST] Verificando Generador de Copy Creativo...")
    
    handler = MarketingHandler()
    
    # Simular una solicitud de acción que viene del CEO
    action = ActionRequest(
        action_id=str(uuid.uuid4()),
        action_type=ActionType.CREATE_CAMPAIGN,
        reasoning="Existe una oportunidad clara en el sector SaaS por descontento con precios altos. Lanzar oferta agresiva.",
        parameters={
            "sku": "SAAS-PRO-LIFETIME",
            "target_audience": "Emprendedores frustrados",
            "ad_tone": "Provocativo y directo",
            "platform_focus": "LinkedIn",
            "budget_cap": 2000
        },
        urgency=UrgencyLevel.HIGH,
        timestamp=datetime.now()
    )
    
    result = await handler.execute(action)
    
    print("\n" + "="*50)
    print("📢 ANUNCIO GENERADO (Output Real)")
    print("="*50)
    print(result.details.get("full_copy"))
    print("\n" + "-"*50)
    print(f"Estado Ejecución: {result.status}")
    print(f"Feedback ERP: {result.details.get('erp_feedback')}")

if __name__ == "__main__":
    asyncio.run(test_creative_generation())