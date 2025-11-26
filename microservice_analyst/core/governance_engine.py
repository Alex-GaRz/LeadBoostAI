from typing import Dict, Any, List
import logging
import datetime
from .audit_publisher import AuditPublisher
from .enterprise_interface import RemoteEnterpriseConnector
from microservice_analyst.models.schemas import GovernanceStatus

logger = logging.getLogger("GovernanceEngine")

class GovernanceEngine:
    def __init__(self):
        self.auditor = AuditPublisher()
        self.erp = RemoteEnterpriseConnector() 
        
        # Políticas Configurables
        self.policies = {
            "max_daily_budget": 5000.0,
            "min_stock_level": 10,     # Unidades mínimas para activar campaña
            "min_roas_threshold": 1.5, # ROAS mínimo aceptable para escalar
            "prohibited_keywords": ["scam", "fraud", "crisis", "panic", "leak", "free money"]
        }

    def evaluate_proposal(self, proposal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evalúa una propuesta de acción contra reglas duras de negocio.
        """
        checks: List[Dict[str, Any]] = []
        status = GovernanceStatus.APPROVED
        rejection_reason = None
        
        # 1. Normalización de Datos
        # Extraemos parámetros clave. Si viene de Pydantic, ya debería ser dict aquí, pero aseguramos.
        raw_data = proposal_data if isinstance(proposal_data, dict) else proposal_data.model_dump()
        params = raw_data.get("parameters", {})
        context = raw_data.get("governance_metadata", {}) # Datos extra pasados por el StrategyEngine
        
        sku = params.get("sku")
        budget = float(params.get("budget", 0.0))
        keywords = params.get("keywords", [])
        strategy_name = raw_data.get("reasoning", "Unknown Strategy")

        logger.info(f"🛡️ GOBERNANZA: Evaluando '{strategy_name}' | Budget: ${budget} | SKU: {sku}")

        # --- REGLA 1: PREVISIÓN FINANCIERA (ROAS CHECK) ---
        # Si el ROAS reciente es malo, limitamos severamente el presupuesto o pedimos HITL.
        recent_roas = context.get("recent_roas", 2.0) # Default a 2.0 si no hay datos (optimista para arranque)
        
        if recent_roas < 1.0:
            # Estamos perdiendo dinero: Rechazar aumentos de presupuesto automático
            if budget > 100: # Permitir micro-tests, bloquear grandes gastos
                status = GovernanceStatus.HITL_REQUIRED
                rejection_reason = f"ROAS Crítico ({recent_roas}). Se requiere aprobación humana para presupuestos > $100."
                checks.append({"check": "roas_financial_safety", "passed": False, "detail": f"ROAS {recent_roas}"})
            else:
                checks.append({"check": "roas_financial_safety", "passed": True, "detail": "Budget bajo permitido pese a bajo ROAS"})
        elif recent_roas < self.policies["min_roas_threshold"]:
            # ROAS mediocre: Alerta pero permite
            checks.append({"check": "roas_financial_safety", "passed": True, "detail": f"ROAS {recent_roas} (Warning)"})
        else:
             checks.append({"check": "roas_financial_safety", "passed": True, "detail": "ROAS Saludable"})

        # --- REGLA 2: LÍMITE PRESUPUESTARIO ---
        if status == GovernanceStatus.APPROVED:
            if budget > self.policies["max_daily_budget"]:
                status = GovernanceStatus.HITL_REQUIRED # No rechazamos, pero pedimos firma humana
                rejection_reason = f"Presupuesto ${budget} excede el límite automático de ${self.policies['max_daily_budget']}"
                checks.append({"check": "budget_policy", "passed": False})
            else:
                checks.append({"check": "budget_policy", "passed": True})

        # --- REGLA 3: BRAND SAFETY ---
        if status == GovernanceStatus.APPROVED and keywords:
            for kw in keywords:
                if kw.lower() in self.policies["prohibited_keywords"]:
                    status = GovernanceStatus.REJECTED
                    rejection_reason = f"Palabra clave prohibida detectada: '{kw}'"
                    checks.append({"check": "brand_safety", "passed": False})
                    break

        # --- REGLA 4: INVENTARIO FÍSICO (ERP) ---
        # Solo relevante si hay un SKU asociado a la campaña
        if sku and status != GovernanceStatus.REJECTED:
            product_info = self.erp.get_product_data(sku)
            stock = product_info.get("stock_quantity", 0)
            
            if stock < self.policies["min_stock_level"]:
                status = GovernanceStatus.REJECTED
                rejection_reason = f"Stock insuficiente ({stock} u.) para lanzar campaña. Mínimo requerido: {self.policies['min_stock_level']}"
                checks.append({"check": "inventory_validation", "passed": False, "detail": f"Stock Real: {stock}"})
            else:
                checks.append({"check": "inventory_validation", "passed": True, "detail": f"Stock OK: {stock}"})

        # 3. Construcción del Resultado
        result = raw_data.copy()
        result["governance_status"] = status
        result["block_reason"] = rejection_reason
        result["policy_checks"] = checks
        result["timestamp"] = str(datetime.datetime.now())

        # 4. Auditoría (Log inmutable)
        self.auditor.log_governance_decision(
            strategy_name=strategy_name,
            context={"sku": sku, "roas_used": recent_roas, "budget": budget},
            governance_result={"status": status, "checks": checks}
        )
        
        return result