from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Componentes del Bloque 11 (Enterprise Simulator) ---

class FinancialStatusSnapshot(BaseModel):
    """Refleja el estado financiero actual del B11."""
    total_budget: float = Field(..., description="Presupuesto total disponible de marketing/operaciones.")
    used_budget: float = Field(..., description="Presupuesto utilizado hasta la fecha.")
    fiscal_year_margin_avg: float = Field(..., description="Margen promedio del año fiscal (0.0 a 1.0).")

class ProductInventoryItem(BaseModel):
    """Refleja el estado de un SKU, extendido con campos operativos del B11."""
    sku: str = Field(..., description="Identificador único del producto.")
    qty: int = Field(..., description="Stock físico disponible (cantidad).")
    cost: float = Field(..., description="Costo operativo por unidad.")
    margin: float = Field(..., description="Margen actual del producto (0.0 a 1.0).")
    lead_time_days: int = Field(..., description="Tiempo de entrega en días (logística).")

# --- Componentes del Bloque 10 (Central Memory Hub) ---

class HistoricalTraceSummary(BaseModel):
    """Resumen simplificado del rendimiento de una decisión previa del B10."""
    trace_id: str
    timestamp: datetime
    action_type: str = Field(..., description="Tipo de acción ejecutada (e.g., marketing_campaign, stock_order).")
    outcome_metric: float = Field(..., description="Score de resultado normalizado (0.0 a 1.0) desde el B8.")
    status: str = Field(..., description="Estado final (COMPLETED, BLOCKED_BY_GOVERNANCE, etc.).")

# --- Modelo de Contexto Global (Input Principal del B12) ---

class OptimizationContext(BaseModel):
    """
    Modelo de datos de entrada para el Bloque 12, consolidando el estado empresarial (B11)
    y el historial de decisiones (B10).
    """
    # Estado Operativo/Financiero
    financial_status: FinancialStatusSnapshot
    inventory_snapshot: List[ProductInventoryItem] = Field(..., description="Lista de todos los SKUs con su estado logístico.")
    
    # Historial de Rendimiento
    historical_performance: List[HistoricalTraceSummary] = Field(..., description="Rendimiento histórico de acciones previas para aprendizaje.")
    
    # Contexto de Decisión
    current_strategy_id: Optional[str] = Field(None, description="ID de la estrategia B5/B6 que se está evaluando actualmente.")
