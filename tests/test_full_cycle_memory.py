import asyncio
import logging
import sys
import os
from datetime import datetime
from uuid import uuid4

# Configuración de Logging para ver la "mente" del Orquestador
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("ORCHESTRATOR_SIM")

# --- MOCKS Y PARCHES PARA QUE CORRA SIN TODO EL BACKEND ---
# (Esto simula que tienes el entorno completo instalado)

try:
    from contracts import CampaignPayload, CampaignState, StrategyBrief, QualityReport, QualityVerdict, QualityCheck, Severity
    from infrastructure.service_client import ServiceClient
    from domain.fsm import OrchestratorFSM
    from infrastructure.idempotency import IdempotencyStore
except ImportError:
    # Si fallan los imports, definimos lo mínimo necesario para la prueba
    logger.warning("⚠️ No se encontraron módulos del Core. Usando Mocks locales para la prueba.")
    from pydantic import BaseModel, Field
    from enum import Enum
    from typing import List, Dict, Any, Optional

    class CampaignState(str, Enum):
        IDLE = "IDLE"
        RADAR_SCAN = "RADAR_SCAN"
        STRATEGY_GEN = "STRATEGY_GEN"
        CONTENT_PROD = "CONTENT_PROD"
        QUALITY_AUDIT = "QUALITY_AUDIT"
        PUBLISH = "PUBLISH"
        LEARN = "LEARN"
        FAILED = "FAILED"
        DONE = "DONE" # FSM podría no tener DONE explícito en states list, pero lo usamos de meta

    class QualityVerdict(str, Enum):
        PASS = "PASS"
        FAIL = "FAIL"

    class Severity(str, Enum):
        CRITICAL = "CRITICAL"

    class QualityCheck(BaseModel):
        check_id: str = "CHECK-001"
        status: str = "PASS"
        severity: Severity = Severity.CRITICAL
        reason_code: str = "N/A"

    class QualityReport(BaseModel):
        verdict: QualityVerdict = QualityVerdict.PASS
        score: int = 95
        checks: List[QualityCheck] = []

    class StrategyBrief(BaseModel):
        rationale: str = "Estrategia Mockeada"
        channels: List[str] = ["LINKEDIN"]
        budget_allocation: Dict[str, float] = {"LINKEDIN": 1000.0}

    class CampaignPayload(BaseModel):
        tenant_id: str
        campaign_id: str
        execution_id: str
        current_state: CampaignState = CampaignState.IDLE
        objective: str = "LEADS"
        platform: str = "LINKEDIN"
        strategy: Optional[StrategyBrief] = None
        assets: List[Dict] = []
        quality_audit: Optional[QualityReport] = None
        execution_log: List[Dict] = []
        metrics: Dict[str, Any] = {} # Para simular resultados finales

        def add_trace(self, source, event, data=None):
            logger.info(f"📝 [TRACE] {source}: {event}")
            self.execution_log.append({"source": source, "event": event, "data": data})

        def model_dump(self, **kwargs):
            return super().model_dump(**kwargs)
        
        def mark_failed(self, reason, details):
            self.current_state = CampaignState.FAILED

    # Importamos las clases reales si el usuario las tiene, si no, usamos las simuladas arriba
    # (Para esta prueba asumimos que ServiceClient y FSM están disponibles o los mockeamos abajo)
    # Nota: Como el usuario subió los archivos, intentaremos usarlos.
    # Si estás corriendo esto aislado, asegúrate de que fsm.py y service_client.py estén accesibles.

# --- CLIENTE SIMULADO (EL HÉROE) ---

class SimServiceClient:
    """
    Cliente Híbrido:
    - Finge ser Radar, Analyst, Visual, Optimizer (Mocks).
    - ES REAL con Memory Service.
    """
    def __init__(self, memory_url):
        self.memory_url = memory_url
        # Importamos httpx aquí para la conexión real
        import httpx
        self.client = httpx.AsyncClient(timeout=10.0)

    async def call_radar_scan(self, payload):
        logger.info("📡 [MOCK] Radar Scan: Detectando oportunidades...")
        await asyncio.sleep(0.5)
        return {"market_sentiment": "positive"}

    async def call_strategy_generation(self, payload):
        logger.info("🧠 [MOCK] Analyst: Generando estrategia...")
        return StrategyBrief(
            rationale="Usar humor corporativo",
            channels=["LINKEDIN"],
            budget_allocation={"LINKEDIN": 5000.0}
        )

    async def call_content_production(self, payload):
        logger.info("🎨 [MOCK] Visual: Creando assets...")
        return [{"type": "image", "url": "http://mock/image.png"}]

    async def call_quality_audit(self, payload):
        logger.info("⚖️ [MOCK] Optimizer: Auditando calidad...")
        return QualityReport(
            verdict=QualityVerdict.PASS,
            score=98,
            checks=[QualityCheck(check_id="C1", status="PASS", severity=Severity.CRITICAL, reason_code="NONE")]
        )

    async def call_publish_campaign(self, payload):
        logger.info("🚀 [MOCK] Optimizer: Publicando campaña...")
        return {"status": "published", "url": "http://linkedin.com/ad/123"}

    # --- MÉTODOS REALES DE MEMORIA (COPIADOS/ADAPTADOS DE TU SERVICE_CLIENT) ---
    async def call_memory_retrieve(self, tenant_id, query, limit=3):
        logger.info(f"🧠 [REAL] Memory Service: Buscando '{query}'...")
        try:
            url = f"{self.memory_url}/api/v1/memory/retrieve"
            resp = await self.client.post(url, json={
                "tenant_id": str(tenant_id),
                "query_text": query,
                "limit": limit
            })
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                logger.info(f"✅ [REAL] Memoria encontró {len(results)} antecedentes.")
                return results
            else:
                logger.error(f"❌ [REAL] Error Memoria: {resp.status_code}")
                return []
        except Exception as e:
            logger.error(f"❌ [REAL] Conexión fallida: {e}")
            return []

    async def call_memory_ingest(self, payload):
        logger.info("💾 [REAL] Memory Service: Guardando experiencia...")
        try:
            url = f"{self.memory_url}/api/v1/memory/ingest"
            # Simulamos que el payload tiene métricas finales
            payload_dict = payload.model_dump(mode='json')
            # Forzamos estado terminal si no lo tiene
            if payload_dict.get('current_state') not in ['LEARN', 'FAILED', 'DONE']:
                 payload_dict['current_state'] = 'LEARN' 
                 # Ajuste para compatibilidad con el esquema de memoria
                 payload_dict['state'] = 'LEARN' 

            resp = await self.client.post(url, json={"payload": payload_dict})
            if resp.status_code == 201:
                data = resp.json()
                mem_id = data.get("memory_id")
                logger.info(f"✅ [REAL] ¡Memoria Guardada! ID: {mem_id}")
                return mem_id
            else:
                logger.error(f"❌ [REAL] Error Guardado: {resp.text}")
                return None
        except Exception as e:
            logger.error(f"❌ [REAL] Conexión fallida al guardar: {e}")
            return None

