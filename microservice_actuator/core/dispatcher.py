import logging
from typing import Dict
from models.schemas import ActionType, ActionRequest, ExecutionResult, ActionStatus
from interfaces.handler_interface import IActionHandler
from handlers.marketing_handler import MarketingHandler
from .execution_logger import ExecutionLogger # Cliente B10

logger = logging.getLogger("ActionDispatcher")

class ActionDispatcher:
    def __init__(self):
        self._handlers: Dict[ActionType, IActionHandler] = {}
        self._register_default_handlers() # La llamada al método
        self.execution_logger = ExecutionLogger() # Inicialización B10

    # LOS MÉTODOS ESTÁN CORRECTAMENTE DENTRO DE LA CLASE
    def _register_default_handlers(self):
        """Mapea los tipos de acción a sus ejecutores."""
        self.register_handler(ActionType.MARKETING_CAMPAIGN, MarketingHandler())

    def register_handler(self, action_type: ActionType, handler: IActionHandler):
        self._handlers[action_type] = handler

    async def dispatch(self, action: ActionRequest) -> ExecutionResult:
        """Busca handler, ejecuta y registra la trazabilidad."""
        logger.info(f"⚡ Dispatching: {action.action_type.value}")

        handler = self._handlers.get(action.action_type)
        
        if not handler:
            return ExecutionResult(
                action_id=action.action_id,
                status=ActionStatus.FAILED,
                error_message=f"No handler registered for {action.action_type.value}"
            )

        # Ejecución asíncrona
        try:
            result = await handler.execute(action) # Await es necesario aquí
            
            # --- TRAZABILIDAD CRÍTICA (Bloque 10) ---
            self.execution_logger.log_execution_result(result)
            
            return result
            
        except Exception as e:
            logger.error(f"Execution crash: {e}")
            return ExecutionResult(
                action_id=action.action_id,
                status=ActionStatus.FAILED,
                error_message=str(e)
            )