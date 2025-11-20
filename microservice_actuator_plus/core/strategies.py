from interfaces.normalization_interface import IMetricNormalizer
from models.schemas import WebhookPayload, StandardPerformanceMetric
import logging

logger = logging.getLogger(__name__)

class MetaAdsNormalizer(IMetricNormalizer):
    def normalize(self, payload: WebhookPayload) -> StandardPerformanceMetric:
        data = payload.data
        
        # Lógica específica de Meta: Calcular ROAS o CTR
        spend = data.get("spend", 1.0) # Evitar división por cero
        revenue = data.get("conversion_value", 0.0)
        clicks = data.get("clicks", 0)
        impressions = data.get("impressions", 1)
        
        # Cálculo de métricas
        roas = revenue / spend if spend > 0 else 0.0
        ctr = clicks / impressions if impressions > 0 else 0.0
        
        # Normalización: Para este sistema, definimos el Performance Score basado en ROAS
        # (Esto podría ser más complejo en v2 con modelos de ML)
        performance_score = roas 

        return StandardPerformanceMetric(
            execution_id=payload.execution_id,
            timestamp=payload.timestamp,
            source=payload.source,
            performance_score=performance_score,
            key_metrics={
                "roas": roas,
                "ctr": ctr,
                "cpc": spend / clicks if clicks > 0 else 0.0
            },
            raw_data_snapshot=data
        )

class GoogleAdsNormalizer(IMetricNormalizer):
    def normalize(self, payload: WebhookPayload) -> StandardPerformanceMetric:
        data = payload.data
        
        # Google usa terminología diferente (cost, conversions)
        cost = data.get("cost_micros", 1000000) / 1000000
        conversions_value = data.get("conversions_value", 0.0)
        interactions = data.get("interactions", 0)
        
        roas = conversions_value / cost if cost > 0 else 0.0
        
        return StandardPerformanceMetric(
            execution_id=payload.execution_id,
            timestamp=payload.timestamp,
            source=payload.source,
            performance_score=roas, # Estandarizamos al mismo concepto que Meta
            key_metrics={
                "roas": roas,
                "interactions": float(interactions),
                "cost": cost
            },
            raw_data_snapshot=data
        )

# Estrategia Default/Mock
class MockNormalizer(IMetricNormalizer):
    def normalize(self, payload: WebhookPayload) -> StandardPerformanceMetric:
        return StandardPerformanceMetric(
            execution_id=payload.execution_id,
            timestamp=payload.timestamp,
            source=payload.source,
            performance_score=payload.data.get("simulated_score", 0.5),
            key_metrics=payload.data.get("metrics", {}),
            raw_data_snapshot=payload.data
        )