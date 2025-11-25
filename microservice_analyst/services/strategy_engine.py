import os
import json
import logging
from typing import List, Dict, Any, Optional
from openai import OpenAI
from microservice_analyst.models.schemas import ActionProposal, DebateEntry, ActionType, UrgencyLevel, MarketSignal
# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("StrategyEngine")

class StrategyEngine:
    """
    Motor de Decisión 'La Mesa Redonda'.
    Implementa Chain of Thought (CoT) multi-perspectiva.
    """

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            logger.warning("⚠️ OPENAI_API_KEY no encontrada. El motor funcionará en modo degradado.")
        
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4-turbo-preview" 

    def _call_agent(self, system_prompt: str, user_content: str, json_mode: bool = False) -> str:
        if not self.api_key:
            return ""
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
            return ""

    async def generate_strategy(self, signal: MarketSignal, context: Dict[str, Any]) -> ActionProposal:
        """
        Ejecuta la Mesa Redonda Virtual.
        """
        logger.info(f"🧠 Iniciando proceso cognitivo para señal: {signal.source}")
        debate_log: List[DebateEntry] = []
        
        # Contexto base enriquecido
        context_str = f"""
        [DATOS DE ENTRADA]
        Fuente: {signal.source}
        Señal Cruda: "{signal.content}"
        Score Sentimiento: {signal.sentiment_score}
        
        [ESTADO DE LA EMPRESA]
        Presupuesto Disponible: {context.get('budget_available', 'Unknown')}
        Campañas Activas: {context.get('active_campaigns_count', 0)}
        """

        # --- PASO 1: AGENTE CRECIMIENTO (CMO) ---
        cmo_prompt = """
        ACTÚA COMO: CMO (Chief Marketing Officer) de clase mundial.
        MENTALIDAD: Agresivo, Experimental, Growth Hacking.
        OBJETIVO: Detectar cómo explotar esta señal para obtener leads YA.
        
        TAREA:
        Propón una "Micro-Campaña" táctica. Ignora los riesgos. Enfócate en la viralidad y conversión.
        Define: Hook (Gancho), Oferta y Canal.
        """
        cmo_response = self._call_agent(cmo_prompt, context_str)
        debate_log.append(DebateEntry(agent_role="CMO (Growth)", content=cmo_response))

        # --- PASO 2: AGENTE RIESGO (CFO) ---
        cfo_prompt = """
        ACTÚA COMO: CFO (Chief Financial Officer) y Oficial de Compliance.
        MENTALIDAD: Conservador, Averso al riesgo, Protector del ROI.
        OBJETIVO: Destruir la propuesta del CMO si es peligrosa o ineficiente.
        
        TAREA:
        Analiza la propuesta del CMO.
        1. ¿Es rentable?
        2. ¿Daña la marca?
        3. ¿Es legal/ético?
        Si es viable, dalo por bueno. Si no, propón recortes drásticos.
        """
        cfo_input = f"{context_str}\n\n[PROPUESTA CMO]: {cmo_response}"
        cfo_response = self._call_agent(cfo_prompt, cfo_input)
        debate_log.append(DebateEntry(agent_role="CFO (Risk)", content=cfo_response))

        # --- PASO 3: CEO (SÍNTESIS) ---
        ceo_prompt = """
        ACTÚA COMO: CEO de LeadBoostAI.
        TAREA: Sintetizar el debate y emitir una ORDEN DE EJECUCIÓN estructurada.
        
        INPUTS:
        - Oportunidad (CMO)
        - Riesgos (CFO)
        
        DECISIÓN:
        Balancea el riesgo/recompensa.
        
        FORMATO DE SALIDA (JSON PURO):
        {
            "action_type": "CREATE_CAMPAIGN | MODIFY_BUDGET | DO_NOTHING",
            "reasoning": "Explicación ejecutiva de 1 oración.",
            "parameters": {
                "budget_cap": float,
                "target_audience": string,
                "ad_tone": string,
                "platform_focus": string
            },
            "confidence_score": float (0-1),
            "urgency": "HIGH | MEDIUM | LOW"
        }
        """
        ceo_input = f"{context_str}\n\n[DEBATE]\nCMO: {cmo_response}\nCFO: {cfo_response}"
        
        raw_decision = self._call_agent(ceo_prompt, ceo_input, json_mode=True)
        
        # --- PARSING Y RETORNO ---
        return self._parse_ceo_decision(raw_decision, debate_log)

    def _parse_ceo_decision(self, raw_json: str, transcript: List[DebateEntry]) -> ActionProposal:
        try:
            data = json.loads(raw_json)
            return ActionProposal(
                action_type=data.get("action_type", "NOTIFY_HUMAN"),
                reasoning=data.get("reasoning", "Decisión manual requerida"),
                parameters=data.get("parameters", {}),
                confidence_score=data.get("confidence_score", 0.0),
                urgency=data.get("urgency", "MEDIUM"),
                debate_transcript=transcript
            )
        except Exception:
            return ActionProposal(
                action_type=ActionType.NOTIFY_HUMAN,
                reasoning="Fallo en síntesis neural (JSON Error)",
                parameters={},
                confidence_score=0.0,
                urgency=UrgencyLevel.HIGH,
                debate_transcript=transcript
            )

strategy_engine = StrategyEngine()