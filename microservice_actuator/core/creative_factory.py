import os
import logging
from openai import OpenAI
from microservice_actuator.models.extended_schemas import CreativeAsset, PlatformName
# Nuevas importaciones
from microservice_actuator.core.prompt_engine import RecursivePromptGenerator
from microservice_actuator.core.typography_engine import TypographyEngine
from microservice_actuator.core.dam_repository import DAMRepository

logger = logging.getLogger("CreativeFactory")

class CreativeFactory:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        # Inicializar Motores
        if self.client:
            self.prompt_engine = RecursivePromptGenerator(self.client)
        self.typography_engine = TypographyEngine()
        self.dam = DAMRepository()

    def generate_asset(self, platform: PlatformName, reasoning: str, audience_desc: str, campaign_id: str = "temp") -> CreativeAsset:
        """
        Orquesta la creación completa del activo publicitario.
        """
        if not self.client:
            return CreativeAsset(headline="[MOCK] Sin API Key", body_text="Texto simulado", call_to_action="Learn More")

        logger.info(f"🎨 [FÁBRICA] Iniciando producción para {platform.value}...")

        # 1. Generación de Copy (Texto)
        # Reutilizamos la lógica simple o la integramos en PromptEngine si se desea. 
        # Por brevedad, mantenemos una llamada directa simple aquí para el texto.
        headline, body, cta = self._generate_text_components(platform, reasoning, audience_desc)

        # 2. Generación Visual (Solo si es Meta/Display)
        final_image_url = None
        dam_path = None
        
        if platform == PlatformName.META:
            # A. Ingeniería de Prompt
            visual_concept = f"{reasoning} visual representation for {audience_desc}"
            optimized_prompt = self.prompt_engine.optimize_dalle_prompt(visual_concept, audience_desc)
            
            # B. Generación Segura DALL-E 3
            raw_image_url = self.prompt_engine.safe_generate_image(optimized_prompt)

            if raw_image_url:
                # C. Post-Procesamiento Tipográfico (OpenCV/Pillow)
                logger.info("🖌️ Aplicando tipografía inteligente...")
                processed_image_bytes = self.typography_engine.process_image(raw_image_url, headline, cta)
                
                if processed_image_bytes:
                    # D. Almacenamiento DAM
                    metadata = {
                        "prompt": optimized_prompt,
                        "original_url": raw_image_url,
                        "platform": platform.value,
                        "headline_used": headline
                    }
                    dam_path = self.dam.save_asset(campaign_id, processed_image_bytes, metadata)
                    # En producción, aquí subiríamos a S3 y obtendríamos una URL pública.
                    # Para este entorno local, usamos el path o la URL original si falló el guardado.
                    final_image_url = dam_path if dam_path else raw_image_url

        return CreativeAsset(
            headline=headline,
            body_text=body,
            image_url=final_image_url or "https://via.placeholder.com/1024",
            call_to_action=cta
        )

    def _generate_text_components(self, platform, reasoning, audience):
        # Lógica simplificada de generación de texto para mantener el foco en la imagen
        try:
            completion = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "Genera JSON con keys: headline, body, cta."},
                    {"role": "user", "content": f"Anuncio para {platform.value}. Contexto: {reasoning}"}
                ]
            )
            content = completion.choices[0].message.content
            # Parsing simplificado (en prod usar json mode)
            return "Oferta Exclusiva", content[:100], "Ver Más"
        except:
            return "Título Genérico", "Cuerpo del anuncio", "Click Aquí"