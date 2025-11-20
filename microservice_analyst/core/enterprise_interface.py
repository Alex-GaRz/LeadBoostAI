from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import random
from datetime import datetime

class IEnterpriseConnector(ABC):
    """
    Interfaz abstracta para conectar con sistemas ERP/CRM/WMS externos.
    Prepara el sistema para el Bloque 11 (Conexión Empresarial Real).
    """
    
    @abstractmethod
    def get_product_data(self, sku: str) -> Dict[str, Any]:
        """Retorna info de producto: stock, costo, margen, lead_time."""
        pass

    @abstractmethod
    def check_budget_availability(self, department: str, amount: float) -> bool:
        """Verifica si hay presupuesto disponible."""
        pass

class MockEnterpriseConnector(IEnterpriseConnector):
    """
    Implementación simulada que devuelve datos realistas y 'campos dormidos'
    para futura lógica logística compleja.
    """
    
    def get_product_data(self, sku: str) -> Dict[str, Any]:
        # Simulación determinista basada en el hash del SKU para consistencia en tests
        seed = sum(ord(c) for c in sku)
        random.seed(seed)
        
        stock_level = random.randint(0, 100)
        base_cost = random.uniform(10.0, 500.0)
        price = base_cost * random.uniform(1.1, 1.6) # Margen entre 10% y 60%
        margin_percent = ((price - base_cost) / price) * 100
        
        return {
            "sku": sku,
            "stock_quantity": stock_level,
            "cost_unit": round(base_cost, 2),
            "current_price": round(price, 2),
            "margin_percent": round(margin_percent, 2),
            
            # --- CAMPOS DORMIDOS (Logística Futura) ---
            "lead_time_days": random.randint(1, 45),      # Tiempo de reposición
            "supplier_risk_score": random.uniform(0, 1),  # Riesgo de proveedor
            "warehouse_location": "MEX-NTE-01",
            "last_restock": datetime.now().isoformat()
        }

    def check_budget_availability(self, department: str, amount: float) -> bool:
        # Simula que Marketing siempre tiene límite de $5000 USD por acción automática
        if department.lower() == "marketing":
            return amount <= 5000.0
        return True