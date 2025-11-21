from typing import Dict, Any
from interfaces.normalization_interface import INormalizationStrategy
from core.strategies import MetaAdsNormalizer, GoogleAdsNormalizer, MockNormalizer

class MetricsNormalizer:
    """
    Contexto del Strategy Pattern. 
    Decide qué normalizador usar basándose en la fuente (source).
    """
    def __init__(self):
        # Registro de estrategias disponibles
        self._strategies: Dict[str, INormalizationStrategy] = {
            "meta_ads": MetaAdsNormalizer(),
            "google_ads": GoogleAdsNormalizer(),
            "mock": MockNormalizer(),
            "simulation": MockNormalizer() # Alias para pruebas
        }

    def normalize(self, source: str, raw_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Recibe la fuente (ej: 'meta_ads') y los datos crudos.
        Devuelve un diccionario estandarizado.
        """
        strategy = self._strategies.get(source.lower())
        
        if not strategy:
            # Si no conocemos la fuente, usamos Mock por seguridad (o lanzamos error)
            print(f"⚠️ ADVERTENCIA: Fuente '{source}' desconocida. Usando MockNormalizer.")
            strategy = self._strategies["mock"]
            
        return strategy.normalize(raw_data)