import os
import json
import logging
from typing import List, Dict, Any
from openai import OpenAI
from models.schemas import ActionProposal, DebateEntry, ActionType, UrgencyLevel, MarketSignal
from core import config  # Ajuste aquí

# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StrategyEngine:
    """
    Motor de Decisión 'La Mesa Redonda'.
    Simula un debate entre CMO, CFO y CEO para tomar decisiones robustas.
    """

    def __init__(self):
        # Inicializar cliente OpenAI
        # Se asume que OPENAI_API_KEY está en variables de entorno
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4-turbo-preview" # O gpt-4o según disponibilidad/costo

    def _call_agent(self, system_prompt: str, user_content: str, json_mode: bool = False) -> str:
        """Helper para llamar a OpenAI con manejo de errores básico"""
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
            # Fallback básico en caso de error de API
            return ""

    async def generate_strategy_chain(self, signal: MarketSignal, context: Dict[str, Any]) -> ActionProposal:
        """
        Ejecuta la cadena de pensamiento secuencial:
        1. CMO (Expansión)
        2. CFO (Contención)
        3. CEO (Síntesis y Decisión JSON)
        """
        
        logger.info(f"Iniciando Mesa Redonda para señal: {signal.source}")
        debate_log: List[DebateEntry] = []
        
        # Preparar contexto stringificado para los prompts
        context_str = f"""
        SEÑAL DETECTADA:
        Fuente: {signal.source}
        Contenido: "{signal.content}"
        Sentimiento: {signal.sentiment_score}
        
        CONTEXTO DE NEGOCIO:
        {json.dumps(context, indent=2)}
        """

        # --- PASO 1: EL CMO (Chief Marketing Officer) ---
        # Objetivo: Maximizar oportunidad, ignorar riesgos.
        
        cmo_system_prompt = """
        Eres el CMO (Director de Marketing) agresivo y visionario de una startup de alto crecimiento.
        Tu personalidad es: Audaz, enfocado en viralidad, growth-hacking y captura de mercado.
        
        Tu Misión:
        Analiza la señal de mercado y propón una acción de marketing INMEDIATA y POTENTE.
        No te preocupes por el presupuesto ni los riesgos legales ahora mismo, céntrate en el impacto y la atención.
        
        Salida requerida: Un párrafo breve y persuasivo con tu propuesta táctica.
        """
        
        cmo_response = self._call_agent(cmo_system_prompt, context_str)
        debate_log.append(DebateEntry(agent_role="CMO", content=cmo_response))
        logger.info("CMO ha hablado.")

        # --- PASO 2: EL CFO (Chief Financial/Risk Officer) ---
        # Objetivo: Encontrar fallas, proteger activos.
        
        cfo_system_prompt = """
        Eres el CFO (Director Financiero) y Oficial de Riesgo conservador de la empresa.
        Tu personalidad es: Cautelosa, analítica, escéptica y protectora del margen de ganancia.
        
        Tu Misión:
        Revisa la señal de mercado y la propuesta loca del CMO.
        Identifica INMEDIATAMENTE:
        1. Riesgos financieros (costo excesivo, bajo ROI).
        2. Riesgos de marca (polémica negativa).
        3. Problemas operativos.
        
        Salida requerida: Un párrafo crítico y directo señalando por qué la idea del CMO podría fallar o ser peligrosa.
        """
        
        cfo_input = f"{context_str}\n\nPROPUESTA DEL CMO:\n{cmo_response}"
        cfo_response = self._call_agent(cfo_system_prompt, cfo_input)
        debate_log.append(DebateEntry(agent_role="CFO", content=cfo_response))
        logger.info("CFO ha hablado.")

        # --- PASO 3: EL CEO (Chief Executive Officer) ---
        # Objetivo: Síntesis y Output Estructurado.
        
        ceo_system_prompt = """
        Eres el CEO pragmático y decisivo de LeadBoostAI.
        
        Tu Misión:
        Tienes sobre la mesa una oportunidad de mercado, una propuesta agresiva del CMO y una advertencia del CFO.
        Debes tomar la DECISIÓN FINAL.
        
       
        - Si la oportunidad es enorme y el riesgo controlable, apoya al CMO pero pon límites (budget).
        - Si el riesgo es existencial, haz caso al CFO y propón algo más seguro o no hacer nada.
        - Busca el "Sweet Spot": Alto impacto, riesgo mitigado.
        
        IMPORTANTE: TU SALIDA DEBE SER ESTRICTAMENTE JSON VÁLIDO.
        Este JSON será consumido por un sistema automático. No incluyas markdown ```json```.
        
        Esquema JSON esperado:
        {
            "action_type": "Uno de [CREATE_CAMPAIGN, PAUSE_CAMPAIGN, INCREASE_BUDGET, DECREASE_BUDGET, NOTIFY_HUMAN, DO_NOTHING]",
            "reasoning": "Resumen de tu decisión final en 1 frase, citando por qué elegiste X sobre Y.",
            "parameters": {
                "budget_limit": (numero o null),
                "target_audience": (string o null),
                "copy_angle": (string o null),
                "platform": (string o null)
            },
            "confidence_score": (float 0.0 a 1.0),
            "urgency": "Uno de [LOW, MEDIUM, HIGH, CRITICAL]"
        }
        """
        
        ceo_input = f"{context_str}\n\nPROPUESTA CMO:\n{cmo_response}\n\nCRÍTICA CFO:\n{cfo_response}"
        
        raw_ceo_json = self._call_agent(ceo_system_prompt, ceo_input, json_mode=True)
        logger.info("CEO ha decidido.")

        # --- Parsing y Retorno ---
        try:
            # Limpieza por si OpenAI devuelve bloques de markdown
            cleaned_json = raw_ceo_json.replace("```json", "").replace("```", "").strip()
            decision_dict = json.loads(cleaned_json)
            
            # Construir el objeto final agregando el transcript
            proposal = ActionProposal(
                action_type=decision_dict.get("action_type", "NOTIFY_HUMAN"),
                reasoning=decision_dict.get("reasoning", "Error en síntesis"),
                parameters=decision_dict.get("parameters", {}),
                confidence_score=decision_dict.get("confidence_score", 0.5),
                urgency=decision_dict.get("urgency", "MEDIUM"),
                debate_transcript=debate_log
            )
            
            return proposal

        except json.JSONDecodeError:
            logger.error(f"Fallo al parsear JSON del CEO: {raw_ceo_json}")
            # Fallback seguro
            return ActionProposal(
                action_type=ActionType.NOTIFY_HUMAN,
                reasoning="El CEO no pudo estructurar una respuesta válida (Error JSON). Requiere intervención humana.",
                parameters={},
                confidence_score=0.0,
                urgency=UrgencyLevel.HIGH,
                debate_transcript=debate_log
            )

strategy_engine = StrategyEngine()