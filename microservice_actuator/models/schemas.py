from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime
import uuid

# Definimos los tipos de acciones permitidas (basado en tus logs anteriores)
class ActionType(str, Enum):
    CREATE_CAMPAIGN = "CREATE_CAMPAIGN"
    PAUSE_CAMPAIGN = "PAUSE_CAMPAIGN"
    INCREASE_BUDGET = "INCREASE_BUDGET"
    DECREASE_BUDGET = "DECREASE_BUDGET"
    PRICING_ADJUSTMENT = "PRICING_ADJUSTMENT"
    INVENTORY_ORDER = "INVENTORY_ORDER"
    NOTIFY_HUMAN = "NOTIFY_HUMAN"
    DO_NOTHING = "DO_NOTHING"
    # Agregamos GENERATE_CAMPAIGN por si acaso quieres usar el antiguo
    GENERATE_CAMPAIGN = "GENERATE_CAMPAIGN" 

class ActionRequest(BaseModel):
    action_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: ActionType  # Usamos el Enum para validar
    priority: str = "HIGH"
    reasoning: str
    parameters: Dict[str, Any]

# --- NUEVA CLASE QUE FALTABA ---
class ActionResponse(BaseModel):
    execution_id: str
    action_id: str
    status: str
    details: Dict[str, Any]
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)