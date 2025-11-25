import logging
import asyncio 
import os
import requests
from openai import OpenAI
from microservice_actuator.interfaces.handler_interface import IActionHandler
from microservice_actuator.models.schemas import ActionRequest, ExecutionResult, ActionStatus
from datetime import datetime

logger = logging.getLogger("MarketingHandler")

# Configuración Mock ERP (Para MVP) - En prod sería URL real
ERP_TRANSACTION_URL = "http://localhost:8011/enterprise/transaction"

class MarketingHandler(IActionHandler):
    
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None
        self.model = "gpt-4-turbo-preview"

    def _generate_creative_copy(self, strategy_reasoning: str, params: dict) -> str:
        """
        Genera el texto final del anuncio utilizando marcos de persuasión (AIDA/PAS).
        """
        if not self.client:
            return "[SIMULATION] Copy generado por IA no disponible (Falta API Key)."

        tone = params.get("ad_tone", "Profesional")
        audience = params.get("target_audience", "General")
        framework = "AIDA" if "oportunidad" in strategy_reasoning.lower() else "PAS"

        prompt = f"""
        Eres un Copywriter de élite experto en conversión directa.
        
        MISIÓN: Escribir el cuerpo de un anuncio para una campaña de: {audience}.
        TONO: {tone}.
        ESTRATEGIA: {strategy_reasoning}.
        MARCO OBLIGATORIO: {framework} ({'Atención, Interés, Deseo, Acción' if framework == 'AIDA' else 'Problema, Agitación, Solución'}).
        
        REQUISITO:
        - Sé breve, impactante y usa saltos de línea.
        - Incluye un Call to Action (CTA) claro al final.
        - No incluyas explicaciones, solo el texto del anuncio.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error generando copy: {e}")
            return "¡Oferta exclusiva por tiempo limitado! Click aquí."

    async def execute(self, action: ActionRequest) -> ExecutionResult:
        """
        Ejecuta la creación de la campaña:
        1. Genera el Copy Creativo (IA).
        2. Prepara el Payload.
        3. Envía al ERP/Plataforma.
        """
        sku = action.parameters.get("sku", "GEN-SERVICE-001")
        platform = action.parameters.get("platform_focus", "Multi-channel")
        budget = action.parameters.get("budget_cap", 0)
        
        logger.info(f"🚀 [ACTUATOR] Iniciando secuencia de lanzamiento para: {sku}")
        
        # --- PASO 1: GENERACIÓN DE COPY (EL "CEREBRO" DEL ACTUADOR) ---
        logger.info("✍️ Redactando anuncio publicitario...")
        final_ad_copy = self._generate_creative_copy(action.reasoning, action.parameters)
        
        # Simulación de latencia de red
        await asyncio.sleep(0.5) 
        
        erp_details = {"sync": "skipped"}
        
        # --- PASO 2: CONEXIÓN B11/PLATAFORMAS ---
        try:
            # Aquí "publicamos" el anuncio enviando la data al ERP/Simulador
            tx_payload = {
                "sku": sku,
                "campaign_id": action.action_id,
                "platform": platform,
                "ad_content": final_ad_copy, # Enviamos el texto generado
                "budget_allocated": budget,
                "status": "ACTIVE"
            }
            
            # Request síncrono en endpoint asíncrono (idealmente usar aiohttp, requests ok para MVP)
            # Usamos un timeout corto para no bloquear
            try:
                response = requests.post(ERP_TRANSACTION_URL, json=tx_payload, timeout=2)
                if response.status_code == 200:
                    data = response.json()
                    erp_details = {"sync": "success", "msg": data.get("message", "OK")}
                    logger.info(f"✅ [ERP] Campaña registrada exitosamente.")
                else:
                    erp_details = {"sync": "failed", "http_code": response.status_code}
            except requests.exceptions.ConnectionError:
                logger.warning("⚠️ [ERP] No se pudo conectar con Enterprise Service (¿Está corriendo?). Simulando éxito.")
                erp_details = {"sync": "simulated", "note": "ERP offline"}

        except Exception as e:
            logger.error(f"❌ [ACTUATOR] Error de ejecución: {e}")
            return ExecutionResult(
                action_id=action.action_id,
                status=ActionStatus.FAILED,
                details={"error": str(e)},
                timestamp=datetime.now()
            )

        # --- PASO 3: REPORTE FINAL ---
        return ExecutionResult(
            action_id=action.action_id,
            status=ActionStatus.EXECUTED,
            details={
                "platform": platform,
                "generated_copy": final_ad_copy[:100] + "...", # Preview en logs
                "full_copy": final_ad_copy,
                "erp_feedback": erp_details
            },
            timestamp=datetime.now()
        )