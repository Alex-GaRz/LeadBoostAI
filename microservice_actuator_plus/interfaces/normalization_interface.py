from abc import ABC, abstractmethod
from typing import Dict, Any

class INormalizationStrategy(ABC):
    """
    Interfaz que deben cumplir todas las estrategias de normalización.
    Obliga a transformar datos crudos en métricas estándar.
    """
    @abstractmethod
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, float]:
        pass