from pydantic import BaseModel, Field
from typing import Dict, Optional
from datetime import datetime

class ProductState(BaseModel):
    sku: str
    name: str
    qty: int = Field(..., description="Stock físico disponible")
    reserved: int = Field(default=0, description="Stock comprometido en órdenes")
    cost: float
    price: float
    margin: float = Field(..., description="Margen calculado dinámicamente")
    lead_time_days: int
    last_update: datetime = Field(default_factory=datetime.now)

class FinancialState(BaseModel):
    total_budget: float
    used_budget: float
    fiscal_year_margin_avg: float

class TransactionRequest(BaseModel):
    sku: str
    qty_sold: int
    sale_price: float
    campaign_id: Optional[str] = None

class TransactionResult(BaseModel):
    success: bool
    message: str
    remaining_stock: int