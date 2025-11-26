import os
import logging
from openai import OpenAI
from microservice_actuator.models.extended_schemas import CreativeAsset, PlatformName

logger = logging.getLogger("CreativeFactory")

class CreativeFactory:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        self.model_text = "gpt-4-turbo-preview"
        self.model_image = "dall-e-3"

    def generate_asset(self, platform: PlatformName, reasoning: str, audience_desc: str) -> CreativeAsset:
        if not self.client:
            return CreativeAsset(headline="[MOCK] Sin API Key", body_text="Texto simulado", call_to_action="Learn More")

        logger.info(f"🎨 Fabricando creativo para {platform.value}...")

        # 1. Generación de Copy Estructurado
        copy_prompt = self._build_copy_prompt(platform, reasoning, audience_desc)
        
        def clean_text(text):
            return text.replace('*', '').replace('"', '').replace('_', '').strip()

        try:
            completion = self.client.chat.completions.create(
                model=self.model_text,
                messages=[{"role": "system", "content": "Eres un experto en AdTech y Copywriting."},
                          {"role": "user", "content": copy_prompt}],
                temperature=0.7
            )
            raw_text = completion.choices[0].message.content

            lines = raw_text.split('\n')
            headline = clean_text(next((l.split(':')[-1] for l in lines if "HEADLINE" in l), "Oferta Exclusiva"))
            body = clean_text(next((l.split(':')[-1] for l in lines if "BODY" in l), raw_text[:100]))
            cta = clean_text(next((l.split(':')[-1] for l in lines if "CTA" in l), "Más Información"))
            # ---------------------------------------------------
            
        except Exception as e:
            logger.error(f"Error generando texto: {e}")
            headline, body, cta = "Error GenAI", str(e), "Retry"

        # 2. Generación de Imagen (Solo Meta/Display)
        image_url = None
        if platform == PlatformName.META:
            image_prompt = f"Professional digital marketing ad image for: {headline}. Style: Modern, Minimalist, High conversion. Context: {reasoning}"
            try:
                img_response = self.client.images.generate(
                    model=self.model_image,
                    prompt=image_prompt[:1000],
                    size="1024x1024",
                    quality="standard",
                    n=1,
                )
                image_url = img_response.data[0].url
            except Exception as e:
                logger.error(f"Error generando imagen: {e}")
                image_url = "[https://placehold.co/1024x1024/png?text=AI+Generation+Failed](https://placehold.co/1024x1024/png?text=AI+Generation+Failed)"

        return CreativeAsset(
            headline=headline,
            body_text=body,
            image_url=image_url,
            call_to_action=cta
        )

    def _build_copy_prompt(self, platform: PlatformName, reasoning: str, audience: str) -> str:
        base = f"Contexto: {reasoning}. Audiencia: {audience}. "
        if platform == PlatformName.GOOGLE:
            return base + "Genera un RSA (Responsive Search Ad). FORMATO REQUERIDO: \nHEADLINE: (Max 30 chars) \nBODY: (Max 90 chars) \nCTA: (Max 15 chars). Enfócate en intención de búsqueda."
        elif platform == PlatformName.LINKEDIN:
            return base + "Genera un Ad B2B profesional. FORMATO REQUERIDO: \nHEADLINE: (Profesional y directo) \nBODY: (Thought leadership, max 150 chars) \nCTA: (Acción profesional)."
        else: # Meta
            return base + "Genera un Ad de Facebook. FORMATO REQUERIDO: \nHEADLINE: (Gancho emocional, max 40 chars) \nBODY: (AIDA framework, max 125 chars) \nCTA: (Verbo de acción)."
