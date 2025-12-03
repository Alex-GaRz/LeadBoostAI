import logging
import json
import base64
import os
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional

logger = logging.getLogger("ImageCritic")

class ImageCritique(BaseModel):
    approved: bool
    score: int = Field(..., description="Score from 0 to 100")
    reason: str
    flaws: List[str] = Field(default_factory=list)

class ImageAuditor:
    def __init__(self, client: OpenAI):
        self.client = client
        self.model = "gpt-4o"  # Vision capable model

    def _encode_image(self, image_path: str) -> str:
        """Convierte una imagen local a Base64 para que GPT pueda verla."""
        try:
            with open(image_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            logger.error(f"Error encoding image: {e}")
            return None

    def _load_image_content(self, image_url: str) -> Optional[dict]:
        """Helper to load image content for OpenAI API (URL or Base64)."""
        if not image_url:
            return None
            
        if image_url.startswith("http"):
            return {"type": "image_url", "image_url": {"url": image_url}}
        elif os.path.exists(image_url):
            base64_image = self._encode_image(image_url)
            if base64_image:
                return {
                    "type": "image_url", 
                    "image_url": {"url": f"data:image/png;base64,{base64_image}"}
                }
        return None

    async def audit_image(self, image_url: str, brand_context: str, reference_style_url: str = None) -> ImageCritique:
        logger.info(f"🧐 Auditing Image: {image_url[:50]}...")
        
        # 1. Cargar imagen candidata
        candidate_content = self._load_image_content(image_url)
        if not candidate_content:
             return ImageCritique(approved=True, score=100, reason="Image not accessible", flaws=[])

        # 2. Construir Prompt con o sin Referencia Ideal
        messages = []
        
        # Si existe un "Set Ideal" (Referencia)
        if reference_style_url:
            reference_content = self._load_image_content(reference_style_url)
            if reference_content:
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "REFERENCE IMAGE (GOLD STANDARD): This represents the perfect brand style."},
                        reference_content
                    ]
                })

        # Prompt Principal Actualizado
        audit_instructions = (
            f"Act as a strict Senior Art Director. Analyze the CANDIDATE IMAGE generated for context: '{brand_context}'.\n"
            "CRITICAL CHECKS:\n"
            "1. Anatomical integrity (hands, faces, eyes).\n"
            "2. Text legibility (no gibberish).\n"
            "3. Brand Consistency (Does it look premium?).\n"
        )
        
        if reference_style_url:
            audit_instructions += "4. STYLE MATCH: Compare strictly against the REFERENCE IMAGE provided. Are the lighting, color palette, and mood consistent?\n"

        audit_instructions += "Return JSON: {approved: bool, score: 0-100, reason: str, flaws: []}. If score < 80, approved=False."

        messages.append({
            "role": "user",
            "content": [
                {"type": "text", "text": audit_instructions},
                {"type": "text", "text": "CANDIDATE IMAGE TO AUDIT:"},
                candidate_content
            ]
        })

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
                max_tokens=300
            )

            content = response.choices[0].message.content
            data = json.loads(content)
            
            critique = ImageCritique(**data)
            
            if critique.approved:
                logger.info(f"✅ Image Approved. Score: {critique.score}")
            else:
                logger.warning(f"❌ Image Rejected. Score: {critique.score}. Flaws: {critique.flaws}")
                
            return critique

        except Exception as e:
            logger.error(f"⚠️ Image Audit Failed: {str(e)}")
            return ImageCritique(approved=False, score=0, reason=f"Audit Error: {str(e)}", flaws=["System Error"])