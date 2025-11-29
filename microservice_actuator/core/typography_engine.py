import io
import logging
import requests
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger("TypographyEngine")

class TypographyEngine:
    def __init__(self):
        # Intentar cargar fuente del sistema o usar default
        try:
            # En un entorno real, descargaríamos una fuente de Google Fonts aquí
            self.font_path = "arial.ttf" 
            self.font_large = ImageFont.truetype(self.font_path, 60)
            self.font_small = ImageFont.truetype(self.font_path, 35)
        except IOError:
            self.font_large = ImageFont.load_default()
            self.font_small = ImageFont.load_default()

    def process_image(self, image_url: str, headline: str, cta: str) -> bytes:
        """
        Descarga, analiza y superpone texto en la imagen.
        """
        # 1. Descargar Imagen
        try:
            response = requests.get(image_url, timeout=10)
            image_bytes = response.content
        except Exception as e:
            logger.error(f"Error descargando imagen para post-proceso: {e}")
            return None

        # 2. Convertir a PIL
        try:
            pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
            width, height = pil_img.size
            
            # --- ANÁLISIS DE VISIÓN (OpenCV) ---
            # Convertir a array numpy para CV2
            cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGBA2GRAY)
            
            # Analizar el tercio inferior de la imagen (donde suele ir el texto)
            bottom_third = cv_img[int(height*0.66):, :]
            avg_brightness = np.mean(bottom_third)
            
            # Decisión de color basada en contraste
            text_color = (255, 255, 255, 255) # Blanco
            shadow_color = (0, 0, 0, 200)     # Negro
            
            # Si el fondo es muy claro, oscurecemos la zona inferior con un gradiente
            if avg_brightness > 127:
                self._draw_gradient_overlay(pil_img)

            # 3. Dibujar Texto
            draw = ImageDraw.Draw(pil_img)
            
            # Posicionamiento (Centrado en el tercio inferior)
            text_x = width // 2
            text_y_headline = int(height * 0.75)
            text_y_cta = int(height * 0.85)

            # Renderizar Headline con borde/sombra
            self._draw_text_with_stroke(draw, headline, text_x, text_y_headline, self.font_large, text_color, shadow_color)
            
            # Renderizar CTA
            self._draw_text_with_stroke(draw, cta.upper(), text_x, text_y_cta, self.font_small, (255, 215, 0, 255), shadow_color) # Dorado

            # 4. Retornar bytes
            output = io.BytesIO()
            pil_img.save(output, format="PNG")
            return output.getvalue()

        except Exception as e:
            logger.error(f"Error en procesamiento de imagen: {e}")
            return image_bytes # Retornar original si falla el proceso

    def _draw_gradient_overlay(self, image):
        """Añade un 'scrim' (sombra degradada) abajo para garantizar lectura."""
        width, height = image.size
        gradient = Image.new('L', (width, int(height/3)), color=0)
        for y in range(int(height/3)):
            opacity = int(255 * (y / (height/3)) * 0.6) # Max 60% opacidad
            # Dibujar linea por linea es lento en python puro, pero ok para MVP
            # En prod usaríamos numpy arrays o gradientes pre-renderizados
            pass 
        # (Simplificado para este snippet: oscureceremos todo el bloque inferior ligeramente)
        overlay = Image.new('RGBA', image.size, (0,0,0,0))
        draw = ImageDraw.Draw(overlay)
        draw.rectangle([(0, height*0.6), (width, height)], fill=(0,0,0,100))
        image.alpha_composite(overlay)

    def _draw_text_with_stroke(self, draw, text, x, y, font, color, stroke_color):
        # Calcular tamaño para centrar
        # Nota: textbbox es el método moderno de PIL, textsize está deprecado
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
        except AttributeError:
            # Fallback para versiones viejas de Pillow
            text_w, text_h = draw.textsize(text, font=font)

        pos = (x - text_w / 2, y - text_h / 2)

        # Simular borde dibujando en offsets
        offset = 2
        for off_x in [-offset, offset]:
            for off_y in [-offset, offset]:
                draw.text((pos[0]+off_x, pos[1]+off_y), text, font=font, fill=stroke_color)
        
        # Texto principal
        draw.text(pos, text, font=font, fill=color)