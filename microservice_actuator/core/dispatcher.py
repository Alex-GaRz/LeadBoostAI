import logging
import asyncio
import requests
from typing import Dict
from microservice_actuator.models.schemas import ActionType, ActionRequest, ExecutionResult, ActionStatus
from microservice_actuator.models.extended_schemas import PlatformName
from microservice_actuator.interfaces.handler_interface import IActionHandler

# Nuevos componentes Core
from microservice_actuator.core.audience_architect import AudienceArchitect
from microservice_actuator.core.creative_factory import CreativeFactory
from microservice_actuator.handlers.platforms.meta_handler import MetaHandler
from microservice_actuator.handlers.platforms.google_handler import GoogleHandler
from microservice_actuator.handlers.platforms.linkedin_handler import LinkedInHandler

# URL Mock del ERP (definida en config)
ERP_TRANSACTION_URL = "http://localhost:8011/enterprise/transaction"

logger = logging.getLogger("ActionDispatcher")

class OrchestratorHandler(IActionHandler):
    """
    Handler Maestro que coordina la creación de assets y el envío a la plataforma correcta.
    """
    def __init__(self):
        self.architect = AudienceArchitect()
        self.factory = CreativeFactory()
        self.platforms = {
            PlatformName.META: MetaHandler(),
            PlatformName.GOOGLE: GoogleHandler(),
            PlatformName.LINKEDIN: LinkedInHandler()
        }

    async def execute(self, action: ActionRequest) -> ExecutionResult:
        try:
            # 1. Determinar Plataforma
            platform_str = action.parameters.get("platform", "meta").lower()
            platform_enum = PlatformName(platform_str)
            
            if platform_enum not in self.platforms:
                raise ValueError(f"Plataforma no soportada: {platform_str}")

            handler = self.platforms[platform_enum]
            logger.info(f"🚀 Iniciando secuencia de ejecución para: {platform_enum.value.upper()}")

            # 2. Arquitectura de Audiencia
            audience = self.architect.construct_audience(
                reasoning=action.reasoning,
                target_persona=action.parameters.get("target_audience", "General")
            )

            # 3. Generación Creativa
            creative = self.factory.generate_asset(
                platform=platform_enum,
                reasoning=action.reasoning,
                audience_desc=str(audience.interests + audience.positive_keywords)
            )

            # 4. Construcción del Payload Nativo (Para la plataforma publicitaria)
            platform_payload = await handler.build_payload(action, audience, creative)

            # 5. Envío al ERP (CORREGIDO: Adaptado al Schema TransactionRequest)
            erp_status = "pending"
            # Si la IA no mandó SKU, usamos PROD-001 para que la demo funcione
            target_sku = action.parameters.get("sku") or "PROD-001"
            erp_payload = {
                "sku": target_sku,
                "qty_sold": 5,          # Simulación: Cada campaña genera 5 ventas
                "sale_price": 1200.0,   # Precio simulado
                "campaign_id": action.action_id
            }

            try:
                # Enviamos la transacción de venta simulada
                response = requests.post(ERP_TRANSACTION_URL, json=erp_payload, timeout=3)
                
                if response.status_code == 200:
                    data = response.json()
                    # Guardamos el stock restante que nos devuelve el ERP
                    erp_status = f"synced_stock_left_{data.get('remaining_stock', '?')}"
                    logger.info(f"✅ [ERP] Transacción registrada. Stock restante: {data.get('remaining_stock')}")
                else:
                    logger.warning(f"⚠️ [ERP] Rechazó transacción (Code {response.status_code}): {response.text}")
                    erp_status = f"error_{response.status_code}"
            except Exception as e:
                logger.warning(f"⚠️ [ERP] No disponible. Operando en modo aislado. ({str(e)})")
                erp_status = "simulated_offline"

            # 6. Reporte Final
            return ExecutionResult(
                action_id=action.action_id,
                status=ActionStatus.EXECUTED,
                details={
                    "platform": platform_str,
                    "erp_sync_status": erp_status,
                    "creative_preview": creative.dict(),
                    "platform_payload": platform_payload # Guardamos lo que se hubiera mandado a Meta/Google
                }
            )

        except Exception as e:
            logger.error(f"❌ Error CRÍTICO en orquestación: {e}")
            return ExecutionResult(
                action_id=action.action_id,
                status=ActionStatus.FAILED,
                error_message=str(e)
            )

class ActionDispatcher:
    def __init__(self):
        self._handlers: Dict[ActionType, IActionHandler] = {}
        self._register_handlers()

    def _register_handlers(self):
        # Ahora el Orchestrator maneja todas las campañas de marketing
        # independientemente de la plataforma, decidiendo internamente.
        self.register_handler(ActionType.CREATE_CAMPAIGN, OrchestratorHandler())
        # Aquí se añadirían handlers para otros ActionTypes (e.g., INVENTORY_ORDER)

    def register_handler(self, action_type: ActionType, handler: IActionHandler):
        self._handlers[action_type] = handler

    async def dispatch(self, action: ActionRequest) -> ExecutionResult:
        logger.info(f"⚡ Dispatching Action: {action.action_type}")
        handler = self._handlers.get(action.action_type)
        
        if not handler:
            return ExecutionResult(
                action_id=action.action_id,
                status=ActionStatus.FAILED,
                error_message=f"No handler defined for {action.action_type}"
            )
        
        return await handler.execute(action)