import json
import random
import os
from datetime import datetime
from typing import Dict, List
from models.schemas import ProductState, FinancialState, TransactionRequest

STATE_FILE = "enterprise_state.json"

class EnterpriseSimulatorEngine:
    """
    Simula un ERP vivo.
    - Persiste estado en JSON.
    - Simula 'ventas orgánicas' (el stock baja solo con el tiempo).
    - Simula fluctuación de mercado en márgenes.
    """
    
    def __init__(self):
        self.inventory: Dict[str, ProductState] = {}
        self.financials: FinancialState = None
        self._load_state()

    def _load_state(self):
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                data = json.load(f)
                # Reconstruir modelos Pydantic
                self.inventory = {k: ProductState(**v) for k, v in data['inventory'].items()}
                self.financials = FinancialState(**data['financials'])
        else:
            self._initialize_default_state()

    def _initialize_default_state(self):
        # Estado inicial "Semilla"
        self.inventory = {
            "PROD-001": ProductState(
                sku="PROD-001", name="High-End Laptop", qty=150, cost=800.0, 
                price=1200.0, margin=0.33, lead_time_days=14
            ),
            "PROD-002": ProductState(
                sku="PROD-002", name="Wireless Mouse", qty=500, cost=15.0, 
                price=45.0, margin=0.66, lead_time_days=5
            )
        }
        self.financials = FinancialState(
            total_budget=50000.0, used_budget=1200.0, fiscal_year_margin_avg=0.25
        )
        self._save_state()

    def _save_state(self):
        data = {
            "inventory": {k: v.model_dump(mode='json') for k, v in self.inventory.items()},
            "financials": self.financials.model_dump(mode='json')
        }
        with open(STATE_FILE, 'w') as f:
            json.dump(data, f, indent=2)

    def _simulate_market_dynamics(self):
        """
        Hace que el ERP se sienta 'vivo'. Se llama antes de leer datos.
        1. Ventas orgánicas (stock baja levemente al azar).
        2. Fluctuación de costos (margen cambia).
        """
        for sku, product in self.inventory.items():
            # 10% de probabilidad de venta orgánica al consultar
            if random.random() < 0.10 and product.qty > 0:
                decay = random.randint(1, 3)
                product.qty = max(0, product.qty - decay)
            
            # Fluctuación de margen (costo de proveedor cambia +/- 1%)
            if random.random() < 0.05:
                variation = random.uniform(0.99, 1.01)
                product.cost *= variation
                # Recalcular margen: (Precio - Costo) / Precio
                product.margin = (product.price - product.cost) / product.price
        
        self._save_state()

    def get_product(self, sku: str) -> ProductState:
        self._simulate_market_dynamics() # El tiempo avanza
        return self.inventory.get(sku)

    def get_financials(self) -> FinancialState:
        self._simulate_market_dynamics()
        return self.financials

    def process_transaction(self, transaction: TransactionRequest) -> bool:
        """Procesa una venta real del Actuador (B7)"""
        if transaction.sku not in self.inventory:
            return False
        
        prod = self.inventory[transaction.sku]
        
        if prod.qty < transaction.qty_sold:
            return False # No hay stock suficiente
        
        # Actualizar Stock
        prod.qty -= transaction.qty_sold
        
        # Actualizar Finanzas (Revenue ficticio aumenta presupuesto disponible o reduce deuda)
        # Simplificación para simulación:
        revenue = transaction.qty_sold * transaction.sale_price
        # self.financials.total_budget += (revenue * 0.10) # 10% reinversión
        
        self._save_state()
        return True

    # --- Métodos para Scenario Trigger (11.3) ---
    def force_stock_update(self, sku: str, qty: int):
        if sku in self.inventory:
            self.inventory[sku].qty = qty
            self._save_state()

    def force_margin_crash(self, sku: str):
        if sku in self.inventory:
            self.inventory[sku].cost = self.inventory[sku].price * 0.98 # 2% margen
            self.inventory[sku].margin = 0.02
            self._save_state()