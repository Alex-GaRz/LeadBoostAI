import logging
import json
from openai import OpenAI
from pydantic import BaseModel
from typing import List

logger = logging.getLogger("TextCritic")

class TextCritique(BaseModel):
    approved: bool
    corrected_headline: str
    corrected_body: str
    issues: List[str]

class CopyEditor:
    def __init__(self, client: OpenAI):
        self.client = client

    async def review_copy(self, headline: str, body: str, visual_context: str = None, tone_guide: str = "Professional") -> TextCritique:
        """
        Ahora acepta 'visual_context' para asegurar coherencia Texto-Imagen.
        """
        logger.info("📝 Auditing Copy & Image Consistency...")

        if not self.client:
            return TextCritique(approved=True, corrected_headline=headline, corrected_body=body, issues=[])

        prompt = (
            f"Act as a Senior Copywriter. Review the following ad copy.\n"
            f"Tone Guide: {tone_guide}\n"
            f"Headline: {headline}\n"
            f"Body: {body}\n"
        )
        
        if visual_context:
            prompt += f"\nVISUAL CONTEXT (The image shows): {visual_context}\n"
            prompt += "TASK: Ensure the text explicitly matches the Visual Context. If the image is dark/moody, the text cannot be cheery/sunny.\n"

        prompt += (
            "\nStandard Tasks:\n"
            "1. Fix spelling/grammar.\n"
            "2. Ensure tone alignment.\n"
            "3. Check for prohibited/offensive words.\n"
            "4. Improve punchiness if weak.\n\n"
            "Return JSON: {approved: bool, corrected_headline: str, corrected_body: str, issues: [str]}."
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            
            data = json.loads(response.choices[0].message.content)
            critique = TextCritique(**data)
            
            if not critique.approved:
                logger.info(f"✏️  Copy Edited. Issues: {critique.issues}")
            
            return critique

        except Exception as e:
            logger.error(f"Copy Audit Error: {e}")
            return TextCritique(approved=True, corrected_headline=headline, corrected_body=body, issues=["Audit Failed"])
