import time
import random
import logging
from typing import Dict, Any
from interfaces.handler_interface import IActionHandler
from models.schemas import ActionProposal, ExecutionResult, ActionStatus

# Configuración de logger
logger = logging.getLogger("MarketingHandler")

class MarketingHandler(IActionHandler):
    
    def execute(self, proposal: ActionProposal) -> ExecutionResult:
        logger.info(f"📢 Iniciando ejecución de campaña para propuesta: {proposal.proposal_id}")
        
        try:
            # 1. Action Schema Mapper (7.4): Traducir conceptos abstractos a técnicos
            target_audience = self._map_audience_segment(proposal.parameters.get("target_segment"))
            
            # 2. Generación Creativa (Simulación AI)
            ad_copy = self._generate_creative_copy(proposal.reasoning, proposal.parameters)
            
            # 3. Selección de Plataforma y Ejecución (Simulación API)
            platform = proposal.parameters.get("platform", "meta").lower()
            external_id = ""
            
            if platform == "meta":
                external_id = self._mock_post_to_meta(ad_copy, target_audience, proposal.parameters.get("budget", 100))
            elif platform == "google":
                external_id = self._mock_post_to_google(ad_copy, target_audience, proposal.parameters.get("budget", 100))
            else:
                raise ValueError(f"Plataforma no soportada: {platform}")

            # 4. Retorno de Éxito (7.5)
            return ExecutionResult(
                proposal_id=proposal.proposal_id,
                status=ActionStatus.EXECUTED,
                platform_response_id=external_id,
                execution_details={
                    "platform": platform,
                    "final_copy": ad_copy,
                    "targeting_used": target_audience,
                    "bid_strategy": "LOWEST_COST_CAP"
                }
            )

        except Exception as e:
            logger.error(f"❌ Error ejecutando campaña: {str(e)}")
            return ExecutionResult(
                proposal_id=proposal.proposal_id,
                status=ActionStatus.FAILED,
                error_message=str(e)
            )

    # --- 7.4 Action Schema Mapper ---
    def _map_audience_segment(self, segment_name: str) -> Dict[str, Any]:
        """Traduce lenguaje de negocio a parámetros de API"""
        logger.info(f"🗺️  Traduciendo segmento: '{segment_name}'")
        
        # En un sistema real, esto consultaría una base de datos de taxonomía
        mapping_rules = {
            "tech_executives": {
                "interests": ["Technology", "Management", "SaaS"],
                "job_titles": ["CTO", "VP Engineering"],
                "age_min": 30,
                "age_max": 55
            },
            "burnout_survivors": {
                "interests": ["Wellness", "Mental Health", "Productivity"],
                "behaviors": ["Late night activity"],
                "age_min": 25
            }
        }
        
        # Fallback genérico inteligente
        return mapping_rules.get(segment_name, {
            "interests": ["General Business"], 
            "optimization": "BROAD_MATCH"
        })

    # --- Generador Creativo Simulado ---
    def _generate_creative_copy(self, reasoning: str, params: Dict) -> str:
        """Simula una llamada a OpenAI para crear el copy"""
        # Aquí iría: client.chat.completions.create(...)
        logger.info("🎨 Generando copy publicitario basado en reasoning del Bloque 5...")
        product = params.get("product_name", "LeadBoost Solver")
        
        templates = [
            f"🚀 {product} es la solución. {reasoning}. ¡Prueba ahora!",
            f"¿Cansado de problemas? {reasoning}. {product} te ayuda.",
            f"Descubre el poder de {product}. Diseñado porque: {reasoning}"
        ]
        return random.choice(templates)

    # --- 7.3 Mock APIs ---
    def _mock_post_to_meta(self, copy: str, targeting: Dict, budget: float) -> str:
        logger.info(f"📡 [META API] Posting Ad: Budget=${budget} | Target={targeting.get('interests')}")
        time.sleep(0.5) # Simular latencia de red
        return f"act_{random.randint(100000, 999999)}_cam_{random.randint(10000, 99999)}"

    def _mock_post_to_google(self, copy: str, targeting: Dict, budget: float) -> str:
        logger.info(f"📡 [GOOGLE ADS API] Creating Campaign: Budget=${budget}")
        time.sleep(0.5)
        return f"aw_campaign_{random.randint(500000, 999999)}"