import sys
import os
import asyncio

# Truco para que Python encuentre el paquete 'microservice_actuator'
# Añade el directorio padre al path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from microservice_actuator.core.creative_factory import CreativeFactory

# 1. Creamos un Mock del Cliente de Memoria
class MockMemoryClient:
    async def retrieve_creative_context(self, query, limit=3):
        print(f"   └── 🧠 [MOCK] Consultando memoria para: '{query}'")
        return [
            {
                "text_content": "Use Neon Cyberpunk colors with high contrast.",
                "metadata": {"roi": 2.5}  # Alto ROI -> EMULATE
            },
            {
                "text_content": "Minimalist black and white sketches.",
                "metadata": {"roi": 0.5}  # Bajo ROI -> AVOID
            }
        ]

# 2. Creamos un Mock del Prompt Engine (para cuando no hay API Key)
class MockPromptEngine:
    def __init__(self, client): 
        pass
    def optimize_dalle_prompt(self, base_concept, audience, rag_context=""):
        return f"PROMPT OPTIMIZADO: {base_concept} | Contexto RAG usado: {len(rag_context)} chars"
    def safe_generate_image(self, prompt, size="1024x1024"):
        return "https://mock.url/image_generated.png"

async def test_generation():
    print("🚀 INICIANDO PRUEBA DE FLUJO RAG...")
    
    # Inicializamos la Factory con el Mock de Memoria
    mock_memory = MockMemoryClient()
    factory = CreativeFactory(memory_client=mock_memory)
    
    # --- FIX CRÍTICO ---
    # Si no hay API Key, la Factory no crea el prompt_engine.
    # Lo creamos manualmente con nuestro Mock para que el test no falle.
    if not hasattr(factory, 'prompt_engine') or factory.prompt_engine is None:
        print("⚠️ No se detectó OPENAI_API_KEY. Inyectando MockPromptEngine...")
        factory.client = True # Mock simple para pasar validaciones if self.client:
        factory.prompt_engine = MockPromptEngine(None)

    # 3. Ejecutamos la prueba de lógica
    print("\n--- PASO 1: Probando Fusión de Contexto ---")
    
    try:
        # Probamos específicamente la lógica interna de construcción de contexto RAG
        # Accedemos al método "privado" para validar la lógica sin gastar tokens
        context = await factory._build_strategic_context("Zapatillas Running", "Atletas Urbanos")
        
        print(f"\n📄 Contexto RAG Generado:\n{'-'*30}\n{context}\n{'-'*30}")
        
        # Validaciones
        success = True
        if "EMULATE THESE STYLES" in context and "Neon Cyberpunk" in context:
            print("✅ ÉXITO: Inyección positiva detectada (High ROI).")
        else:
            print("❌ FALLO: Falta la estrategia positiva.")
            success = False

        if "STRICTLY AVOID" in context and "Minimalist" in context:
            print("✅ ÉXITO: Restricción negativa detectada (Low ROI).")
        else:
            print("❌ FALLO: Falta la restricción negativa.")
            success = False
            
        if success:
            print("\n🎉 LA PRUEBA HA PASADO CORRECTAMENTE.")
            print("El Actuador está listo para consultar a la Memoria antes de crear.")

    except Exception as e:
        print(f"❌ Error durante el test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_generation())