from fastapi import APIRouter, HTTPException, Depends
from microservice_analyst.models.schemas import ActionProposal
from microservice_analyst.core.governance_engine import GovernanceEngine

router = APIRouter(prefix="/api/governance", tags=["governance"])

# Instancia Singleton del motor (en una app real usaríamos Dependency Injection más robusto)
engine = GovernanceEngine()

@router.post("/validate", response_model=ActionProposal)
async def validate_proposal(proposal: ActionProposal):
    """
    Endpoint principal del Bloque 6.
    Recibe una propuesta estratégica (del Bloque 5) y la valida contra reglas operativas.
    """
    try:
        validated_proposal = engine.evaluate_proposal(proposal)
        return validated_proposal
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Governance Engine Error: {str(e)}")

@router.get("/health")
async def governance_health():
    return {"status": "operational", "engine": "GovernanceEngine v1.0"}