from typing import Dict, Any
from interfaces.normalization_interface import INormalizationStrategy

class MetaAdsNormalizer(INormalizationStrategy):
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, float]:
        # Meta suele dar céntimos, convertimos a unidades estándar
        spend = raw_data.get("spend", 0.0)
        clicks = raw_data.get("clicks", 0)
        conversions = raw_data.get("conversions", 0)
        
        return {
            "cost": float(spend),
            "clicks": int(clicks),
            "conversions": int(conversions),
            "roi": (float(conversions) * 100) / (float(spend) + 0.01) # Evitar div/0
        }

class GoogleAdsNormalizer(INormalizationStrategy):
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, float]:
        # Google a veces usa micros (x1,000,000), aquí asumimos estándar para simplificar
        cost = raw_data.get("cost_micros", 0) / 1000000 if "cost_micros" in raw_data else raw_data.get("cost", 0)
        
        return {
            "cost": float(cost),
            "clicks": int(raw_data.get("clicks", 0)),
            "conversions": int(raw_data.get("conversions", 0)),
            "roi": 0.0 # Pendiente lógica compleja
        }

class MockNormalizer(INormalizationStrategy):
    def normalize(self, raw_data: Dict[str, Any]) -> Dict[str, float]:
        return {
            "cost": float(raw_data.get("spend", 0)),
            "clicks": int(raw_data.get("clicks", 0)),
            "conversions": int(raw_data.get("conversions", 0)),
            "roi": 1.5 # Valor simulado
        }