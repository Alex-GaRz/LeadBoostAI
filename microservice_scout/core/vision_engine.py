import cv2
import numpy as np
import pytesseract
import tempfile
import os
import logging

# --- CONFIGURACIÓN TESSERACT WINDOWS ---
# Apunta esto a donde instalaste Tesseract en el Paso 1
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# ---------------------------------------

# --- PARCHE DE RESILIENCIA ---
try:
    from fer import FER
    FER_AVAILABLE = True
except (ImportError, Exception) as e:
    print(f"⚠️ [VisionEngine] Aviso: No se pudo cargar FER (Emociones). Modo degradado activo. Error: {e}")
    FER_AVAILABLE = False
# -----------------------------

class VisionEngine:
    """
    Motor de Análisis Visual.
    Extrae Insights de video buffers: OCR (Texto), Emociones (FER) y Marcas.
    """
    def __init__(self):
        self.logger = logging.getLogger("VisionEngine")
        self.emotion_detector = None
        
        if FER_AVAILABLE:
            try:
                # mtcnn=False es más rápido y requiere menos dependencias pesadas
                self.emotion_detector = FER(mtcnn=False) 
            except Exception as e:
                self.logger.warning(f"⚠️ Error inicializando FER: {e}")

    def analyze_video_buffer(self, video_bytes: bytes) -> dict:
        """
        Procesa un video desde memoria (bytes) frame a frame.
        Retorna: { 'ocr_text': str, 'dominant_emotion': str, 'logos': [] }
        """
        if not video_bytes:
            return {}

        # 1. Crear archivo temporal seguro (OpenCV necesita un path o pipe complejo)
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tfile:
            tfile.write(video_bytes)
            temp_path = tfile.name

        cap = cv2.VideoCapture(temp_path)
        
        extracted_text = set()
        emotion_counts = {}
        frame_rate = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Analizar 1 frame cada 2 segundos para eficiencia
        step = int(frame_rate * 2) 
        
        try:
            for i in range(0, total_frames, step):
                cap.set(cv2.CAP_PROP_POS_FRAMES, i)
                ret, frame = cap.read()
                if not ret: break

                # A. OCR Táctico (Leer ofertas/subtítulos)
                # Pre-procesamiento para mejorar OCR
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                text = pytesseract.image_to_string(gray, lang='eng') # + 'spa' si configurado
                
                # Limpieza básica de texto
                clean_lines = [line.strip() for line in text.split('\n') if len(line.strip()) > 4]
                extracted_text.update(clean_lines)

                # B. Micro-Expresiones (Solo si hay detector)
                if self.emotion_detector:
                    # analyze retorna lista de caras detectadas con sus emociones
                    emotions = self.emotion_detector.detect_emotions(frame)
                    if emotions:
                        # Tomar la emoción dominante de la cara principal
                        top_emotion = max(emotions[0]['emotions'], key=emotions[0]['emotions'].get)
                        emotion_counts[top_emotion] = emotion_counts.get(top_emotion, 0) + 1

                # C. Detección de Marcas (Placeholder para futura implementación YOLO)
                # self.detect_logos(frame)

        except Exception as e:
            self.logger.error(f"❌ Error procesando video frames: {e}")
        finally:
            cap.release()
            os.remove(temp_path) # Limpieza inmediata (Regla de Oro: Memoria)

        # Consolidar resultados
        final_text = " ".join(list(extracted_text))
        
        dominant_emotion = "neutral"
        if emotion_counts:
            dominant_emotion = max(emotion_counts, key=emotion_counts.get)

        return {
            "ocr_text": final_text[:1000], # Limitar tamaño
            "dominant_emotion": dominant_emotion,
            "logos_detected": []
        }