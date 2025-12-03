import asyncio
from microservice_actuator.core.quality_loop import QualityLoop
from microservice_actuator.models.extended_schemas import CreativeAsset
from unittest.mock import AsyncMock, MagicMock

# Mocks simples para simular componentes
class MockImageAuditor:
    async def audit_image(self, url, brand_context):
        # SIMULACIÓN: Si la URL es "bad_image", reprueba. Si es "good_image", aprueba.
        if "bad" in url:
            return MagicMock(approved=False, score=10, reason="Too ugly", flaws=["Distorted face"])
        return MagicMock(approved=True, score=95, reason="Perfect", flaws=[])

class MockCopyEditor:
    async def review_copy(self, h, b):
        return MagicMock(approved=True, corrected_headline=h, corrected_body=b, issues=[])

async def test_retry_logic():
    print("🔥 INICIANDO CHAOS MONKEY TEST...")
    
    # 1. Configurar el Loop con nuestros auditores falsos
    loop = QualityLoop(MockImageAuditor(), MockCopyEditor())
    
    # 2. Variable para contar intentos
    attempts = 0

    # 3. Función generadora que falla 2 veces y acierta a la tercera
    async def unstable_generator(reasoning):
        nonlocal attempts
        attempts += 1
        print(f"   ⚙️ Generador ejecutándose (Intento #{attempts})...")
        
        # Simulamos que recibimos feedback del intento anterior
        if "FIX THIS" in reasoning:
            print(f"   👀 El generador recibió feedback: '{reasoning[-50:]}...'")

        if attempts < 3:
            return CreativeAsset(headline="Bad Ad", body_text="...", call_to_action="...", image_url="http://bad_image.com")
        else:
            return CreativeAsset(headline="Good Ad", body_text="...", call_to_action="...", image_url="http://good_image.com")

    # 4. Ejecutar el Loop
    final_asset = await loop.run_loop(
        generator_func=unstable_generator,
        base_reasoning="Vender zapatos",
        audience_desc="Runners",
        platform="meta"
    )

    # 5. Validaciones
    print("-" * 30)
    if attempts == 3:
        print("✅ ÉXITO: El sistema reintentó exactamente 3 veces.")
    else:
        print(f"❌ FALLO: Se esperaban 3 intentos, ocurrieron {attempts}.")

    if "good_image" in final_asset.image_url:
        print("✅ ÉXITO: El asset final es el de alta calidad.")
    else:
        print("❌ FALLO: Se entregó basura al cliente.")

if __name__ == "__main__":
    asyncio.run(test_retry_logic())