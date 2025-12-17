
---

#📄 BLUEPRINT_FASE5_INIT_v1.1.md: ORQUESTADOR ENTERPRISE & CONTRATOS BLINDADOS| Metadatos | Detalle |
| --- | --- |
| **Proyecto** | LeadBoostAI - Phoenix V5 |
| **Fase** | **FASE 5 - NÚCLEO DE CONTROL (Corregido v1.1)** |
| **Objetivo** | Establecer la "Ley" (Contratos) y el "Juez" (Orquestador) con Idempotencia y Calidad Enterprise. |
| **Stack** | Python 3.11+, Pydantic v2, Transitions (FSM). |
| **Estado** | `READY_FOR_CODING` |

---

##1. PILAR 1: LIBRERÍA DE CONTRATOS (`/shared_lib`)###1.1 Estructura del Paquete```text
shared_lib/
├── pyproject.toml
├── src/
│   ├── contracts/
│   │   ├── __init__.py
│   │   ├── base.py         # UUIDs, TimeMixin
│   │   ├── enums.py        # Estados, Verdictores, Severity
│   │   ├── artifacts.py    # StrategyBrief, QualityReport (Corregidos)
│   │   └── payload.py      # CampaignPayload (Con Idempotencia)

```

###1.2 Definición de Enums (`contracts/enums.py`)```python
from enum import Enum

class CampaignState(str, Enum):
    IDLE = "IDLE"
    RADAR_SCAN = "RADAR_SCAN"
    STRATEGY_GEN = "STRATEGY_GEN"
    CONTENT_PROD = "CONTENT_PROD"
    QUALITY_AUDIT = "QUALITY_AUDIT"
    PUBLISH = "PUBLISH"
    LEARN = "LEARN"
    FAILED = "FAILED"

class QualityVerdict(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARN = "WARN"

class Severity(str, Enum):
    CRITICAL = "CRITICAL" # Bloquea publicación
    HIGH = "HIGH"         # Requiere revisión humana
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class FailureReason(str, Enum):
    POLICY_VIOLATION = "FAILED_POLICY"
    QUALITY_CHECK_FAILED = "FAILED_QUALITY"
    CONTRACT_INVALID = "FAILED_CONTRACT"
    PLATFORM_ERROR = "FAILED_PLATFORM"
    TIMEOUT = "FAILED_TIMEOUT"

```

###1.3 Artefactos de Negocio (`contracts/artifacts.py`)Correcciones aplicadas: `QualityReport` estructurado y `StrategyBrief` enriquecido.

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from uuid import UUID, uuid4
from .enums import QualityVerdict, Severity

# --- QUALITY (CORREGIDO: Enterprise Grade) ---
class QualityCheck(BaseModel):
    check_id: str               # Ej: "contrast_ratio_check"
    result: QualityVerdict      # PASS / FAIL
    reason_code: Optional[str]  # Ej: "CONTRAST_TOO_LOW"
    severity: Severity          # CRITICAL
    evidence: Dict[str, Any]    # Ej: {"actual": 3.1, "min_required": 4.5}

class QualityReport(BaseModel):
    verdict: QualityVerdict
    checks: List[QualityCheck]
    auditor_signature: str      # Hash del servicio de auditoría
    timestamp: float

# --- STRATEGY (CORREGIDO: Más contexto) ---
class StrategyBrief(BaseModel):
    brief_id: UUID = Field(default_factory=uuid4)
    target_audience: str
    core_message: str
    channels: List[str]
    budget_allocation: Dict[str, float]
    
    # Nuevos campos obligatorios
    do_not_do: List[str] = Field(default_factory=list) # Ej: ["No usar rojo", "No mencionar política"]
    tone_guard: Dict[str, str] = Field(default_factory=dict) # Ej: {"voice": "formal", "style": "minimal"}
    platform_constraints: Dict[str, Any] = Field(default_factory=dict) # Ej: {"meta": {"aspect_ratio": "4:5"}}

```

###1.4 El Payload Maestro (`contracts/payload.py`)Correcciones aplicadas: Idempotencia explícita y control de terminación.

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID
from .enums import CampaignState, FailureReason
from .artifacts import StrategyBrief, QualityReport

class TraceEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor_service: str
    action: str
    metadata: Dict = {}

class CampaignPayload(BaseModel):
    # Identidad
    campaign_id: UUID
    tenant_id: UUID
    
    # IDEMPOTENCIA & CONTROL (CRÍTICO)
    execution_id: UUID          # ID único de ESTA ejecución (previene replays accidentales)
    retry_count: int = 0        # Contador de reintentos
    max_retries: int = 3        # Límite duro
    
    # Estado
    current_state: CampaignState
    terminal_reason: Optional[FailureReason] = None # Razón obligatoria si estado es FAILED
    terminal_details: Optional[str] = None          # Mensaje humano del error
    
    # Artefactos (Append-Only)
    strategy: Optional[StrategyBrief] = None
    assets: List[Dict] = Field(default_factory=list) # VisualAsset simplificado aquí
    quality_audit: Optional[QualityReport] = None
    
    execution_log: List[TraceEntry] = Field(default_factory=list)

```

---

##2. PILAR 2: EL ORQUESTADOR (`/core_orchestrator`)###2.1 Lógica de Idempotencia en la FSMEl Orquestador debe verificar el `execution_id` antes de procesar cualquier evento para evitar "duplicar campañas".

```python
# core_orchestrator/domain/workflow.py (Pseudo-código lógico)

async def process_transition(payload: CampaignPayload, next_action: Callable):
    # 1. Check Idempotencia (Redis/DB)
    # Key: "campaign:{id}:exec:{execution_id}:step:{current_state}"
    if await idempotency_store.exists(payload.campaign_id, payload.execution_id, payload.current_state):
        logger.warning("Duplicate execution attempt detected. Ignoring.")
        return

    try:
        # 2. Ejecutar Acción
        result = await next_action(payload)
        
        # 3. Marcar Éxito
        await idempotency_store.set(..., status="DONE")
        
    except Exception as e:
        # 4. Manejo de Reintentos
        if payload.retry_count < payload.max_retries:
            payload.retry_count += 1
            # Re-encolar con backoff
        else:
            # 5. Fallo Terminal Clasificado
            payload.current_state = CampaignState.FAILED
            payload.terminal_reason = FailureReason.TIMEOUT
            payload.terminal_details = str(e)
            await save_state(payload)

```

###2.2 Control de Calidad Estricto (Gatekeeper)La transición de `QUALITY_AUDIT` a `PUBLISH` ya no es un simple "if".

```python
# En la FSM:
def check_quality_gate(self, payload):
    report = payload.quality_audit
    
    # 1. Existencia
    if not report:
        return False
        
    # 2. Veredicto
    if report.verdict == QualityVerdict.FAIL:
        payload.terminal_reason = FailureReason.QUALITY_CHECK_FAILED
        # Extraer la razón más grave
        critical_failure = next((c for c in report.checks if c.severity == Severity.CRITICAL), None)
        payload.terminal_details = f"Bloqueado por: {critical_failure.reason_code if critical_failure else 'Unknown'}"
        return False
        
    # 3. Severidad (Opcional: Permitir WARN pero no CRITICAL)
    critical_issues = [c for c in report.checks if c.severity == Severity.CRITICAL]
    if critical_issues:
        return False
        
    return True

```

---
