import logging
import uuid
from core.dispatcher import ActionDispatcher
from models.schemas import ActionProposal, ActionType

# Configuración global de logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def run_actuator_test():
    print("\n=== ⚡ LEADBOOST AI - BLOCK 7: ACTUATOR ENGINE ⚡ ===\n")
    
    # 1. Instanciar el Dispatcher
    dispatcher = ActionDispatcher()
    
    # 2. Simular INPUT del Bloque 6 (Governance Approved Proposal)
    # Escenario: El Bloque 5 detectó una oportunidad y el Bloque 6 la aprobó.
    mock_proposal = ActionProposal(
        proposal_id=str(uuid.uuid4()),
        action_type=ActionType.MARKETING_CAMPAIGN,
        priority=1,
        reasoning="Se detectó un pico de ansiedad en ejecutivos tecnológicos sobre herramientas de IA.",
        governance_approval_id="GOV-AUTH-2025-X99",
        parameters={
            "target_segment": "tech_executives",
            "platform": "meta",
            "budget": 500.00,
            "product_name": "AI-Guardian v1"
        }
    )
    
    print(f"📥 RECIBIDO: Proposal {mock_proposal.proposal_id} [{mock_proposal.action_type}]")
    
    # 3. Ejecutar (Dispatch)
    result = dispatcher.dispatch(mock_proposal)
    
    # 4. Mostrar Resultado (OUTPUT para Bloque 8)
    print("\n=== 🏁 EXECUTION RESULT 🏁 ===")
    print(f"Status: {result.status.value}")
    print(f"External ID: {result.platform_response_id}")
    print(f"Details: {result.execution_details}")
    
    if result.status == "EXECUTED":
        print("\n✅ SUCCESS: Acción ejecutada y lista para monitoreo en Bloque 8.")
    else:
        print(f"\n❌ FAILURE: {result.error_message}")

if __name__ == "__main__":
    run_actuator_test()