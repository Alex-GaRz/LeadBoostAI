import os
import logging
from openai import OpenAI
from microservice_actuator.models.extended_schemas import CreativeAsset, PlatformName
from microservice_actuator.core.prompt_engine import RecursivePromptGenerator
from microservice_actuator.core.typography_engine import TypographyEngine
from microservice_actuator.core.dam_repository import DAMRepository
from microservice_actuator.core.memory_client import MemoryClient

logger = logging.getLogger("CreativeFactory")

class CreativeFactory:
    def __init__(self, memory_client: MemoryClient = None):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        self.memory_client = memory_client
        
        if self.client:
            self.prompt_engine = RecursivePromptGenerator(self.client)
        self.typography_engine = TypographyEngine()
        self.dam = DAMRepository()

    async def generate_asset(self, platform: PlatformName, reasoning: str, audience_desc: str, campaign_id: str = "temp") -> CreativeAsset:
        """
        Orquesta la creación del activo. Detecta plataformas visuales (Meta/Instagram) para activar RAG + DALL-E.
        """
        if not self.client:
            return CreativeAsset(headline="[MOCK] Sin API Key", body_text="Texto simulado", call_to_action="Learn More")

        # 1. Detección Robusta de Plataforma Visual
        # Obtenemos el valor string sea cual sea el tipo de objeto (Enum o str)
        platform_val = getattr(platform, "value", str(platform)).lower()
        
        # Lista de plataformas que activan generación de imagen
        visual_platforms = ["meta", "instagram", "facebook", "display"]
        is_visual = platform_val in visual_platforms or platform == PlatformName.META

        logger.info(f"🎨 [FÁBRICA] Iniciando producción para '{platform_val}' (Visual Mode: {is_visual})...")

        # 2. Generación de Copy (Texto)
        headline, body, cta = self._generate_text_components(platform, reasoning, audience_desc)

        final_image_url = None
        dam_path = None
        
        # 3. Generación Visual (Solo si es plataforma visual)
        if is_visual:
            logger.info(f"👁️ Detectada plataforma visual ({platform_val}). Activando RAG + DALL-E...")
            
            # A. RAG: Recuperación de Memoria Estratégica
            rag_instruction = await self._build_strategic_context(reasoning, audience_desc)
            
            # B. Ingeniería de Prompt (Fusionada con Memoria)
            visual_concept = f"{reasoning} visual representation for {audience_desc}"
            optimized_prompt = self.prompt_engine.optimize_dalle_prompt(
                base_concept=visual_concept, 
                audience=audience_desc,
                rag_context=rag_instruction
            )
            
            # C. Generación Segura DALL-E 3
            raw_image_url = self.prompt_engine.safe_generate_image(optimized_prompt)

            if raw_image_url:
                # D. Post-Procesamiento
                logger.info("🖌️ Aplicando tipografía inteligente...")
                processed_image_bytes = self.typography_engine.process_image(raw_image_url, headline, cta)
                
                if processed_image_bytes:
                    # E. Guardado
                    metadata = {
                        "prompt": optimized_prompt,
                        "original_url": raw_image_url,
                        "platform": platform_val,
                        "headline_used": headline,
                        "rag_used": bool(rag_instruction)
                    }
                    dam_path = self.dam.save_asset(campaign_id, processed_image_bytes, metadata)
                    final_image_url = dam_path if dam_path else raw_image_url

        return CreativeAsset(
            headline=headline,
            body_text=body,
            image_url=final_image_url or "https://via.placeholder.com/1024",
            call_to_action=cta
        )

    async def _build_strategic_context(self, product_context: str, audience: str) -> str:
        if not self.memory_client:
            return ""

        query = f"visual strategy performance for {product_context} targeting {audience}"
        memories = await self.memory_client.retrieve_creative_context(query)
        
        if not memories:
            return ""

        positive_vibes = []
        negative_constraints = []

        for mem in memories:
            metadata = mem.get('metadata', {})
            content = mem.get('text_content', '')
            roi = metadata.get('roi', 1.0)

            if roi > 1.2:
                positive_vibes.append(f"- PROVEN SUCCESS: {content}")
            elif roi < 0.8:
                negative_constraints.append(f"- PROVEN FAILURE (AVOID): {content}")

        context_str = ""
        if positive_vibes:
            context_str += "EMULATE THESE STYLES (High ROI):\n" + "\n".join(positive_vibes) + "\n\n"
        if negative_constraints:
            context_str += "STRICTLY AVOID THESE ELEMENTS (Low ROI):\n" + "\n".join(negative_constraints)
            
        return context_str

    def _generate_text_components(self, platform, reasoning, audience):
        # Lógica simplificada
        try:
            val = getattr(platform, "value", str(platform))
            completion = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "Genera JSON con keys: headline, body, cta."},
                    {"role": "user", "content": f"Anuncio para {val}. Contexto: {reasoning}"}
                ]
            )
            content = completion.choices[0].message.content
            return "Oferta Exclusiva", content[:100], "Ver Más"
        except:
            return "Título Genérico", "Cuerpo del anuncio", "Click Aquí"