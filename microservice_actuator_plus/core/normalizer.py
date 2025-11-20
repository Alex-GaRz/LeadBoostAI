from typing import Dict
from models.schemas import MetricSource, WebhookPayload, StandardPerformanceMetric
from interfaces.normalization_interface import IMetricNormalizer
from core.strategies import MetaAdsNormalizer, GoogleAdsNormalizer, MockNormalizer

class MetricsNormalizerService:
    def __init__(self):
        # Registro de estrategias
        self._strategies: Dict[MetricSource, IMetricNormalizer] = {
            MetricSource.META_ADS: MetaAdsNormalizer(),
            MetricSource.GOOGLE_ADS: GoogleAdsNormalizer(),
            MetricSource.MOCK_GENERATOR: MockNormalizer(),
            # MetricSource.LOGISTICS_ERP: LogisticsNormalizer() # Futuro
        }

    def process(self, payload: WebhookPayload) -> StandardPerformanceMetric:
        strategy = self._strategies.get(payload.source)
        if not strategy:
            # Fallback seguro o error explícito
            raise ValueError(f"No existe normalizador para la fuente: {payload.source}")
        
        return strategy.normalize(payload)