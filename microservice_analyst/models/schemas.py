from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# --- ENUMS ESTRATÉGICOS ---
class ActionType(str, Enum):
    MARKETING_CAMPAIGN = "MARKETING_CAMPAIGN"  # Generar anuncios/contenido
    PRICING_ADJUST = "PRICING_ADJUST"          # Ajustar precios dinámicos
    INVENTORY_CHECK = "INVENTORY_CHECK"        # Alertas de stock/logística
    MANUAL_REVIEW = "MANUAL_REVIEW"            # Escalado a humano

class PriorityLevel(str, Enum):
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class SignalInput(BaseModel):
    id: str
    source: str
    timestamp: datetime
    content: str
    analysis: Dict[str, Any] = Field(default_factory=dict)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class AnomalyResult(BaseModel):
    is_anomaly: bool
    score: float
    severity: Severity
    details: str

class CriticalAlert(BaseModel):
    signal_id: str
    timestamp: datetime
    type: str
    severity: Severity
    anomaly_score: float
    trust_score: float
    context_data: Dict[str, Any]
    status: str = "NEW"

# --- INPUT: Lo que recibimos del Bloque 4 ---
# (Asegurarse de que esto coincida con lo que emite el B4)
class CriticalAlert(BaseModel):
    alert_id: str
    timestamp: str
    metric: str
    current_value: float
    threshold: float
    severity: str
    context: Optional[Dict[str, Any]] = None

# --- OUTPUT: La decisión del Consejero ---
class ActionProposal(BaseModel):
    action_type: ActionType = Field(
        ..., 
        description="El tipo de acción correctiva o de aprovechamiento seleccionada."
    )
    priority: PriorityLevel = Field(
        ..., 
        description="Nivel de urgencia basado en la magnitud de la anomalía."
    )
    reasoning: str = Field(
        ..., 
        description="Explicación estratégica breve de por qué se eligió esta acción."
    )
    suggested_params: Dict[str, Any] = Field(
        ..., 
        description="Parámetros específicos para la ejecución (ej: presupuesto, canales, % descuento)."
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "action_type": "MARKETING_CAMPAIGN",
                "priority": "HIGH",
                "reasoning": "Se detectó un pico de interés del 300% en 'Zapatillas', se debe capitalizar inmediatamente.",
                "suggested_params": {
                    "budget": 500,
                    "channels": ["instagram", "email"],
                    "ad_focus": "urgency"
                }
            }
        }