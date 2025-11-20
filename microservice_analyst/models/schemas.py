from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
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