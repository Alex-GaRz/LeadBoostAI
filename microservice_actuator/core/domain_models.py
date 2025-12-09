"""Domain Models - Pure business entities (Pydantic Schemas)."""

from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class PlatformType(str, Enum):
    """Supported external platforms."""
    MOCK = "MOCK"
    TWITTER = "TWITTER"
    META = "META"
    LINKEDIN = "LINKEDIN"

class ActionStatus(str, Enum):
    """Execution status lifecycle."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    RATE_LIMITED = "RATE_LIMITED"

class TargetAudience(BaseModel):
    """Targeting criteria for paid campaigns."""
    age_range: Optional[List[int]] = None
    interests: Optional[List[str]] = None
    locations: Optional[List[str]] = None

class ActionPayload(BaseModel):
    """Input payload for action execution."""
    action_id: str = Field(..., description="UUID from governance ledger")
    platform: PlatformType
    content_text: str = Field(..., max_length=5000)
    media_urls: Optional[List[str]] = []
    target_audience: Optional[TargetAudience] = None
    budget_bid: Optional[float] = None
    schedule_time: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ExecutionResult(BaseModel):
    """Output result of action execution."""
    action_id: str
    status: ActionStatus
    platform_ref_id: Optional[str] = None  # External platform's resource ID
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    executed_at: datetime = Field(default_factory=datetime.utcnow)
