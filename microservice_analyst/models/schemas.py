from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

# ==========================================
# 1. ENUMS (Vocabulario Común)
# ==========================================

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ActionType(str, Enum):
    # Acciones Standard
    CREATE_CAMPAIGN = "CREATE_CAMPAIGN"
    PAUSE_CAMPAIGN = "PAUSE_CAMPAIGN"
    INCREASE_BUDGET = "INCREASE_BUDGET"
    DECREASE_BUDGET = "DECREASE_BUDGET"
    NOTIFY_HUMAN = "NOTIFY_HUMAN"
    DO_NOTHING = "DO_NOTHING"
    # Acciones Legacy
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

# ==========================================
# 2. MODELOS DE FASE 4: AUDIENCE ARCHITECT
# ==========================================

class PersonaProfile(BaseModel):
    """Deep psychological profile of a synthetic agent."""
    id: str
    name: str
    age: int
    occupation: str
    # Behavioral Economics Attributes
    financial_status: str = Field(..., description="High, Medium, Low, Debt-Ridden, etc.")
    cognitive_biases: List[str] = Field(..., description="e.g., Loss Aversion, Confirmation Bias, FOMO")
    current_stressors: List[str] = Field(..., description="e.g., Inflation, Job Security, Divorce")
    media_diet: List[str] = Field(..., description="Where they get information")
    values: List[str] = Field(..., description="Core values driving decisions")

class SimulationInput(BaseModel):
    """Request payload to start a simulation."""
    target_audience_description: str = Field(..., description="Natural language description of the target.")
    ad_copy: str = Field(..., description="The text, script, or concept to test.")
    sample_size: int = Field(default=10, ge=1, le=50, description="Number of agents to instantiate.")

class AgentReaction(BaseModel):
    """The raw output from a single agent's simulation."""
    agent_id: str
    click_probability: float = Field(..., ge=0.0, le=1.0)
    emotional_response: str
    primary_objection: Optional[str] = None
    purchase_intent: bool
    reasoning: str

class ResonanceReport(BaseModel):
    """Final aggregated analysis of the simulation."""
    simulation_id: str
    timestamp: datetime
    viral_score: float # 0-100
    conversion_probability: float # 0-100
    dominant_emotions: Dict[str, int]
    top_objections: List[str]
    demographic_breakdown: Dict[str, Any]
    recommendations: List[str]

# ==========================================
# 3. MODELOS DE ENTRADA (Analyst & Governance)
# ==========================================

class MarketSignal(BaseModel):
    """Modelo principal de señal de mercado"""
    source: str
    content: str
    sentiment_score: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}
    id: Optional[str] = None

# Alias de compatibilidad
SignalInput = MarketSignal 

class AnalysisRequest(BaseModel):
    signal: MarketSignal
    context_data: Dict[str, Any] = {} 

# ==========================================
# 4. MODELOS DE ESTRATEGIA (OUTPUT)
# ==========================================

class CriticalAlert(BaseModel):
    signal_id: str
    timestamp: datetime
    severity: Severity
    message: str # Campo requerido por Governance, a veces usado como details
    anomaly_score: Optional[float] = None
    trust_score: Optional[float] = None
    context_data: Dict[str, Any] = {}
    type: Optional[str] = "GENERAL"

class AnomalyResult(BaseModel):
    is_anomaly: bool
    score: float
    severity: Severity
    details: str

class DebateEntry(BaseModel):
    """Entrada individual en el transcript del debate"""
    agent_role: str 
    content: str     
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ActionProposal(BaseModel):
    """Propuesta final de acción lista para Gobernanza/Ejecución"""
    action_type: ActionType
    reasoning: str = Field(..., description="Justificación estratégica resumida")
    parameters: Dict[str, Any] = Field(default={})
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    urgency: UrgencyLevel = UrgencyLevel.MEDIUM
    
    # Trazabilidad y Gobernanza
    proposal_id: Optional[str] = None
    governance_status: Optional[GovernanceStatus] = None
    block_reason: Optional[str] = None
    governance_metadata: Dict[str, Any] = {}
    
    # EL CEREBRO: Transcript del debate para mostrar al usuario
    debate_transcript: List[DebateEntry] = []
    
    class Config:
        from_attributes = True