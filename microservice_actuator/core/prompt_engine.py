import logging
from openai import OpenAI, BadRequestError

logger = logging.getLogger("PromptEngine")

class RecursivePromptGenerator:
    def __init__(self, client: OpenAI):
        self.client = client
        self.model_refiner = "gpt-4-turbo-preview"

    def optimize_dalle_prompt(self, base_concept: str, audience: str, rag_context: str = "") -> str:
        """
        Transforma un concepto de negocio en un prompt técnico para DALL-E 3,
        inyectando sabiduría histórica (RAG) si está disponible.
        """
        
        # Inyectamos el contexto RAG directamente en las reglas del sistema
        # para que tenga peso normativo sobre la generación.
        system_prompt = f"""
        Eres un Ingeniero de Prompts para DALL-E 3. 
        Tu objetivo es convertir conceptos de marketing en descripciones visuales fotorrealistas.
        
        CONTEXTO ESTRATÉGICO (HISTORIAL DE ÉXITO/FRACASO):
        {rag_context if rag_context else "No hay datos históricos disponibles. Usa mejores prácticas generales."}

        REGLAS:
        1. Integra los estilos exitosos mencionados en el contexto estratégico.
        2. EVITA ESTRICTAMENTE los elementos marcados como negativos en el contexto.
        3. No incluyas texto en la imagen.
        4. Describe la iluminación (ej. Cinematic, Golden Hour).
        5. Describe el estilo (ej. 8k, Photorealistic, Unreal Engine 5 render).
        6. Evita contenido NSFW, violencia o marcas registradas.
        """
        
        user_prompt = f"Concepto: {base_concept}. Audiencia objetivo: {audience}. Crea un prompt detallado."

        try:
            response = self.client.chat.completions.create(
                model=self.model_refiner,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error optimizando prompt: {e}")
            return f"High quality photo representing {base_concept}"

    def safe_generate_image(self, prompt: str, size="1024x1024") -> str:
        """
        Intenta generar la imagen. Si falla por Content Policy, reescribe el prompt y reintenta.
        """
        max_retries = 2
        current_prompt = prompt

        for attempt in range(max_retries + 1):
            try:
                logger.info(f"🎨 DALL-E Generación (Intento {attempt+1})...")
                response = self.client.images.generate(
                    model="dall-e-3",
                    prompt=current_prompt,
                    size=size,
                    quality="standard",
                    n=1,
                )
                return response.data[0].url

            except BadRequestError as e:
                error_msg = str(e).lower()
                if "content_policy" in error_msg and attempt < max_retries:
                    logger.warning("⚠️ Violación de Política de Contenido detectada. Aplicando Safe-Washing...")
                    current_prompt = self._sanitize_prompt(current_prompt)
                else:
                    logger.error(f"Error crítico en DALL-E: {e}")
                    raise e
            except Exception as e:
                logger.error(f"Error desconocido en DALL-E: {e}")
                return None
        return None

    def _sanitize_prompt(self, dirty_prompt: str) -> str:
        """
        Usa GPT-4 para eliminar elementos controversiales del prompt.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model_refiner,
                messages=[
                    {"role": "system", "content": "Reescribe el siguiente prompt para que sea totalmente seguro (Family Friendly) y cumpla las políticas de OpenAI, manteniendo la estética visual."},
                    {"role": "user", "content": dirty_prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception:
            return "Abstract modern art representation of business growth, safe for work, blue tones."