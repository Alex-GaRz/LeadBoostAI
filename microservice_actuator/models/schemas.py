from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class ActionType(str, Enum):
    MARKETING_CAMPAIGN = "MARKETING_CAMPAIGN"
    PRICING_ADJUSTMENT = "PRICING_ADJUSTMENT" # Futuro
    INVENTORY_ORDER = "INVENTORY_ORDER"       # Futuro

class ActionStatus(str, Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"

# Input: Lo que viene del Bloque 6 (Governance)
class ActionProposal(BaseModel):
    proposal_id: str
    action_type: ActionType
    priority: int
    reasoning: str  # El "por qué" del Bloque 5
    parameters: Dict[str, Any]  # Datos específicos (segmento, presupuesto, etc.)
    governance_approval_id: str # Token de aprobación del Bloque 6
    created_at: datetime = Field(default_factory=datetime.now)

# Output: Lo que generamos para el Bloque 8 (Performance)
class ExecutionResult(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    proposal_id: str
    status: ActionStatus
    platform_response_id: Optional[str] = None # ID externo (ej. Meta Ad ID)
    execution_details: Dict[str, Any] = {}
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)