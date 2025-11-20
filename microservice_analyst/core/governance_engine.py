from typing import List, Tuple, Optional
from .enterprise_interface import IEnterpriseConnector, MockEnterpriseConnector
from models.schemas import ActionProposal, GovernanceStatus

class GovernanceRule:
    """Clase base para reglas de validación."""
    def validate(self, proposal: ActionProposal, connector: IEnterpriseConnector) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Retorna: (Passed?, GovernanceStatus, Reason)
        """
        raise NotImplementedError

# --- REGLAS CONCRETAS ---

class InventoryRule(GovernanceRule):
    def validate(self, proposal: ActionProposal, connector: IEnterpriseConnector):
        # Solo aplica si la acción implica venta o promoción de producto
        sku = proposal.parameters.get("target_product_sku")
        if not sku:
            return True, None, None

        data = connector.get_product_data(sku)
        stock = data.get("stock_quantity", 0)
        
        # Inyectamos metadata operativa para trazabilidad
        proposal.governance_metadata["inventory_check"] = {"stock": stock, "sku": sku}

        if stock < 10:
            return False, GovernanceStatus.REJECTED, f"Critical Low Stock ({stock} units) for SKU {sku}"
        
        return True, None, None

class MarginRule(GovernanceRule):
    def validate(self, proposal: ActionProposal, connector: IEnterpriseConnector):
        sku = proposal.parameters.get("target_product_sku")
        if not sku:
            return True, None, None

        data = connector.get_product_data(sku)
        margin = data.get("margin_percent", 0.0)
        
        proposal.governance_metadata["financial_check"] = {"margin": margin}

        if margin < 15.0:
            return False, GovernanceStatus.HITL_REQUIRED, f"Low Margin ({margin}%) requires Manager Approval"
        
        return True, None, None

class BudgetRule(GovernanceRule):
    def validate(self, proposal: ActionProposal, connector: IEnterpriseConnector):
        cost = proposal.parameters.get("estimated_cost", 0.0)
        if cost <= 0:
            return True, None, None

        has_budget = connector.check_budget_availability("marketing", cost)
        
        if not has_budget:
            return False, GovernanceStatus.HITL_REQUIRED, f"Cost (${cost}) exceeds auto-approval limit"
        
        return True, None, None

# --- MOTOR PRINCIPAL ---

class GovernanceEngine:
    def __init__(self):
        self.connector = MockEnterpriseConnector()
        self.rules: List[GovernanceRule] = [
            InventoryRule(),
            MarginRule(),
            BudgetRule()
        ]

    def evaluate_proposal(self, proposal: ActionProposal) -> ActionProposal:
        """
        Ejecuta la cadena de reglas. La primera que falle determina el estado.
        Si ninguna falla, se APRUEBA.
        """
        # Reset state
        proposal.governance_metadata = {}
        
        for rule in self.rules:
            passed, status, reason = rule.validate(proposal, self.connector)
            
            if not passed:
                proposal.governance_status = status
                proposal.block_reason = reason
                return proposal

        # Si pasa todas las reglas
        proposal.governance_status = GovernanceStatus.APPROVED
        proposal.block_reason = "All governance checks passed"
        return proposal