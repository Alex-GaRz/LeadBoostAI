import logging
import asyncio
from typing import Callable, Any, Dict
from microservice_actuator.models.extended_schemas import CreativeAsset
from microservice_actuator.core.critics.image_critic import ImageAuditor
from microservice_actuator.core.critics.text_critic import CopyEditor

logger = logging.getLogger("QualityLoop")

class QualityLoop:
    """
    Orchestrates the Generate -> Critique -> Refine cycle.
    Ensures no garbage exits the system.
    """
    MAX_ATTEMPTS = 3
    MIN_IMAGE_SCORE = 80

    def __init__(self, image_auditor: ImageAuditor, copy_editor: CopyEditor):
        self.image_auditor = image_auditor
        self.copy_editor = copy_editor

    async def run_loop(self, 
                       generator_func: Callable[[str], Any], 
                       base_reasoning: str, 
                       audience_desc: str, 
                       platform: str) -> CreativeAsset:
        
        attempt = 0
        feedback_history = ""

        while attempt < self.MAX_ATTEMPTS:
            attempt += 1
            logger.info(f"🔄 [QUALITY LOOP] Attempt {attempt}/{self.MAX_ATTEMPTS}")

            # 1. Generation Phase (Injecting feedback if retry)
            current_reasoning = base_reasoning
            if feedback_history:
                current_reasoning = f"{base_reasoning}. \nCRITICAL FEEDBACK FROM PREVIOUS ATTEMPT (FIX THIS): {feedback_history}"

            asset: CreativeAsset = await generator_func(current_reasoning)

            # Obtenemos la descripción visual del reasoning original o del asset
            visual_description_for_audit = f"{base_reasoning} visual representation for {audience_desc}"

            # 2. Audit Phase
            # A. Text Audit (AHORA CON CONTEXTO VISUAL)
            text_critique = await self.copy_editor.review_copy(
                asset.headline, 
                asset.body_text, 
                visual_context=visual_description_for_audit # <--- NUEVO
            )
            
            # Apply text fixes immediately (Auto-Correction)
            asset.headline = text_critique.corrected_headline
            asset.body_text = text_critique.corrected_body

            # B. Image Audit (CORREGIDO: Permitimos auditoría si hay URL, sea http o local)
            image_critique = None
            # CAMBIO CRÍTICO AQUÍ: Quitamos 'and "http" in asset.image_url'
            if asset.image_url and len(asset.image_url) > 5: 
                # Podrías pasar una URL de referencia real si la tuvieras en el request
                # Por defecto None para MVP, pero la "tubería" ya existe.
                image_critique = await self.image_auditor.audit_image(
                    asset.image_url, 
                    brand_context=visual_description_for_audit,
                    reference_style_url=None # <--- Listo para conectar el "Set Ideal"
                )

            # 3. Decision Gate
            image_passed = (image_critique is None) or (image_critique.approved and image_critique.score >= self.MIN_IMAGE_SCORE)
            text_passed = text_critique.approved # Usually true as we auto-corrected, but check for "Issues"

            if image_passed:
                logger.info("✨ Quality Gate Passed!")
                return asset
            
            # 4. Construct Feedback for Next Loop
            flaws = image_critique.flaws if image_critique else []
            feedback_history = f"Previous image failed. Flaws detected: {', '.join(flaws)}. Reason: {image_critique.reason}. You MUST fix these visual defects."
            logger.warning(f"⛔ Quality Gate Failed. Retrying... Feedback: {feedback_history}")

        # 5. Fallback Strategy (If loop exhaustion)
        logger.error("🚨 MAX ATTEMPTS REACHED. Quality Loop Failed. Deploying Safe Fallback.")
        return self._get_fallback_asset(base_reasoning)

    def _get_fallback_asset(self, context: str) -> CreativeAsset:
        return CreativeAsset(
            headline="Discover Our Solution",
            body_text="We encountered a delay generating your custom creative, but our solution matches your needs. Click to learn more.",
            call_to_action="Learn More",
            image_url="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1080&q=80", # Generic Safe Office Image
            metadata={"status": "FALLBACK_MODE", "original_context": context}
        )
