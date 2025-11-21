import logging
import asyncio 
import requests
from interfaces.handler_interface import IActionHandler
from models.schemas import ActionRequest, ExecutionResult, ActionStatus
from datetime import datetime

logger = logging.getLogger("MarketingHandler")
ERP_TRANSACTION_URL = "http://localhost:8011/enterprise/transaction"

class MarketingHandler(IActionHandler):
    
    async def execute(self, action: ActionRequest) -> ExecutionResult:
        sku = action.parameters.get("sku", "UNKNOWN-SKU")
        platform = action.parameters.get("platform", "generic")
        
        logger.info(f"🚀 [ACTUATOR] Ejecutando campaña para: {sku}")
        
        # Simulación de latencia de red ASÍNCRONA
        await asyncio.sleep(0.5) 
        
        erp_details = {"sync": "skipped"}
        stock_remaining = -1
        
        # --- 1. CONEXIÓN B11 (Registro de Venta) ---
        try:
            tx_payload = {
                "sku": sku,
                "qty_sold": 5,             
                "sale_price": 1200.0,
                "campaign_id": action.action_id
            }
            # requests es síncrono, pero se usa dentro de un handler async.
            response = requests.post(ERP_TRANSACTION_URL, json=tx_payload, timeout=2)
            
            if response.status_code == 200:
                data = response.json()
                stock_remaining = data.get("remaining_stock")
                erp_details = {"sync": "success", "remaining_stock": stock_remaining}
                logger.info(f"✅ [ERP] Venta registrada. Stock: {stock_remaining}")
            else:
                erp_details = {"sync": "failed", "reason": response.text}
                logger.warning(f"⚠️ [ERP] Rechazo: {response.text}")

        except Exception as e:
            logger.error(f"❌ [ERP] Error de conexión: {e}")
            erp_details = {"sync": "error", "error": str(e)}

        # --- 2. DEVOLVER RESULTADO ---
        return ExecutionResult(
            action_id=action.action_id,
            status=ActionStatus.EXECUTED,
            details={
                "platform": platform,
                "cost": action.parameters.get("budget", 0),
                "erp_feedback": erp_details
            },
            timestamp=datetime.now() # Aseguramos timestamp actual
        )