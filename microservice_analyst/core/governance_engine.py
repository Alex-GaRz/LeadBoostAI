from typing import Dict, Any
import logging
import datetime
# Importamos el publisher que creaste
from .audit_publisher import AuditPublisher

logger = logging.getLogger("GovernanceEngine")

class GovernanceEngine:
    def __init__(self):
        # Inicializamos el auditor que habla con el Bloque 10
        self.auditor = AuditPublisher()
        
        # Políticas "Hardcoded" para simulación Enterprise
        # En el futuro esto vendrá de una base de datos de reglas
        self.policies = {
            "max_budget": 5000,
            "min_stock": 10,
            "prohibited_keywords": ["scam", "fraud", "crisis", "panic", "leak"]
        }

    def evaluate_proposal(self, proposal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evalúa una propuesta (diccionario) y reporta el veredicto a Memoria (Bloque 10).
        """
        checks = []
        approved = True
        rejection_reason = None

        # 1. Extracción segura de datos (usando .get para evitar KeyErrors)
        # Si viene un objeto complejo, intentamos convertirlo a dict, si no, usamos el dict directo
        data = proposal_data if isinstance(proposal_data, dict) else proposal_data.__dict__
        
        budget = data.get("budget", 0)
        keywords = data.get("keywords", [])
        strategy_name = data.get("strategy_name", "UNKNOWN_STRATEGY")

        # 2. Validación de Reglas
        
        # REGLA A: Límite de Presupuesto
        if budget > self.policies["max_budget"]:
            approved = False
            rejection_reason = f"Budget {budget} exceeds limit of {self.policies['max_budget']}"
            checks.append({"check": "budget_policy", "passed": False})
        else:
            checks.append({"check": "budget_policy", "passed": True})

        # REGLA B: Brand Safety (Palabras prohibidas)
        for kw in keywords:
            # Normalizamos a minúsculas para comparar
            if isinstance(kw, str) and kw.lower() in self.policies["prohibited_keywords"]:
                approved = False
                rejection_reason = f"Keyword '{kw}' is prohibited by policy"
                checks.append({"check": "brand_safety", "passed": False, "detail": kw})
                break

        # 3. Construcción del Resultado
        result = {
            "approved": approved,
            "rejection_reason": rejection_reason,
            "policy_checks": checks,
            "timestamp": str(datetime.datetime.now())
        }

        # 4. --- INTEGRACIÓN CRÍTICA CON MEMORIA (B10) ---
        # Aquí es donde el "Chivato" le cuenta al cerebro lo que pasó
        try:
            logger.info(f"📢 Reportando decisión de gobernanza para: {strategy_name}")
            self.auditor.log_governance_decision(
                strategy_name=strategy_name,
                context={"trigger": "automated_evaluation_b6"},
                governance_result=result
            )
        except Exception as e:
            logger.error(f"⚠️ Error no bloqueante al reportar a memoria: {e}")

        return result