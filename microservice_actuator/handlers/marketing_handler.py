import logging
import asyncio
from typing import Dict, Any

# Importamos esquemas y modelos necesarios
from microservice_actuator.models.schemas import ActionRequest, ActionResponse
from microservice_actuator.models.extended_schemas import CreativeAsset, PlatformName
# Importamos la fábrica (aunque usaremos la instancia inyectada)
from microservice_actuator.core.creative_factory import CreativeFactory

logger = logging.getLogger("MarketingHandler")

class MarketingHandler:
    def __init__(self):
        # Inicializamos una fábrica por defecto, pero Main.py nos inyectará la buena (con memoria)
        self.creative_factory = CreativeFactory() 

    async def execute(self, action: ActionRequest) -> ActionResponse:
        """
        Ejecuta la lógica de negocio para campañas de marketing.
        Delega la creatividad a CreativeFactory.
        """
        logger.info(f"🚀 [ACTUATOR] Iniciando secuencia de lanzamiento para: {action.action_id}")
        
        # 1. Extraer parámetros clave
        params = action.parameters
        platform_str = params.get("platform", "multi-channel")
        target_audience = params.get("target_audience", "General Audience")
        product_name = params.get("product_name", "Our Product")
        
        # 2. Convertir string a Enum (o mantener string si no existe en Enum)
        # Esto asegura que "instagram" pase a la fábrica correctamente
        try:
            platform_enum = PlatformName(platform_str.lower())
        except ValueError:
            # Si no es un enum válido (ej. "instagram"), pasamos el string raw
            # Nuestra CreativeFactory mejorada sabe manejar strings ahora.
            platform_enum = platform_str 

        # 3. Delegar a la Fábrica Creativa (Aquí ocurre la magia RAG)
        # Usamos 'await' porque ahora generate_asset es asíncrono
        try:
            asset: CreativeAsset = await self.creative_factory.generate_asset(
                platform=platform_enum,
                reasoning=action.reasoning,
                audience_desc=target_audience,
                campaign_id=action.action_id
            )
        except Exception as e:
            logger.error(f"❌ Error en Fábrica Creativa: {e}")
            # Fallback de emergencia
            asset = CreativeAsset(
                headline="Error Generating Content", 
                body_text="Please check logs.", 
                call_to_action="Retry"
            )

        # 4. Simulación de ERP (Enterprise Resource Planning)
        erp_status = self._notify_erp_system(action.action_id)

        # 5. Construir Respuesta Final
        return ActionResponse(
            execution_id=action.action_id, # Usamos el mismo ID para trazar
            action_id=action.action_id,
            status="EXECUTED",
            details={
                "platform": str(platform_enum),
                "generated_copy": asset.headline + "\n\n" + asset.body_text[:50] + "...",
                "full_copy": f"{asset.headline}\n\n{asset.body_text}\n\n{asset.call_to_action}",
                "image_url": asset.image_url,  # <--- ¡IMPORTANTE! Devolvemos la URL
                "erp_feedback": erp_status
            }
        )

    def _notify_erp_system(self, campaign_id: str) -> Dict[str, Any]:
        """Simulación sincrónica de una llamada a otro microservicio"""
        # Aquí iría un requests.post al servicio ERP
        logger.warning(f"⚠️ [ERP] No se pudo conectar con Enterprise Serviice (¿Está corriendo?). Simulando éxito.")
        return {"sync": "simulated", "note": "ERP offline"}