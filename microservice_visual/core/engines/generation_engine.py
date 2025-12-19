"""
Responsabilidad: Configurar y solicitar la generación de la escena base.
Dependencias: adapters.diffusion_client, shared_lib.contracts
"""
from contracts.artifacts import LayoutPlan
from .controlnet_adapter import ControlNetAdapter


class GenerationEngine:
    """
    Coordinador de generación con SDXL/Flux + ControlNet.
    Responsabilidad: Orquestar la llamada a la IA generativa inyectando los ControlNet maps.
    """

    def __init__(self, client: 'DiffusionClient', cn_adapter: ControlNetAdapter):
        """
        Args:
            client: Cliente para llamar API de difusión (Replicate/Stability/Local)
            cn_adapter: Adaptador para preparar mapas de control
        """
        self.client = client
        self.cn_adapter = cn_adapter

    async def generate_base_scene(
        self, 
        prompt: str, 
        layout: LayoutPlan, 
        product_image: bytes
    ) -> bytes:
        """
        Orquesta la llamada a la IA generativa inyectando los ControlNet maps.
        Retorna la imagen cruda (background + producto fusionado).
        
        Args:
            prompt: Prompt construido desde StrategyBrief + BrandGenome
            layout: LayoutPlan con coordenadas de producto y texto
            product_image: Bytes de la imagen del producto
            
        Returns:
            bytes: Imagen generada
            
        TODO: Implementar:
            - Preparar ControlNet maps (canny, depth) usando cn_adapter
            - Construir negative_prompt (texto, watermark, logo, low quality, blurry)
            - Llamar client.generate con parámetros completos
            - Generar GenerationMetadata con evidencia forense:
                * model_name, model_version
                * seed, scheduler, steps, cfg_scale, denoise_strength
                * controlnet_config
                * input_image_hash (SHA256)
                * layout_id
                * prompt_hash (SHA256)
            - Validar que la imagen generada no esté vacía/corrupta
            - Retornar bytes + metadata
        """
        pass
