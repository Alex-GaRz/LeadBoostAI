import asyncio
import os
from dotenv import load_dotenv
from openai import OpenAI

# Cargar entorno
load_dotenv()
load_dotenv(os.path.join("backend", ".env"))

# Importamos el Crítico actualizado
from microservice_actuator.core.critics.text_critic import CopyEditor

async def test_cross_modal_intelligence():
    print("🕵️ INICIANDO PRUEBA DE AUDITORÍA FASE 21 (TEXTO vs IMAGEN)...")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: No OPENAI_API_KEY encontrada.")
        return

    client = OpenAI(api_key=api_key)
    editor = CopyEditor(client)

    # --- DATOS DE LA TRAMPA ---
    # Texto alegre (incoherente con la imagen)
    input_headline = "¡Disfruta del Sol y la Arena!"
    input_body = "Ven a relajarte en nuestras playas paradisíacas con un cóctel tropical. La felicidad te espera bajo el sol radiante."
    
    # Imagen oscura (La realidad visual)
    visual_context = "Una ciudad distópica futurista, oscura, lloviendo ácido, luces de neón parpadeantes, atmósfera peligrosa y seria. Estilo Cyberpunk."

    print(f"\n⚡ ESCENARIO DE CONTRADICCIÓN:")
    print(f"   📝 Texto Propuesto: '{input_headline}'")
    print(f"   👁️ Realidad de la Imagen: {visual_context}")
    print("   ... El Auditor está analizando la coherencia ...\n")

    # Ejecutamos la auditoría con el nuevo parámetro visual_context
    critique = await editor.review_copy(
        headline=input_headline, 
        body=input_body, 
        visual_context=visual_context,
        tone_guide="Serious & Cinematic"
    )

    print("-" * 60)
    print("🧐 VEREDICTO DEL AUDITOR:")
    print(f"   ¿Aprobado?: {critique.approved}")
    print(f"   ⚠️ Problemas Detectados: {critique.issues}")
    print("-" * 60)
    print("✍️ CORRECCIÓN AUTOMÁTICA (Debe coincidir con la imagen oscura):")
    print(f"   Nuevo Título: {critique.corrected_headline}")
    print(f"   Nuevo Cuerpo: {critique.corrected_body}")
    print("-" * 60)

    # Validación del Test
    if "sun" in critique.corrected_body.lower() or "playa" in critique.corrected_body.lower():
        print("❌ FALLO: El auditor no corrigió el tono. Sigue hablando de playa.")
    else:
        print("✅ ÉXITO: El auditor reescribió el texto para adaptarse al Cyberpunk.")

if __name__ == "__main__":
    asyncio.run(test_cross_modal_intelligence())