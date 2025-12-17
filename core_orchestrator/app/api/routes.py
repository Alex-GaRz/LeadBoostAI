"""
API routes for the orchestrator.
"""

from fastapi import APIRouter, HTTPException, status
from uuid import UUID, uuid4
from typing import Dict, Any

from contracts import CampaignPayload, CampaignState
from domain.fsm import OrchestratorFSM
from infrastructure.service_client import ServiceClient
from infrastructure.idempotency import IdempotencyStore
from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["orchestrator"])

# Initialize components
service_client = ServiceClient(
    radar_url=settings.service_radar_url,
    analyst_url=settings.service_analyst_url,
    visual_url=settings.service_visual_url,
    optimizer_url=settings.service_optimizer_url,
    timeout=settings.service_timeout,
)

idempotency_store = IdempotencyStore(
    redis_url=settings.redis_url,
    use_in_memory=settings.use_in_memory_store,
)


@router.post("/campaigns", status_code=status.HTTP_201_CREATED)
async def create_campaign(
    tenant_id: UUID,
    metadata: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Create a new campaign and initialize the orchestration workflow.
    """
    # Create initial payload
    payload = CampaignPayload(
        campaign_id=uuid4(),
        tenant_id=tenant_id,
        execution_id=uuid4(),
        current_state=CampaignState.IDLE,
        max_retries=settings.default_max_retries,
    )
    
    payload.add_trace("core_orchestrator", "campaign_created", metadata or {})
    
    # Initialize FSM
    fsm = OrchestratorFSM(
        payload=payload,
        service_client=service_client,
        idempotency_store=idempotency_store,
    )
    
    return {
        "campaign_id": str(payload.campaign_id),
        "execution_id": str(payload.execution_id),
        "state": payload.current_state.value,
        "message": "Campaign created successfully"
    }


@router.post("/campaigns/{campaign_id}/start")
async def start_campaign(campaign_id: UUID) -> Dict[str, Any]:
    """
    Start the campaign workflow (transition from IDLE to RADAR_SCAN).
    """
    # TODO: Load existing payload from storage
    # For now, return a placeholder
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Campaign storage and state retrieval not yet implemented"
    )


@router.get("/campaigns/{campaign_id}")
async def get_campaign_status(campaign_id: UUID) -> Dict[str, Any]:
    """
    Get the current status of a campaign.
    """
    # TODO: Load payload from storage
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Campaign storage and state retrieval not yet implemented"
    )


@router.post("/campaigns/{campaign_id}/retry")
async def retry_campaign(campaign_id: UUID) -> Dict[str, Any]:
    """
    Retry a failed campaign if retries are available.
    """
    # TODO: Load payload, check retry count, re-run FSM
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Retry logic not yet implemented"
    )
