from pydantic import BaseModel, Field
from typing import Literal, Optional

class GlobalRecommendation(BaseModel):
    """
    Modelo de datos de salida que representa la recomendación optimizada del Bloque 12.
    """
    recommended_action_type: Literal[
        "PRICING_ADJUSTMENT",
        "MARKETING_BUDGET_REALLOCATION",
        "LOGISTICS_PRIORITIZATION",
        "NO_ACTION"
    ] = Field(..., description="Tipo de acción recomendada que maximiza el ROI global.")

    pricing_adjustment: float = Field(
        0.0,
        description="Ajuste de precio sugerido (e.g., -0.07 para una reducción del 7%)."
    )
    
    logistics_change: str = Field(
        "N/A",
        description="Instrucción operativa para logística (e.g., 'Priorizar envío PROD-001')."
    )
    
    marketing_budget_reallocation: Optional[dict] = Field(
        None,
        description="Sugerencia de redistribución de presupuesto (e.g., {'Meta': 0.7, 'Google': 0.3})."
    )

    projected_roi: float = Field(..., description="Retorno de inversión proyectado con la acción recomendada.")
    
    justification: str = Field(..., description="Explicación del razonamiento de la optimización global.")
