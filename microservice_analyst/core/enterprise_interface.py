from abc import ABC, abstractmethod
from typing import Dict, Any
import random
import requests  # <--- NECESARIO
from datetime import datetime

class IEnterpriseConnector(ABC):
    @abstractmethod
    def get_product_data(self, sku: str) -> Dict[str, Any]:
        pass

# --- OPCIÓN A: MOCK (Para pruebas unitarias sin B11) ---
class MockEnterpriseConnector(IEnterpriseConnector):
    def get_product_data(self, sku: str) -> Dict[str, Any]:
        return {
            "sku": sku, 
            "stock_quantity": 100, 
            "margin_percent": 0.30,
            "is_active": True
        }

# --- OPCIÓN B: REAL (Para conectar con B11) ---
class RemoteEnterpriseConnector(IEnterpriseConnector):
    """
    Conector que consulta al Microservicio Enterprise (Bloque 11).
    """
    def __init__(self, base_url="http://localhost:8011/enterprise"):
        self.base_url = base_url

    def get_product_data(self, sku: str) -> Dict[str, Any]:
        try:
            print(f"📡 Consultando ERP (B11) para SKU: {sku}...")
            response = requests.get(f"{self.base_url}/inventory/{sku}", timeout=2)
            
            if response.status_code == 200:
                data = response.json()
                # Mapeamos la respuesta del B11 al formato que espera el B6
                return {
                    "sku": data["sku"],
                    "stock_quantity": data["qty"],  # B11 devuelve 'qty', B6 usa 'stock_quantity'
                    "margin_percent": data["margin"],
                    "is_active": True
                }
            else:
                print(f"⚠️ SKU no encontrado en ERP: {sku}")
                return {"stock_quantity": 0, "is_active": False}
                
        except Exception as e:
            print(f"❌ Error de conexión con ERP: {e}")
            return {"stock_quantity": 0, "is_active": False, "error": str(e)}