# --- SIMULADOR DE FSM ---
# Una versión simplificada de tu FSM para correr el test sin dependencias complejas de 'transitions'
# si no está instalada, o usando la lógica pura.

async def run_simulation():
    print("\n" + "="*60)
    print("🚀 INICIANDO SIMULACIÓN END-TO-END (ORQUESTADOR + MEMORIA)")
    print("="*60 + "\n")

    # 1. SETUP
    tenant_id = f"tenant-{uuid4().hex[:8]}"
    campaign_id = f"camp-{uuid4().hex[:8]}"
    
    logger.info(f"🆔 Tenant: {tenant_id}")
    logger.info(f"🆔 Campaign: {campaign_id}")

    # Payload inicial
    payload = CampaignPayload(
        tenant_id=tenant_id,
        campaign_id=campaign_id,
        execution_id=f"exec-{uuid4().hex[:8]}",
        current_state=CampaignState.IDLE,
        objective="Generar Leads B2B en Tech",
        platform="LINKEDIN",
        metrics={"roas": 0.0} # Inicial
    )

    # Cliente Híbrido (Mocks + Real Memory)
    client = SimServiceClient(memory_url="http://localhost:8006")

    # 2. EJECUCIÓN DEL FLUJO (Simulando lo que hace fsm.execute_workflow)
    
    # A) IDLE -> RADAR
    logger.info("--- PASO 1: RADAR SCAN ---")
    await client.call_radar_scan(payload)
    
    # B) RADAR -> STRATEGY (AQUÍ DEBE CONSULTAR MEMORIA)
    logger.info("--- PASO 2: ESTRATEGIA (Consulta de Memoria) ---")
    # El FSM real llama a retrieve aquí. Simulémoslo.
    memories = await client.call_memory_retrieve(
        tenant_id=tenant_id, 
        query=f"Estrategias exitosas para {payload.objective}"
    )
    if not memories:
        logger.info("✨ (Es normal que esté vacío si es la primera vez para este tenant)")
    
    payload.strategy = await client.call_strategy_generation(payload)

    # C) STRATEGY -> CONTENT
    logger.info("--- PASO 3: PRODUCCIÓN ---")
    payload.assets = await client.call_content_production(payload)

    # D) CONTENT -> AUDIT
    logger.info("--- PASO 4: AUDITORÍA ---")
    payload.quality_audit = await client.call_quality_audit(payload)

    # E) AUDIT -> PUBLISH
    logger.info("--- PASO 5: PUBLICACIÓN ---")
    if payload.quality_audit.verdict == QualityVerdict.PASS:
        await client.call_publish_campaign(payload)
        payload.current_state = CampaignState.PUBLISH
    else:
        logger.error("🛑 Calidad falló. Abortando.")
        return

    # F) PUBLISH -> LEARN (AQUÍ DEBE GUARDAR MEMORIA)
    logger.info("--- PASO 6: APRENDIZAJE (Guardado en Memoria) ---")
    # Simulamos resultados de campaña
    payload.metrics = {"roas": 4.2, "spend": 1200.0, "quality_score": 98}
    payload.current_state = CampaignState.LEARN 
    
    memory_id = await client.call_memory_ingest(payload)

    print("\n" + "="*60)
    if memory_id:
        print(f"🎉 ÉXITO: El ciclo se completó y la memoria se generó ({memory_id})")
        print("✅ La fase 6.3 está oficialmente validada.")
    else:
        print("💥 FALLO: El ciclo terminó pero no se guardó la memoria.")
    print("="*60)

    # 3. VERIFICACIÓN FINAL (¿Realmente recuerda?)
    if memory_id:
        print("\n🕵️ VERIFICACIÓN EXTRA: ¿El cerebro recuerda lo que acaba de aprender?")
        await asyncio.sleep(1) # Dar un respiro a Chroma
        recuerdos = await client.call_memory_retrieve(tenant_id, "Estrategias B2B Tech")
        found = any(m['memory_id'] == memory_id for m in recuerdos)
        if found:
            print(f"🧠 SÍ. Encontró la memoria {memory_id} en la búsqueda.")
        else:
            print("🧠 NO. No la encontró (podría ser latencia de indexación o error de filtro).")

if __name__ == "__main__":
    asyncio.run(run_simulation())