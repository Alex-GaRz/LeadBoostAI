import os
import json
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv
from openai import OpenAI
from microservice_analyst.models.schemas import ActionProposal, DebateEntry, ActionType, UrgencyLevel, MarketSignal

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StrategyEngine")

class StrategyEngine:
    """
    Motor de Decisión 'La Mesa Redonda'.
    Implementa Chain of Thought (CoT) multi-perspectiva para simular un comité ejecutivo.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ OPENAI_API_KEY no encontrada. El motor no funcionará correctamente.")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4-turbo-preview" 

    def _call_agent(self, system_prompt: str, user_content: str, json_mode: bool = False) -> str:
        """Helper para llamar a OpenAI"""
        if not self.api_key:
            return "Error: No API Key"
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                temperature=0.7,
                response_format={"type": "json_object"} if json_mode else {"type": "text"}
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error calling OpenAI Agent: {e}")
            return "{}" if json_mode else "Error generating response"

    async def generate_strategy(self, signal: MarketSignal, context: Dict[str, Any]) -> ActionProposal:
        """
        Orquesta la Mesa Redonda Virtual: CMO -> CFO -> CEO.
        """
        logger.info(f"🧠 Iniciando proceso cognitivo para señal: {signal.source}")
        debate_log: List[DebateEntry] = []
        
        # Datos de contexto para los agentes
        budget_avail = context.get('budget_available', '5000')
        roas_metric = context.get('recent_roas', 1.8) # Default sano
        active_campaigns = context.get('active_campaigns_count', 0)
        
        context_str = f"""
        [DATOS DE MERCADO]
        Fuente: {signal.source}
        Contenido: "{signal.content}"
        Sentimiento: {signal.sentiment_score}
        
        [ESTADO INTERNO EMPRESA]
        Presupuesto Disponible: ${budget_avail}
        ROAS Reciente: {roas_metric}x
        Campañas Activas: {active_campaigns}
        """

        # --- PASO 1: EL AGENTE CMO (CREATIVIDAD & CRECIMIENTO) ---
        cmo_prompt = """
        ERES: El CMO (Chief Marketing Officer). Tu único objetivo es CRECER.
        MENTALIDAD: Oportunista, creativo, agresivo. Ignora restricciones presupuestarias por ahora.
        
        TAREA:
        Lee la señal de mercado y propón una acción de marketing concreta para capturar leads.
        Define: 
        1. El 'Gancho' (Hook) para el anuncio.
        2. La audiencia objetivo.
        3. El canal sugerido (Twitter, LinkedIn, Google Ads).
        
        Sé breve y directo. Vende tu idea.
        """
        cmo_response = self._call_agent(cmo_prompt, context_str)
        debate_log.append(DebateEntry(agent_role="CMO (Growth)", content=cmo_response))
        logger.info("🗣️ CMO ha hablado.")

        # --- PASO 2: EL AGENTE CFO (RIESGO & FINANZAS) ---
        cfo_prompt = f"""
        ERES: El CFO (Chief Financial Officer). Tu trabajo es PROTEGER EL DINERO y evitar riesgos legales.
        MENTALIDAD: Escéptico, conservador, analítico.
        
        CONTEXTO FINANCIERO:
        ROAS actual de la empresa: {roas_metric}. (Si es < 1.0, sé extremadamente duro).
        
        TAREA:
        Critica la propuesta del CMO.
        1. ¿Es un gasto justificable dado el ROAS actual?
        2. ¿Hay riesgos de marca o legales en el copy sugerido?
        3. ¿Qué presupuesto máximo autorizarías?
        
        PROPUESTA DEL CMO:
        "{cmo_response}"
        """
        cfo_response = self._call_agent(cfo_prompt, context_str)
        debate_log.append(DebateEntry(agent_role="CFO (Risk)", content=cfo_response))
        logger.info("🗣️ CFO ha hablado.")

        # --- PASO 3: EL AGENTE CEO (DECISIÓN FINAL & SÍNTESIS) ---
        ceo_prompt = """
        ERES: El CEO de LeadBoostAI. Tienes la última palabra.
        TAREA: Escucha a tu equipo y emite una ORDEN JSON EJECUTABLE.
        
        INSTRUCCIONES:
        - Si el CFO detecta riesgos graves, tu acción debe ser DO_NOTHING o NOTIFY_HUMAN.
        - Si la oportunidad vale la pena, emite CREATE_CAMPAIGN con parámetros ajustados.
        - Define un 'confidence_score' basado en la claridad de la señal.
        
        FORMATO JSON REQUERIDO:
        {
            "action_type": "CREATE_CAMPAIGN | PAUSE_CAMPAIGN | DO_NOTHING | NOTIFY_HUMAN",
            "reasoning": "Resumen ejecutivo de 1 frase explicando la decisión.",
            "parameters": {
                "budget": float,
                "sku": "string (si aplica, o null)",
                "keywords": ["list", "of", "keywords"],
                "target_audience": "string",
                "ad_copy_draft": "string"
            },
            "confidence_score": float (0.0 a 1.0),
            "urgency": "LOW | MEDIUM | HIGH | CRITICAL"
        }
        """
        ceo_input = f"""
        {context_str}
        
        --- DEBATE EJECUTIVO ---
        [CMO - Propuesta]: {cmo_response}
        [CFO - Análisis]: {cfo_response}
        """
        
        raw_decision = self._call_agent(ceo_prompt, ceo_input, json_mode=True)
        logger.info("🗣️ CEO ha decidido.")
        
        # --- PARSING Y RETORNO ---
        return self._parse_ceo_decision(raw_decision, debate_log, context)

    def _parse_ceo_decision(self, raw_json: str, transcript: List[DebateEntry], context: Dict[str, Any]) -> ActionProposal:
        try:
            data = json.loads(raw_json)
            
            # Construir propuesta
            proposal = ActionProposal(
                action_type=data.get("action_type", "NOTIFY_HUMAN"),
                reasoning=data.get("reasoning", "Decisión manual requerida por error de formato"),
                parameters=data.get("parameters", {}),
                confidence_score=data.get("confidence_score", 0.0),
                urgency=data.get("urgency", "MEDIUM"),
                debate_transcript=transcript,
                governance_metadata={"recent_roas": context.get("recent_roas", 0)} # Pasar contexto a gobernanza
            )
            return proposal

        except json.JSONDecodeError:
            logger.error(f"Fallo crítico parseando JSON del CEO: {raw_json}")
            return ActionProposal(
                action_type=ActionType.NOTIFY_HUMAN,
                reasoning="Error interno del sistema neural (JSON Malformed)",
                parameters={},
                confidence_score=0.0,
                urgency=UrgencyLevel.HIGH,
                debate_transcript=transcript
            )

strategy_engine = StrategyEngine()