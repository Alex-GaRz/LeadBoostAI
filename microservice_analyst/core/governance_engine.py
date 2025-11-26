from typing import Dict, Any
import logging
import datetime
from .audit_publisher import AuditPublisher
# IMPORTANTE: Importar el conector
from .enterprise_interface import RemoteEnterpriseConnector

logger = logging.getLogger("GovernanceEngine")

class GovernanceEngine:
    def __init__(self):
        self.auditor = AuditPublisher()
        
        # --- CONEXIÓN AL ERP (BLOQUE 11) ---
        self.erp = RemoteEnterpriseConnector() 
        
        self.policies = {
            "max_budget": 5000,
            "min_stock": 10,
            "min_margin": 0.15, # 15% margen mínimo
            "prohibited_keywords": ["scam", "fraud", "crisis", "panic", "leak"]
        }

    def evaluate_proposal(self, proposal_data: Dict[str, Any]) -> Dict[str, Any]:
        checks = []
        approved = True
        rejection_reason = None
        
        # 1. Extracción de Datos (Compatible con Pydantic y Dict)
        # Si es objeto Pydantic, lo convertimos a dict
        raw_data = proposal_data if isinstance(proposal_data, dict) else proposal_data.model_dump()
        
        # IMPORTANTE: Los datos vienen dentro de 'parameters' según tu schema
        params = raw_data.get("parameters", {})
        
        sku = params.get("sku")
        budget = float(params.get("budget", 0))
        keywords = params.get("keywords", [])
        strategy_name = raw_data.get("reasoning", "Unknown Strategy") # Usamos reasoning como nombre temporal

        logger.info(f"🔍 Evaluando propuesta para SKU: {sku} | Budget: {budget}")

        # 2. Validación de Reglas

        # --- REGLA 1: Límite de Presupuesto ---
        if budget > self.policies["max_budget"]:
            approved = False
            rejection_reason = f"Budget {budget} exceeds limit of {self.policies['max_budget']}"
            checks.append({"check": "budget_policy", "passed": False})
        else:
            checks.append({"check": "budget_policy", "passed": True})

        # --- REGLA 2: Brand Safety ---
        if keywords:
            for kw in keywords:
                if kw.lower() in self.policies["prohibited_keywords"]:
                    approved = False
                    rejection_reason = f"Keyword '{kw}' is prohibited"
                    checks.append({"check": "brand_safety", "passed": False})
                    break

        # --- REGLA 3: INVENTARIO REAL (Consulta al ERP) ---
        # Solo verificamos stock si la acción es de Marketing y tenemos SKU
        if sku and approved: # Fail-fast: si ya falló presupuesto, no molestamos al ERP
            product_info = self.erp.get_product_data(sku)
            stock = product_info.get("stock_quantity", 0)
            
            if stock < self.policies["min_stock"]:
                approved = False
                rejection_reason = f"CRÍTICO: Stock insuficiente ({stock} u.) para campaña. Mínimo requerido: {self.policies['min_stock']}"
                checks.append({
                    "check": "inventory_validation", 
                    "passed": False, 
                    "detail": f"Stock: {stock}"
                })
            else:
                checks.append({
                    "check": "inventory_validation", 
                    "passed": True, 
                    "detail": f"Stock: {stock}"
                })

        # 3. Construcción del Resultado
        result = raw_data.copy() # Copiamos la entrada para devolverla enriquecida
        result["governance_status"] = "APPROVED" if approved else "REJECTED"
        result["block_reason"] = rejection_reason
        result["policy_checks"] = checks
        result["timestamp"] = str(datetime.datetime.now())

        # 4. Reportar al 'Chivato' (Bloque 10)
        try:
            self.auditor.log_governance_decision(
                strategy_name=strategy_name,
                context={"trigger": "automated_evaluation_b6", "sku": sku},
                governance_result={"approved": approved, "checks": checks}
            )
        except Exception as e:
            logger.error(f"⚠️ Error reportando a B10: {e}")

        # 5. HOOK PARA LA DEMO (Reportar alerta visual)
        if not approved and hasattr(self, 'report_callback'):
            self.report_callback({
                "id": f"GOV-BLOCK-{datetime.datetime.now().timestamp()}",
                "type": "CAMPAIGN_BLOCKED",
                "severity": "CRITICAL",
                "message": f"🛡️ GOBERNANZA BLOQUEÓ ACCIÓN: {rejection_reason}",
                "timestamp": str(datetime.datetime.now())
            })   
        return result