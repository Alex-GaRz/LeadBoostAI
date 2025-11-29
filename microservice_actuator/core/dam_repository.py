import os
import json
import logging
import requests
from datetime import datetime

logger = logging.getLogger("DAMRepository")

class DAMRepository:
    def __init__(self, base_path="assets/generated"):
        self.base_path = base_path
        os.makedirs(self.base_path, exist_ok=True)

    def save_asset(self, campaign_id: str, image_bytes: bytes, metadata: dict) -> str:
        """
        Guarda la imagen y sus metadatos. Retorna la ruta local del archivo.
        """
        # Crear estructura de carpetas por campaña
        campaign_dir = os.path.join(self.base_path, campaign_id)
        os.makedirs(campaign_dir, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        variant_id = f"var_{timestamp}"
        
        # 1. Guardar Imagen
        image_filename = f"{variant_id}.png"
        image_path = os.path.join(campaign_dir, image_filename)
        
        try:
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            logger.info(f"💾 Imagen guardada en: {image_path}")
        except IOError as e:
            logger.error(f"Error escribiendo imagen en disco: {e}")
            return ""

        # 2. Guardar Metadatos (JSON Sidecar)
        json_filename = f"{variant_id}.json"
        json_path = os.path.join(campaign_dir, json_filename)
        
        meta_payload = {
            "campaign_id": campaign_id,
            "timestamp": timestamp,
            "technical_meta": metadata
        }
        
        try:
            with open(json_path, "w", encoding='utf-8') as f:
                json.dump(meta_payload, f, indent=4, ensure_ascii=False)
        except IOError as e:
            logger.error(f"Error escribiendo metadatos: {e}")

        return image_path