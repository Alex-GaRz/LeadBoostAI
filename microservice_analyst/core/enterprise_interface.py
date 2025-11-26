import requests
import logging

logger = logging.getLogger("EnterpriseConnector")

class RemoteEnterpriseConnector:
    def __init__(self, base_url="http://localhost:8011"):
        self.base_url = base_url

    def get_product_data(self, sku: str) -> dict:
        """
        Consulta el inventario real al Bloque 11 (ERP Simulator)
        """
        try:
            response = requests.get(f"{self.base_url}/enterprise/inventory/{sku}", timeout=2)
            if response.status_code == 200:
                data = response.json()
                # Normalizar respuesta para el Governance Engine
                return {
                    "sku": data.get("sku"),
                    "stock_quantity": data.get("qty", 0),
                    "margin": data.get("margin", 0.0)
                }
            else:
                logger.warning(f"ERP devolvió status {response.status_code}")
                return {"stock_quantity": 0} # Fail-safe: Asumir 0 si falla
        except Exception as e:
            logger.error(f"Error conectando a ERP: {e}")
            return {"stock_quantity": 0} # Fail-safe