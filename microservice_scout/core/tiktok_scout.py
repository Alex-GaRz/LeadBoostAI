import asyncio
import logging
import hashlib
from datetime import datetime, timezone
from core.network.ghost_client import GhostClient
from core.vision_engine import VisionEngine

class TikTokScout:
    """
    Agente de reconocimiento visual para Short-Form Video (TikTok/Reels).
    Utiliza fuentes RSS proxy (ej. ProxiTok) para evitar bloqueos directos de API.
    """

    def __init__(self):
        self.ghost = GhostClient()
        self.vision = VisionEngine()
        self.logger = logging.getLogger("TikTokScout")
        # URLs de ProxiTok o RSS Hubs públicos para tags
        self.BASE_RSS = "[https://proxitok.pabloferreiro.es/tag/](https://proxitok.pabloferreiro.es/tag/){tag}/rss" 

    def _generate_id(self, url: str) -> str:
        raw = f"tiktok-{url}-{datetime.now().strftime('%Y-%m')}"
        return hashlib.md5(raw.encode()).hexdigest()

    async def scan_tag_feed(self, tags: list) -> list:
        """
        Escanea feeds de hashtags, descarga videos muestra y extrae inteligencia.
        """
        findings = []
        
        for tag in tags:
            tag_clean = tag.replace(" ", "")
            target_url = self.BASE_RSS.format(tag=tag_clean)
            
            print(f"🎥 [TikTokScout] Escaneando Tag: #{tag_clean}...")
            
            try:
                # 1. Obtener Feed RSS (Simulado parsing XML simple por brevedad)
                # En producción, usar feedparser aquí también.
                # Asumimos que obtenemos una lista de URLs de video del XML
                # Esta parte requiere feedparser, lo simplificamos a lógica abstracta:
                
                # Mockup de lógica de extracción de feed para demostración de flujo visual
                # En real: response = await self.ghost.get(target_url) -> parse xml -> get mp4 links
                
                # Simulamos 1 hallazgo para probar el pipeline visual
                simulated_video_url = "https://www.w3schools.com/html/mov_bbb.mp4"
                # Debugging visual: Imprimir qué URL estamos intentando bajar
                print(f"   ⬇️ Descargando sample video de: [{simulated_video_url}]")
                # Si la URL está vacía, saltamos para evitar el error
                if not simulated_video_url or "http" not in simulated_video_url:
                    print("   ⚠️ URL Inválida, saltando...")
                    continue
                video_buffer = await self.ghost.download_content(simulated_video_url)
                if not video_buffer:
                    print("   ⚠️ Buffer vacío, descarga fallida.")
                    continue

                # 3. Procesamiento Visual (Ojos de Depredador)
                print(f"   👁️ Analizando frames (OCR + Emociones)...")
                vision_data = self.vision.analyze_video_buffer(video_buffer)
                
                # 4. Construir Señal
                signal = {
                    "id": self._generate_id(simulated_video_url),
                    "source": "tiktok_shorts",
                    "source_id": f"tk-{tag_clean}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "content": (
                        f"[VISUAL INTEL] Tag: #{tag_clean}. "
                        f"Emotion: {vision_data.get('dominant_emotion', 'N/A').upper()}. "
                        f"OCR Extract: {vision_data.get('ocr_text', '')[:200]}..."
                    ),
                    "url": target_url,
                    "type": "visual_opportunity",
                    "scout_metadata": {
                        "tag": tag_clean,
                        "emotion": vision_data.get('dominant_emotion'),
                        "ocr_density": len(vision_data.get('ocr_text', ''))
                    },
                    "status": "pending_processing",
                    "analysis": None
                }
                
                findings.append(signal)
                print(f"   ✅ Hallazgo visual procesado: {vision_data.get('dominant_emotion')}")

            except Exception as e:
                self.logger.error(f"❌ Error en TikTokScout (#{tag}): {e}")
            
            await asyncio.sleep(5) # Pausa táctica

        return findings