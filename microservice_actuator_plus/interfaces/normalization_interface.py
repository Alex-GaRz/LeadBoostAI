from abc import ABC, abstractmethod
from models.schemas import WebhookPayload, StandardPerformanceMetric

class IMetricNormalizer(ABC):
    """Interfaz Strategy para normalizar métricas de distintas fuentes."""
    
    @abstractmethod
    def normalize(self, payload: WebhookPayload) -> StandardPerformanceMetric:
        pass