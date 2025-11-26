import requests
import logging
from typing import Dict, Any

logger = logging.getLogger("EnterpriseConnector")

class RemoteEnterpriseConnector:
    """
    Cliente HTTP para comunicarse con el Microservicio Enterprise (Bloque 11).
    Simula la conexión a un SAP/Salesforce/ERP real.
    """
    def __init__(self, base_url="http://localhost:8011"):
        self.base_url = base_url

    def get_product_data(self, sku: str) -> Dict[str, Any]:
        """
        Consulta el inventario y margen en tiempo real.
        Retorna un diccionario seguro (con valores por defecto si falla).
        """
        if not sku:
            return {"stock_quantity": 0, "margin": 0.0, "error": "No SKU provided"}

        try:
            # Endpoint del simulador Enterprise
            url = f"{self.base_url}/enterprise/inventory/{sku}"
            response = requests.get(url, timeout=3)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "sku": data.get("sku"),
                    "stock_quantity": data.get("qty", 0),
                    "margin": data.get("margin", 0.0),
                    "name": data.get("name", "Unknown Product")
                }
            elif response.status_code == 404:
                logger.warning(f"SKU {sku} no encontrado en ERP.")
                return {"stock_quantity": 0, "margin": 0.0}
            else:
                logger.error(f"Error ERP {response.status_code}: {response.text}")
                return {"stock_quantity": 0, "margin": 0.0}
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Fallo de conexión con ERP (B11): {e}")
            # En caso de fallo de red, asumimos stock 0 para evitar ventas sin inventario (Fail-Safe)
            return {"stock_quantity": 0, "margin": 0.0}