from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

# --- Enums ---
class ActionType(str, Enum):
    CREATE_CAMPAIGN = "CREATE_CAMPAIGN"
    PAUSE_CAMPAIGN = "PAUSE_CAMPAIGN"
    INCREASE_BUDGET = "INCREASE_BUDGET"
    DECREASE_BUDGET = "DECREASE_BUDGET"
    NOTIFY_HUMAN = "NOTIFY_HUMAN"
    DO_NOTHING = "DO_NOTHING"

class UrgencyLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# --- Sub-Modelos ---

class DebateEntry(BaseModel):
    """Captura una intervención en el debate interno de los agentes"""
    agent_role: str  # 'CMO', 'CFO', 'CEO'
    content: str     # El argumento o razonamiento
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Modelos Principales ---

class MarketSignal(BaseModel):
    """Representación de la señal cruda que llega al analista"""
    source: str
    content: str
    sentiment_score: float
    timestamp: datetime

class AnalysisRequest(BaseModel):
    """Payload para solicitar un análisis estratégico"""
    signal: MarketSignal
    context_data: Dict[str, Any] = {} # Datos extra (presupuesto actual, competidores, etc.)

class ActionProposal(BaseModel):
    """Decisión final estructurada del CEO"""
    action_type: ActionType
    reasoning: str = Field(..., description="Justificación sintetizada final")
    parameters: Dict[str, Any] = Field(default={}, description="Parámetros técnicos para el Actuator (budget, copy, targeting)")
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    urgency: UrgencyLevel
    
    # NUEVO CAMPO: Transcript del debate para transparencia en UI
    debate_transcript: List[DebateEntry] = []

    class Config:
        json_schema_extra = {
            "example": {
                "action_type": "CREATE_CAMPAIGN",
                "reasoning": "Aunque el CMO sugirió duplicar presupuesto, el CFO advirtió sobre flujo de caja. Optamos por una campaña de prueba con presupuesto moderado.",
                "parameters": {"budget_limit": 500, "platform": "facebook"},
                "confidence_score": 0.85,
                "urgency": "HIGH",
                "debate_transcript": [
                    {"agent_role": "CMO", "content": "¡Vamos con todo! Hay viralidad."},
                    {"agent_role": "CFO", "content": "Riesgoso. No tenemos margen."},
                    {"agent_role": "CEO", "content": "Aprobado test A/B limitado."}
                ]
            }
        }