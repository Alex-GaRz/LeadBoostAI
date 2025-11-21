import requests
import logging
from typing import Dict, List

# Configuración de endpoints externos
B11_ENTERPRISE_URL = "http://localhost:8011/enterprise" # Asumiendo puerto 8011 para B11
B10_MEMORY_URL = "http://localhost:8010/memory"

logger = logging.getLogger("B6_ContextBuilder")

class ContextBuilder:
    """
    Agrega datos dispersos de la empresa (B11) y la historia (B10) 
    para alimentar al Optimizador (B12).
    """

    def build_global_context(self) -> Dict:
        """
        Orquesta la recolección de datos y retorna un dict compatible con OptimizationContext.
        """
        logger.info("🏗️ Construyendo contexto global para optimización...")
        
        # 1. Obtener Estado Financiero (B11)
        finances = self._fetch_financials()
        
        # 2. Obtener Inventario Completo (B11)
        inventory = self._fetch_inventory()
        
        # 3. Obtener Historia Reciente (B10)
        history = self._fetch_history()

        return {
            "financial_status": finances,
            "inventory_snapshot": inventory,
            "historical_performance": history,
            "current_strategy_id": "STRAT-AUTO-GEN"
        }

    def _fetch_financials(self) -> Dict:
        try:
            # Endpoint hipotético de B11 (debes asegurarte que B11 lo tenga o usar el mock)
            resp = requests.get(f"{B11_ENTERPRISE_URL}/financials", timeout=2)
            if resp.status_code == 200:
                return resp.json()
        except Exception as e:
            logger.warning(f"⚠️ B11 Financials Offline: {e}")
        
        # Fallback por defecto
        return {"total_budget": 10000, "used_budget": 0, "fiscal_year_margin_avg": 0.20}

    def _fetch_inventory(self) -> List[Dict]:
        # En un caso real, iteraríamos SKUs o pediríamos un "dump" completo
        # Aquí simulamos pedir un producto clave para el ejemplo
        try:
            # Endpoint existente en B11: /enterprise/inventory/{sku}
            skus_to_check = ["PROD-001", "LAPTOP-X1"] 
            items = []
            for sku in skus_to_check:
                resp = requests.get(f"{B11_ENTERPRISE_URL}/inventory/{sku}", timeout=1)
                if resp.status_code == 200:
                    data = resp.json()
                    # Adaptar formato B11 -> B12 si es necesario
                    items.append({
                        "sku": data.get("sku"),
                        "qty": data.get("qty"),
                        "cost": data.get("cost", 0.0),
                        "margin": data.get("margin", 0.0),
                        "lead_time_days": data.get("lead_time_days", 7)
                    })
            return items
        except Exception as e:
            logger.warning(f"⚠️ B11 Inventory Offline: {e}")
            return []

    def _fetch_history(self) -> List[Dict]:
        try:
            # Endpoint existente en B10: /memory/history
            resp = requests.get(f"{B10_MEMORY_URL}/history?limit=10", timeout=2)
            if resp.status_code == 200:
                # Mapear respuesta B10 a lo que espera B12
                raw_history = resp.json()
                clean_history = []
                for h in raw_history:
                    clean_history.append({
                        "trace_id": h.get("trace_id", "unknown"),
                        "timestamp": h.get("timestamp"),
                        "action_type": h.get("action", "unknown"),
                        "outcome_metric": h.get("score") or 0.5,
                        "status": h.get("status", "UNKNOWN")
                    })
                return clean_history
        except Exception as e:
            logger.warning(f"⚠️ B10 History Offline: {e}")
        return []
