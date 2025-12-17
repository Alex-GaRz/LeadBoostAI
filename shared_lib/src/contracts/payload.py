"""
The master CampaignPayload with idempotency and control.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from .enums import CampaignState, FailureReason
from .artifacts import StrategyBrief, QualityReport


class TraceEntry(BaseModel):
    """Audit log entry for campaign execution."""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor_service: str
    action: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2025-12-17T10:30:00Z",
                "actor_service": "core_orchestrator",
                "action": "transition_to_radar_scan",
                "metadata": {"previous_state": "IDLE"}
            }
        }


class CampaignPayload(BaseModel):
    """
    Master payload for campaign orchestration.
    Includes idempotency controls and execution tracking.
    """
    # Identity
    campaign_id: UUID
    tenant_id: UUID
    
    # IDEMPOTENCY & CONTROL (CRITICAL)
    execution_id: UUID          # Unique ID for THIS execution (prevents accidental replays)
    retry_count: int = 0        # Retry counter
    max_retries: int = 3        # Hard limit
    
    # State
    current_state: CampaignState
    terminal_reason: Optional[FailureReason] = None  # Mandatory reason if state is FAILED
    terminal_details: Optional[str] = None           # Human-readable error message
    
    # Artifacts (Append-Only)
    strategy: Optional[StrategyBrief] = None
    assets: List[Dict[str, Any]] = Field(default_factory=list)  # Visual assets simplified here
    quality_audit: Optional[QualityReport] = None
    
    # Execution Log
    execution_log: List[TraceEntry] = Field(default_factory=list)
    
    def add_trace(self, actor_service: str, action: str, metadata: Optional[Dict[str, Any]] = None):
        """Add a trace entry to the execution log."""
        entry = TraceEntry(
            actor_service=actor_service,
            action=action,
            metadata=metadata or {}
        )
        self.execution_log.append(entry)
    
    def is_terminal(self) -> bool:
        """Check if the campaign is in a terminal state."""
        return self.current_state in [CampaignState.FAILED, CampaignState.LEARN]
    
    def can_retry(self) -> bool:
        """Check if the campaign can be retried."""
        return self.retry_count < self.max_retries
    
    def mark_failed(self, reason: FailureReason, details: str):
        """Mark the campaign as failed with a reason."""
        self.current_state = CampaignState.FAILED
        self.terminal_reason = reason
        self.terminal_details = details
        self.add_trace("system", "mark_failed", {"reason": reason.value, "details": details})
    
    class Config:
        json_schema_extra = {
            "example": {
                "campaign_id": "550e8400-e29b-41d4-a716-446655440000",
                "tenant_id": "660e8400-e29b-41d4-a716-446655440000",
                "execution_id": "770e8400-e29b-41d4-a716-446655440000",
                "retry_count": 0,
                "max_retries": 3,
                "current_state": "IDLE",
                "terminal_reason": None,
                "terminal_details": None,
                "strategy": None,
                "assets": [],
                "quality_audit": None,
                "execution_log": []
            }
        }
