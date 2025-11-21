import numpy as np
from typing import List, Dict, Any
from models.global_context_models import OptimizationContext, ProductInventoryItem

class ScenarioConfig:
    """Define los parámetros de modificación para un escenario hipotético."""
    def __init__(self, name: str, price_delta: float, marketing_budget_delta: float, demand_multiplier: float):
        self.name = name
        self.price_delta = price_delta             # e.g., 0.05 para +5%
        self.marketing_budget_delta = marketing_budget_delta # e.g., 0.10 para +10%
        self.demand_multiplier = demand_multiplier # Elasticidad esperada (impacto en ventas)

class MarketSimulator:
    """
    Generador de proyecciones de ventas basado en volatilidad estocástica.
    No asume ventas fijas, sino curvas de probabilidad.
    """
    
    @staticmethod
    def get_scenarios() -> List[ScenarioConfig]:
        return [
            # Escenario A: Agresivo (Gastar más para vender más)
            ScenarioConfig(
                name="SCENARIO_A_AGGRESSIVE_GROWTH", 
                price_delta=0.0, 
                marketing_budget_delta=0.10, # +10% gasto
                demand_multiplier=1.25       # Esperamos +25% ventas (Elasticidad positiva al marketing)
            ),
            # Escenario B: Conservador (Subir precio para proteger margen/stock)
            ScenarioConfig(
                name="SCENARIO_B_MARGIN_PROTECTION", 
                price_delta=0.05,            # +5% precio
                marketing_budget_delta=0.0, 
                demand_multiplier=0.85       # Esperamos -15% ventas (Elasticidad negativa al precio)
            ),
            # Escenario C: Liquidación (Bajar precio para liberar cash)
            ScenarioConfig(
                name="SCENARIO_C_LIQUIDATION", 
                price_delta=-0.10,           # -10% precio
                marketing_budget_delta=0.0, 
                demand_multiplier=1.40       # Esperamos +40% ventas (Alta sensibilidad a descuentos)
            )
        ]

    @staticmethod
    def simulate_daily_demand(base_velocity: float, multiplier: float, volatility: float = 0.2) -> int:
        """
        Genera una demanda diaria usando una distribución de Poisson ajustada con ruido Gaussiano
        para simular la incertidumbre del mundo real.
        """
        expected_sales = base_velocity * multiplier
        # Ruido aleatorio: La demanda nunca es exacta
        noise = np.random.normal(0, volatility * expected_sales)
        final_demand = max(0, int(expected_sales + noise))
        # Usamos Poisson para eventos discretos (ventas unitarias)
        return np.random.poisson(final_demand)
