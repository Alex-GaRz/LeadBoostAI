import pytest
import numpy as np
from models.global_context_models import OptimizationContext, ProductInventoryItem, FinancialStatusSnapshot
from logic.optimizer_engine import MonteCarloOptimizer

# --- Fixtures (Datos de Prueba) ---

@pytest.fixture
def safe_context():
    """Un contexto donde sobra inventario. El riesgo de stockout debería ser 0."""
    return OptimizationContext(
        financial_status=FinancialStatusSnapshot(total_budget=10000, used_budget=2000, fiscal_year_margin_avg=0.20),
        inventory_snapshot=[
            ProductInventoryItem(sku="SAFE-ITEM", qty=10000, cost=50.0, margin=0.5, lead_time_days=1)
        ],
        historical_performance=[]
    )

@pytest.fixture
def risky_context():
    """Un contexto crítico. Poco inventario para la demanda esperada."""
    return OptimizationContext(
        financial_status=FinancialStatusSnapshot(total_budget=10000, used_budget=2000, fiscal_year_margin_avg=0.20),
        inventory_snapshot=[
            # CAMBIO CRÍTICO: Bajamos stock de 10 a 5 para garantizar que el riesgo > 5%
            ProductInventoryItem(sku="RISKY-ITEM", qty=5, cost=50.0, margin=0.5, lead_time_days=14)
        ],
        historical_performance=[]
    )

# --- Tests Matemáticos ---

def test_monte_carlo_sanity_check(safe_context):
    """Prueba básica: El motor corre y devuelve un objeto válido."""
    optimizer = MonteCarloOptimizer(safe_context, iterations=100)
    result = optimizer.run_simulation()
    
    assert result is not None
    assert result.recommended_action_type in ["PRICING_ADJUSTMENT", "MARKETING_BUDGET_REALLOCATION", "NO_ACTION"]
    assert isinstance(result.projected_roi, float)

def test_safety_first_mechanism(risky_context):
    """
    PRUEBA CRÍTICA: Con stock de 5 unidades, gastar en marketing (+ventas) es suicida.
    El riesgo de stockout será > 5%, por lo que el optimizador DEBE descartar 'MARKETING_BUDGET_REALLOCATION'.
    """
    optimizer = MonteCarloOptimizer(risky_context, iterations=500)
    result = optimizer.run_simulation()
    
    print(f"\n[RISKY TEST] Acción recomendada: {result.recommended_action_type}")
    print(f"[RISKY TEST] Justificación: {result.justification}")

    # La prueba pasa si el sistema NO recomienda gastar en marketing
    assert result.recommended_action_type != "MARKETING_BUDGET_REALLOCATION", \
        f"FATAL: El sistema recomendó gastar marketing con riesgo alto. (Acción: {result.recommended_action_type})"
    
    # Verificaciones adicionales de comportamiento correcto
    is_conservative = result.recommended_action_type in ["PRICING_ADJUSTMENT", "NO_ACTION"]
    assert is_conservative, "El sistema debió elegir una estrategia conservadora (subir precio o no hacer nada)."

def test_profit_maximization(safe_context):
    """
    PRUEBA DE OPORTUNIDAD: Con stock de sobra, el sistema debe ser agresivo.
    """
    optimizer = MonteCarloOptimizer(safe_context, iterations=500)
    result = optimizer.run_simulation()
    
    print(f"\n[PROFIT TEST] Acción recomendada: {result.recommended_action_type}")
    
    assert result.recommended_action_type != "NO_ACTION", \
        "INEFICACIA: El sistema no aprovechó el exceso de stock para generar ganancia."

def test_zero_stock_guardrail():
    """Verifica que el parche de 'Stock Cero' funcione."""
    empty_context = OptimizationContext(
        financial_status=FinancialStatusSnapshot(total_budget=10000, used_budget=0, fiscal_year_margin_avg=0.0),
        inventory_snapshot=[ProductInventoryItem(sku="EMPTY", qty=0, cost=10, margin=0.1, lead_time_days=1)],
        historical_performance=[]
    )
    
    optimizer = MonteCarloOptimizer(empty_context)
    result = optimizer.run_simulation()
    
    assert result.recommended_action_type == "NO_ACTION"
    assert "Inventario agotado" in result.justification