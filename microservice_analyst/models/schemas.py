from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

# --- ENUMS (Vocabulario Común) ---
class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class CriticalAlert(BaseModel):
    id: str
    type: str
    severity: Severity
    message: str
    timestamp: str

class ActionType(str, Enum):
    # Acciones Standard
    CREATE_CAMPAIGN = "CREATE_CAMPAIGN"
    PAUSE_CAMPAIGN = "PAUSE_CAMPAIGN"
    INCREASE_BUDGET = "INCREASE_BUDGET"
    DECREASE_BUDGET = "DECREASE_BUDGET"
    NOTIFY_HUMAN = "NOTIFY_HUMAN"
    DO_NOTHING = "DO_NOTHING"
    # Acciones Legacy (Compatibilidad)
    MARKETING_CAMPAIGN = "MARKETING_CAMPAIGN"
    PRICING_ADJUSTMENT = "PRICING_ADJUSTMENT"

class UrgencyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class GovernanceStatus(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    HITL_REQUIRED = "HITL_REQUIRED"

# --- MODELOS DE SEÑALES (INPUT) ---

class MarketSignal(BaseModel):
    """Modelo principal de señal de mercado"""
    source: str
    content: str
    sentiment_score: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}
    # Campos opcionales para flexibilidad
    id: Optional[str] = None

# ALIAS DE COMPATIBILIDAD (CRÍTICO)
# Esto arregla el error "SignalInput not defined" en main.py
SignalInput = MarketSignal 

# --- MODELOS DE ANÁLISIS (CORE BLOQUE 4) ---

class AnomalyResult(BaseModel):
    """Resultado del Z-Score Engine. ESTO FALTABA."""
    is_anomaly: bool
    severity: Severity
    score: float
    details: str = ""
    value: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AnalysisRequest(BaseModel):
    signal: MarketSignal
    context_data: Dict[str, Any] = {} 

# --- MODELOS DE ESTRATEGIA (OUTPUT BLOQUE 5/6) ---

class DebateEntry(BaseModel):
    agent_role: str 
    content: str     
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ActionProposal(BaseModel):
    """Propuesta final de acción"""
    action_type: ActionType
    reasoning: str = Field(..., description="Justificación estratégica")
    parameters: Dict[str, Any] = Field(default={})
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    
    # Trazabilidad y Gobernanza
    proposal_id: Optional[str] = None
    governance_status: Optional[GovernanceStatus] = None
    block_reason: Optional[str] = None
    governance_metadata: Dict[str, Any] = {}
    debate_transcript: List[DebateEntry] = []
    
    class Config:
        from_attributes = True