from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

# --- ENUMS ---
class ActionType(str, Enum):
    MARKETING_CAMPAIGN = "MARKETING_CAMPAIGN"
    PRICING_ADJUSTMENT = "PRICING_ADJUSTMENT" 
    INVENTORY_ORDER = "INVENTORY_ORDER"       

class ActionStatus(str, Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"

# --- 1. CONTRATO DE ENTRADA (Desde B6) ---
class ActionProposal(BaseModel):
    """
    Modelo de la propuesta de acción aprobada que B6 envía a B7.
    Contiene la decisión original (B5) + el sello de Gobernanza (B6).
    """
    proposal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: ActionType
    priority: str
    reasoning: str  
    parameters: Dict[str, Any]  
    governance_approval_id: str = "VALIDATED_BY_B6" # Token ficticio de aprobación
    created_at: datetime = Field(default_factory=datetime.now)

# --- 2. MODELO DE ACCIÓN INTERNA (Usado por Dispatcher) ---
class ActionRequest(BaseModel):
    """Estructura interna normalizada que el Dispatcher maneja."""
    action_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: ActionType
    parameters: Dict[str, Any]
    priority: str = "HIGH"
    timestamp: datetime = Field(default_factory=datetime.now)

# --- 3. CONTRATO DE SALIDA (Hacia B8 y B10) ---
class ExecutionResult(BaseModel):
    """Resultado final devuelto por el Actuador, incluye feedback de B11 (ERP)."""
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_id: Optional[str] = None
    status: ActionStatus
    platform_response_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)