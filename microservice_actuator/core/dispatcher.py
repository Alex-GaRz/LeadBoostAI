from typing import Dict, Type
from interfaces.handler_interface import IActionHandler
from handlers.marketing_handler import MarketingHandler
from models.schemas import ActionProposal, ExecutionResult, ActionType, ActionStatus

class ActionDispatcher:
    """
    Orquestador principal. Implementa el patrón Strategy.
    Recibe un Proposal, mira su tipo, y delega al Handler correspondiente.
    """
    
    def __init__(self):
        # Registro de Handlers (Dependency Injection container simplificado)
        self._handlers: Dict[ActionType, IActionHandler] = {
            ActionType.MARKETING_CAMPAIGN: MarketingHandler()
            # Aquí se agregarían ActionType.PRICING_ADJUSTMENT: PricingHandler(), etc.
        }

    def dispatch(self, proposal: ActionProposal) -> ExecutionResult:
        handler = self._handlers.get(proposal.action_type)
        
        if not handler:
            return ExecutionResult(
                proposal_id=proposal.proposal_id,
                status=ActionStatus.FAILED,
                error_message=f"No handler registered for action type: {proposal.action_type}"
            )
        
        try:
            # Delegación pura
            return handler.execute(proposal)
        except Exception as e:
            # Catch-all para seguridad del orquestador
            return ExecutionResult(
                proposal_id=proposal.proposal_id,
                status=ActionStatus.FAILED,
                error_message=f"Dispatcher critical error: {str(e)}"
            )