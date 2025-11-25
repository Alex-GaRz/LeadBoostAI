from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

# --- ENUMS (ACTUALIZADOS PARA FASE 3) ---
class ActionType(str, Enum):
    # Acciones de Marketing
    CREATE_CAMPAIGN = "CREATE_CAMPAIGN"
    PAUSE_CAMPAIGN = "PAUSE_CAMPAIGN"
    INCREASE_BUDGET = "INCREASE_BUDGET"
    DECREASE_BUDGET = "DECREASE_BUDGET"
    
    # Acciones Operativas
    PRICING_ADJUSTMENT = "PRICING_ADJUSTMENT" 
    INVENTORY_ORDER = "INVENTORY_ORDER"
    
    # Acciones de Control
    NOTIFY_HUMAN = "NOTIFY_HUMAN"
    DO_NOTHING = "DO_NOTHING"

class UrgencyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ActionStatus(str, Enum):
    PENDING = "PENDING"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"

class DebateEntry(BaseModel):
    """Registro de una intervención en la Mesa Redonda (CMO/CFO/CEO)"""
    agent_role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)

class MarketSignal(BaseModel):
    """Representación estandarizada de una señal de mercado (Input del Scout)"""
    source: str
    content: str
    sentiment_score: float
    timestamp: datetime = Field(default_factory=datetime.now)

# --- 1. CONTRATO DE ENTRADA (Desde B6 - Analyst) ---
class ActionProposal(BaseModel):
    """
    Propuesta estratégica final generada por el StrategyEngine.
    """
    proposal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: ActionType
    reasoning: str
    parameters: Dict[str, Any]
    confidence_score: float = 0.5
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    debate_transcript: List[DebateEntry] = []
    created_at: datetime = Field(default_factory=datetime.now)

# --- 2. MODELO DE ACCIÓN INTERNA (Usado por Actuador/Dispatcher) ---
class ActionRequest(BaseModel):
    """
    Solicitud de ejecución para el Actuador.
    Debe contener 'reasoning' para que el Copywriter IA funcione.
    """
    action_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: ActionType
    reasoning: str = "Ejecución manual sin contexto estratégico" # Default seguro
    parameters: Dict[str, Any]
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    timestamp: datetime = Field(default_factory=datetime.now)

# --- 3. CONTRATO DE SALIDA (Hacia ERP/Frontend) ---
class ExecutionResult(BaseModel):
    """Resultado final devuelto por el Actuador."""
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_id: Optional[str] = None
    status: ActionStatus
    details: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)