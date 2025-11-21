import logging
from typing import Dict, Any
from interfaces.handler_interface import IActionHandler, ActionType
from handlers.marketing_handler import MarketingHandler
from .execution_logger import ExecutionLogger

logger = logging.getLogger("ActionDispatcher")

class ActionDispatcher:
    def __init__(self):
        self._handlers: Dict[ActionType, IActionHandler] = {}
        self._register_default_handlers()
        # Instanciamos el logger de memoria
        self.execution_logger = ExecutionLogger()

    def _register_default_handlers(self):
        self.register_handler(ActionType.MARKETING_CAMPAIGN, MarketingHandler())

    def register_handler(self, action_type: ActionType, handler: IActionHandler):
        self._handlers[action_type] = handler

    def dispatch(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recibe una orden, busca el handler adecuado, ejecuta y REPORTA.
        """
        action_type_str = action.get("type")
        payload = action.get("payload", {})
        
        logger.info(f"🚀 Dispatching action: {action_type_str}")

        try:
            # 1. Mapear string a Enum
            action_enum = ActionType(action_type_str)
        except ValueError:
            err = f"Unknown action type: {action_type_str}"
            logger.error(err)
            return {"status": "error", "message": err}

        handler = self._handlers.get(action_enum)
        if not handler:
            return {"status": "error", "message": "No handler registered"}

        # 2. Ejecutar Acción Real
        result = handler.execute(payload)
        
        # 3. Reportar a Memoria (B10)
        success = result.get("status") == "success"
        
        try:
            self.execution_logger.log_execution_attempt(
                action_type=action_type_str,
                execution_details={
                    "handler": str(type(handler).__name__),
                    "platform_response": result,
                    "payload_hash": str(hash(str(payload)))
                },
                success=success
            )
        except Exception as e:
            logger.error(f"⚠️ Error reportando a memoria: {e}")

        return result