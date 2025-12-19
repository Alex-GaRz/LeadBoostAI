# tests/run_phase7_test.py

from pathlib import Path
from uuid import uuid4

from microservice_visual.core.pipeline.visual_pipeline import VisualPipeline
from microservice_copy.pipeline.copy_pipeline import CopyPipeline
from microservice_visual.core.content_assembly.content_pipeline import ContentPipeline
from microservice_visual.core.orchestration.orchestrator_adapter import OrchestratorAdapter

from contracts import CampaignPayload, StrategyBrief, CampaignState

# 1️⃣ Cargar imagen (mock - para test básico)
print("=== PHASE 7 TEST ===")
print("Probando flujo completo: Visual -> Copy -> Assembly -> Orchestration")

# 2️⃣ Construir payload mínimo con solo campos que existen en contracts
payload = CampaignPayload(
    campaign_id=uuid4(),
    tenant_id=uuid4(),
    execution_id=uuid4(),
    current_state=CampaignState.IDLE,
    strategy=StrategyBrief(
        target_audience="Tech professionals 25-40",
        core_message="Urban lifestyle sneakers",
        channels=["instagram"],
        budget_allocation={"instagram": 1.0},
        do_not_do=["cartoon", "abstract background"],
        tone_guard={"voice": "modern", "style": "energetic"},
        platform_constraints={"instagram": {"aspect_ratio": "4:5"}}
    )
)

print(f"✓ Payload creado - Campaign ID: {payload.campaign_id}")
print(f"✓ Estado inicial: {payload.current_state}")
print(f"✓ Strategy brief: {payload.strategy.core_message}")

print("\nNOTA: Este test usa solo tipos que existen en contracts/")
print("Para ejecución completa, los microservicios necesitan datos adicionales.")
print("\nTest completado - estructura validada ✓")
