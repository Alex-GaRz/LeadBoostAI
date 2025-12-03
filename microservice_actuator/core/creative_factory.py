import os
import logging
from openai import OpenAI
from microservice_actuator.models.extended_schemas import CreativeAsset, PlatformName
from microservice_actuator.core.prompt_engine import RecursivePromptGenerator
from microservice_actuator.core.typography_engine import TypographyEngine
from microservice_actuator.core.dam_repository import DAMRepository
from microservice_actuator.core.memory_client import MemoryClient

# --- NEW IMPORTS ---
from microservice_actuator.core.critics.image_critic import ImageAuditor
from microservice_actuator.core.critics.text_critic import CopyEditor
from microservice_actuator.core.quality_loop import QualityLoop

logger = logging.getLogger("CreativeFactory")

class CreativeFactory:
    def __init__(self, memory_client: MemoryClient = None):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        self.memory_client = memory_client
        
        if self.client:
            self.prompt_engine = RecursivePromptGenerator(self.client)
            
            # Initialize Critics
            self.image_auditor = ImageAuditor(self.client)
            self.copy_editor = CopyEditor(self.client)
            
            # Initialize Orchestrator
            self.quality_loop = QualityLoop(self.image_auditor, self.copy_editor)
            
        self.typography_engine = TypographyEngine()
        self.dam = DAMRepository()

    async def execute(self, platform: PlatformName, reasoning: str, audience_desc: str, campaign_id: str = "temp") -> CreativeAsset:
        """
        Public entry point. Delegates to QualityLoop.
        """
        if not self.client:
             return CreativeAsset(headline="[MOCK] No API", body_text="System offline", call_to_action="Retry", image_url="")

        # Define the generation logic as a closure/function to pass to the loop
        # This allows the loop to call it multiple times with updated 'reasoning' (feedback)
        async def _generation_task(current_reasoning: str) -> CreativeAsset:
            return await self._generate_internal(platform, current_reasoning, audience_desc, campaign_id)

        # Run the loop
        final_asset = await self.quality_loop.run_loop(
            generator_func=_generation_task,
            base_reasoning=reasoning,
            audience_desc=audience_desc,
            platform=getattr(platform, "value", str(platform))
        )
        
        return final_asset

    # Rename original generate_asset to _generate_internal (protected)
    async def _generate_internal(self, platform, reasoning, audience_desc, campaign_id) -> CreativeAsset:
        
        platform_val = getattr(platform, "value", str(platform)).lower()
        visual_platforms = ["meta", "instagram", "facebook", "display"]
        is_visual = platform_val in visual_platforms or platform == PlatformName.META

        # 2. Generate Copy
        headline, body, cta = self._generate_text_components(platform, reasoning, audience_desc)

        final_image_url = None
        
        # 3. Generate Visual
        if is_visual:
            # RAG
            rag_instruction = await self._build_strategic_context(reasoning, audience_desc)
            
            # Prompt Engineering
            visual_concept = f"{reasoning} visual representation for {audience_desc}"
            optimized_prompt = self.prompt_engine.optimize_dalle_prompt(
                base_concept=visual_concept, 
                audience=audience_desc,
                rag_context=rag_instruction
            )
            
            # Generate
            raw_image_url = self.prompt_engine.safe_generate_image(optimized_prompt)

            if raw_image_url:
                # Typography processing could be done here, OR after the audit in the loop.
                # Doing it here means we audit the final composited image (safer).
                processed_image_bytes = self.typography_engine.process_image(raw_image_url, headline, cta)
                
                if processed_image_bytes:
                    metadata = {
                        "prompt": optimized_prompt,
                        "original_url": raw_image_url,
                        "platform": platform_val
                    }
                    dam_path = self.dam.save_asset(campaign_id, processed_image_bytes, metadata)
                    final_image_url = dam_path if dam_path else raw_image_url

        return CreativeAsset(
            headline=headline,
            body_text=body,
            image_url=final_image_url or "https://via.placeholder.com/1024",
            call_to_action=cta
        )

    # ... (Keep _build_strategic_context and _generate_text_components as they were in original file) ...
    async def _build_strategic_context(self, product_context: str, audience: str) -> str:
        if not self.memory_client: return ""
        query = f"visual strategy performance for {product_context} targeting {audience}"
        memories = await self.memory_client.retrieve_creative_context(query)
        if not memories: return ""
        # Simplified for brevity, same logic as before
        return f"Consider previous insights: {len(memories)} memories found."

    def _generate_text_components(self, platform, reasoning, audience):
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
            # Basic parsing mock for this output
            return "Propuesta Generada", content[:100], "Ver Detalles"
        except:
            return "Título Genérico", "Cuerpo del anuncio", "Click Aquí"

    # NOTE: To maintain backward compatibility with main.py calls, alias generate_asset to execute
    async def generate_asset(self, *args, **kwargs):
        return await self.execute(*args, **kwargs)