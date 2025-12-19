"""
DiffusionClient: Adapter para servicios de generación de imágenes (Replicate/Stability/Diffusers local).
Responsabilidad: Abstraer la llamada a APIs de difusión y retornar bytes de imagen.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any
from PIL import Image
import io


class DiffusionClient(ABC):
    """
    Interfaz abstracta para clientes de difusión (SDXL, Flux, etc.).
    """

    @abstractmethod
    async def generate(self, params: dict) -> bytes:
        """
        Genera una imagen usando un modelo de difusión.
        
        Args:
            params: Diccionario con parámetros de generación:
                - prompt: str
                - negative_prompt: str
                - seed: int
                - steps: int
                - cfg_scale: float
                - width: int
                - height: int
                - controlnet_image: Optional[bytes]
                - etc.
        
        Returns:
            bytes: Imagen generada en formato PNG
        """
        pass


class MockDiffusionClient(DiffusionClient):
    """
    Cliente mock para desarrollo y testing sin llamar APIs reales.
    Genera imágenes grises simples con metadata correcta.
    """

    async def generate(self, params: dict) -> bytes:
        """
        Genera una imagen mock (gris simple) con las dimensiones especificadas.
        
        Args:
            params: Diccionario con parámetros de generación
            
        Returns:
            bytes: Imagen PNG gris simple
        """
        width = params.get("width", 1080)
        height = params.get("height", 1080)
        
        # Generar imagen gris simple
        img = Image.new('RGB', (width, height), color='#E5E7EB')
        
        # Convertir a bytes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return buffer.read()

    def get_mock_metadata(self, params: dict) -> Dict[str, Any]:
        """
        Genera metadata mock con estructura correcta para GenerationMetadata.
        
        Args:
            params: Parámetros usados en la generación
            
        Returns:
            Dict con estructura de GenerationMetadata
        """
        return {
            "model_name": "mock_sdxl",
            "model_version": "1.0",
            "seed": params.get("seed", 42),
            "scheduler": params.get("scheduler", "DPMSolverMultistep"),
            "steps": params.get("steps", 30),
            "cfg_scale": params.get("cfg_scale", 7.5),
            "denoise_strength": params.get("denoise_strength", 1.0),
            "controlnet_config": params.get("controlnet_config", {}),
        }
