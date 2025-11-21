import numpy as np
from logic.scenario_simulator import MarketSimulator, ScenarioConfig
from models.global_context_models import OptimizationContext
from models.optimization_result_models import GlobalRecommendation

class MonteCarloOptimizer:
    def __init__(self, context: OptimizationContext, simulation_days: int = 7, iterations: int = 1000):
        self.context = context
        self.days = simulation_days
        self.iterations = iterations # Número de universos simulados por escenario
        self.simulator = MarketSimulator()

    def _calculate_base_velocity(self, item) -> float:
        """Estima la velocidad de ventas diaria base (unidades/día)."""
        # En un sistema real, esto vendría del B10 (Historical Trace).
        # Aquí usamos una heurística basada en stock ideal para rotación de 30 días.
        return max(1, item.qty / 30.0) 

    def _calculate_unit_price(self, item) -> float:
        """Deriva el precio de venta actual basado en costo y margen."""
        # Price = Cost / (1 - Margin)
        if item.margin >= 1.0: return item.cost * 2 # Fallback de seguridad
        return item.cost / (1 - item.margin)

    def run_simulation(self) -> GlobalRecommendation:

        # Guardrail: Validación de inventario vacío o agotado
        if not self.context.inventory_snapshot or all(i.qty == 0 for i in self.context.inventory_snapshot):
            # Retorno temprano si no hay nada que optimizar
            return GlobalRecommendation(
                recommended_action_type="NO_ACTION",
                pricing_adjustment=0.0,
                logistics_change="RESTOCK_REQUIRED",
                projected_roi=0.0,
                justification="Inventario agotado o vacío. No es posible optimizar ventas sin stock."
            )

        best_scenario = None
        best_roi = -float('inf')
        safety_threshold_stockout = 0.05 # 5% tolerancia máxima de riesgo
        results = []

        # 1. Iterar sobre los 3 escenarios estratégicos
        for scenario in self.simulator.get_scenarios():
            total_profit = 0.0
            stockout_count = 0
            total_runs = 0

            # 2. Loop de Monte Carlo (1000 iteraciones por escenario)
            for _ in range(self.iterations):
                # Variables de estado para esta iteración
                run_revenue = 0.0
                run_cost = 0.0
                stockout_occurred = False

                # Definir costo logístico base y ajuste por escenario
                base_logistics_cost = 5.0
                scenario_logistics_multiplier = 1.0
                if scenario.name == "SCENARIO_C_LIQUIDATION":
                    scenario_logistics_multiplier = 0.9 # Ahorro en logística masiva
                unit_logistics_cost = base_logistics_cost * scenario_logistics_multiplier

                # Simulación simplificada para el SKU principal (o suma de todos)
                for item in self.context.inventory_snapshot:
                    current_stock = item.qty
                    base_price = self._calculate_unit_price(item)
                    simulated_price = base_price * (1 + scenario.price_delta)

                    # Costo base + Gasto extra de marketing prorrateado (simplificado por unidad)
                    unit_marketing_cost = (base_price * 0.1) * (1 + scenario.marketing_budget_delta)

                    # Simular paso del tiempo (7 días)
                    for day in range(self.days):
                        base_vel = self._calculate_base_velocity(item)
                        daily_demand = self.simulator.simulate_daily_demand(base_vel, scenario.demand_multiplier)

                        sold_qty = min(current_stock, daily_demand)

                        if daily_demand > current_stock:
                            stockout_occurred = True

                        # Acumular Financieros
                        run_revenue += sold_qty * simulated_price
                        run_cost += (sold_qty * item.cost) + \
                                    (sold_qty * unit_marketing_cost) + \
                                    (sold_qty * unit_logistics_cost) # <- Agregado explícitamente
                        current_stock -= sold_qty

                # Métricas del Run
                run_profit = run_revenue - run_cost
                total_profit += run_profit
                if stockout_occurred:
                    stockout_count += 1
                total_runs += 1

            # 3. Agregar resultados del Escenario
            avg_profit = total_profit / total_runs
            stockout_prob = stockout_count / total_runs

            # Calcular ROI aproximado para comparación
            estimated_base_cost = total_runs * 1000 # Normalización simple para evitar div/0
            scenario_roi = avg_profit / estimated_base_cost if estimated_base_cost > 0 else 0

            results.append({
                "scenario": scenario,
                "roi": scenario_roi,
                "profit": avg_profit,
                "risk": stockout_prob
            })

        # 4. Selector de "La Ruta Dorada"
        # Filtramos los que son demasiado arriesgados
        safe_options = [r for r in results if r['risk'] <= safety_threshold_stockout]

        if safe_options:
            # Si hay opciones seguras, elegimos la más rentable
            winner = max(safe_options, key=lambda x: x['profit'])
            justification = (
                f"Estrategia Óptima: {winner['scenario'].name}. "
                f"Proyecta el mayor beneficio (${winner['profit']:.2f}) manteniendo el riesgo de ruptura "
                f"de stock bajo control ({winner['risk']*100:.1f}%). "
                f"Se prefiere sobre opciones más agresivas por seguridad operativa."
            )
        else:
            # Si todas son arriesgadas, elegimos la de menor riesgo (Safety First)
            winner = min(results, key=lambda x: x['risk'])
            justification = (
                f"ALERTA DE RIESGO: Todas las estrategias proyectan alto riesgo de stockout. "
                f"Se selecciona {winner['scenario'].name} por ser la opción más conservadora "
                f"(Riesgo: {winner['risk']*100:.1f}%). Se recomienda reposición inmediata."
            )

        # 5. Mapeo al modelo de salida
        action_map = {
            "SCENARIO_A_AGGRESSIVE_GROWTH": "MARKETING_BUDGET_REALLOCATION",
            "SCENARIO_B_MARGIN_PROTECTION": "PRICING_ADJUSTMENT",
            "SCENARIO_C_LIQUIDATION": "PRICING_ADJUSTMENT"
        }

        return GlobalRecommendation(
            recommended_action_type=action_map.get(winner['scenario'].name, "NO_ACTION"),
            pricing_adjustment=winner['scenario'].price_delta,
            logistics_change="PRIORITIZE_REPLENISHMENT" if winner['risk'] > 0.2 else "STANDARD_SLA",
            marketing_budget_reallocation={"boost_factor": winner['scenario'].marketing_budget_delta} if winner['scenario'].marketing_budget_delta > 0 else None,
            projected_roi=float(winner['roi']), # Convert numpy float to standard float
            justification=justification
        )
