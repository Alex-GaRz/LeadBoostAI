import numpy as np
from logic.scenario_simulator import MarketSimulator # Mantenemos imports para compatibilidad de interfaces
from models.global_context_models import OptimizationContext
from models.optimization_result_models import GlobalRecommendation
from core.math_core import ROIPredictor

class MonteCarloOptimizer:
    """
    NOTA: El nombre se mantiene por compatibilidad, pero el motor interno 
    ahora es un Regresor Estocástico (SGD) determinista.
    """
    def __init__(self, context: OptimizationContext, simulation_days: int = 7, iterations: int = 0):
        self.context = context
        self.predictor = ROIPredictor()
        # 'iterations' ya no se usa (no hay random), pero se mantiene en firma __init__

    def _calculate_diminishing_returns(self, base_budget: float, platform: str, ctr: float) -> bool:
        """
        Calcula la derivada discreta. 
        Si invertir $1 extra genera menos de $1 de retorno (ROI incremental < 1),
        hemos saturado el canal.
        """
        roi_current, _ = self.predictor.predict_roi(base_budget, platform, ctr)
        roi_plus, _ = self.predictor.predict_roi(base_budget * 1.1, platform, ctr) # +10% presupuesto
        
        total_return_current = base_budget * roi_current
        total_return_plus = (base_budget * 1.1) * roi_plus
        
        marginal_gain = total_return_plus - total_return_current
        marginal_cost = base_budget * 0.1
        
        # Si la ganancia marginal es menor al costo marginal, detener inversión.
        return marginal_gain < marginal_cost

    def run_simulation(self) -> GlobalRecommendation:
        """
        Ejecuta la optimización basada en Regresión Predictiva.
        """
        # 1. Extracción de Features del Contexto
        # Asumimos que inventory_snapshot trae metadatos útiles o usamos defaults
        # En un escenario real LeadBoostAI, context debería tener 'active_campaigns'
        # Adaptamos al contexto existente:
        
        winner_scenario = "NO_ACTION"
        best_roi = 0.0
        best_adjustment = 0.0
        logic_justification = ""

        # Definimos escenarios de prueba (Presupuestos Delta)
        scenarios = [
            ("CONSERVATIVE", 1000.0, 0.0),      # Presupuesto Base
            ("SCALING", 1500.0, -0.05),         # +Inversión, ligero descuento precio
            ("AGGRESSIVE", 2500.0, -0.10)       # ++Inversión, descuento agresivo
        ]
        
        # Plataforma Dominante (inferida o default)
        platform = "META" 
        current_ctr = 0.02 # Dato que debería venir del contexto histórico (B10)

        results = []
        
        for name, budget, price_adj in scenarios:
            # Predicción Matemática
            predicted_roi, confidence = self.predictor.predict_roi(budget, platform, current_ctr)
            
            # Ajuste por cambio de precio (Elasticidad Precio simple)
            # Si bajamos precio, asumimos conversión sube, pero margen baja.
            # ROI ajustado = ROI_Predicho * (1 - abs(price_adj))
            adjusted_roi = predicted_roi * (1.0 + price_adj) # price_adj es negativo

            is_saturated = self._calculate_diminishing_returns(budget, platform, current_ctr)
            
            results.append({
                "name": name,
                "roi": adjusted_roi,
                "confidence": confidence,
                "saturated": is_saturated,
                "price_adj": price_adj
            })

        # Selección de Estrategia ("La Ruta Dorada")
        # Filtramos saturados si tenemos opciones no saturadas
        non_saturated = [r for r in results if not r['saturated']]
        candidates = non_saturated if non_saturated else results
        
        winner = max(candidates, key=lambda x: x['roi'])

        # Mapeo a respuesta
        action_map = {
            "CONSERVATIVE": "NO_ACTION",
            "SCALING": "MARKETING_BUDGET_REALLOCATION",
            "AGGRESSIVE": "PRICING_ADJUSTMENT"
        }

        confidence_pct = winner['confidence'] * 100
        
        logic_justification = (
            f"Estrategia {winner['name']} seleccionada por MathCore. "
            f"ROI proyectado: {winner['roi']:.2f} (Confianza: {confidence_pct:.1f}%). "
            f"{'ALERTA: Canal saturado.' if winner['saturated'] else 'Capacidad de escala detectada.'} "
            f"Modelo entrenado con {self.predictor.training_count} puntos de datos."
        )

        return GlobalRecommendation(
            recommended_action_type=action_map.get(winner['name'], "NO_ACTION"),
            pricing_adjustment=winner['price_adj'],
            logistics_change="STANDARD_SLA",
            marketing_budget_reallocation={"boost_factor": 1.5} if winner['name'] == "SCALING" else None,
            projected_roi=float(winner['roi']),
            justification=logic_justification
        )