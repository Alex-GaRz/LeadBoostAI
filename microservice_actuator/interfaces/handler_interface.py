from abc import ABC, abstractmethod
from typing import Dict, Any
from enum import Enum

# ✅ ESTO FALTABA: El menú de opciones disponibles
class ActionType(str, Enum):
    MARKETING_CAMPAIGN = "marketing_campaign"
    EMAIL_NOTIFICATION = "email_notification"
    # Aquí agregaríamos más tipos en el futuro (ej: STOCK_ORDER)

# El contrato que deben firmar los handlers
class IActionHandler(ABC):
    @abstractmethod
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        pass