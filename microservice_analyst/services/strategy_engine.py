import json
import requests
from fastapi import HTTPException
from microservice_analyst.models.schemas import CriticalAlert, ActionProposal
from microservice_analyst.core.config import BACKEND_URL


import logging
from microservice_analyst.core.optimizer_interface import GlobalOptimizerClient
from microservice_analyst.services.context_builder import ContextBuilder

logger = logging.getLogger("StrategyEngine")

class StrategyEngine:
    def __init__(self):
        self.context_builder = ContextBuilder()
        self.optimizer = GlobalOptimizerClient()

    def evaluate_opportunity(self, opportunity_name: str) -> dict:
        """
        Flujo Maestro de Decisión:
        1. Recolectar Datos (B10 + B11)
        2. Consultar Oráculo (B12)
        3. Emitir Orden (B6)
        """
        logger.info(f"🔍 Evaluando oportunidad: {opportunity_name}")

        # PASO 1: Construir la "Foto" de la empresa hoy
        full_context = self.context_builder.build_global_context()
        
        # Validar si tenemos datos suficientes
        if not full_context["inventory_snapshot"]:
            logger.error("❌ No hay datos de inventario. Abortando optimización.")
            return {"status": "ABORTED", "reason": "MISSING_INVENTORY_DATA"}

        # PASO 2: Consultar al B12
        # (B12 internamente correrá Monte Carlo y guardará el log en B10)
        optimization_result = self.optimizer.get_optimal_strategy(
            financial_status=full_context["financial_status"],
            inventory_snapshot=full_context["inventory_snapshot"],
            history=full_context["historical_performance"]
        )

        if not optimization_result:
            return {"status": "ERROR", "reason": "OPTIMIZER_UNAVAILABLE"}

        # PASO 3: Interpretar y Ejecutar
        action = optimization_result['recommended_action_type']
        roi = optimization_result['projected_roi']
        
        decision_packet = {
            "strategy_id": f"STRAT-{opportunity_name.upper()}",
            "action": action,
            "confidence": 0.95 if action != "NO_ACTION" else 0.0,
            "reasoning": optimization_result['justification'],
            "financial_impact": {
                "roi_projected": roi,
                "pricing_change": optimization_result.get('pricing_adjustment', 0.0)
            },
            "operational_impact": {
                "logistics_alert": optimization_result.get('logistics_change')
            }
        }

        logger.info(f"✅ Decisión Final B6: {action} | ROI: {roi:.2%}")
        return decision_packet