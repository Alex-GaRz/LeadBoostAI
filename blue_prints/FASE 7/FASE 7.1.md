# 📄 BLUEPRINT_FASE7_EXECUTION_v3.md — MOTOR DE ALTA FIDELIDAD (VISUAL & COPY)

| Metadatos                | Detalle                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Proyecto**             | LeadBoostAI — Phoenix V5                                                                                                 |
| **Fase**                 | **FASE 7 — EJECUCIÓN DE ALTA FIDELIDAD**                                                                                 |
| **Objetivo**             | Convertir `StrategyBrief` → **assets finales vendibles** (imagen + copy) con **reproducibilidad, gobernanza y calidad**. |
| **Servicios**            | `microservice_visual` (Visual Actuator), `microservice_analyst` (Copy Actuator), Orquestador (estado `CONTENT_PROD`)     |
| **Pilares obligatorios** | Contracts únicos, Orquestación por HTTP async, BrandGenome ejecutable, Quality Gates, Ledger, Reproducibilidad forense   |
| **Estado**               | `READY_FOR_RFC_AND_CODING`                                                                                               |

---

## 0) Invariantes Enterprise (No negociables)

1. **Contract-First**: ningún servicio define sus propios modelos de `StrategyBrief/BrandGenome/Asset`. Todo sale de `shared_lib`.
2. **Append-only**: el `CampaignPayload` **no sobrescribe** artefactos; agrega candidatos + reportes.
3. **Determinismo estructural**: la estructura (layout, validaciones, checks, reason_codes) es determinista; la creatividad (generación) puede variar.
4. **Evidencia forense**: cada asset final tiene “receta” completa (`GenerationMetadata`) para reproducir éxito o fallo.
5. **Fail estructurado**: si algo falla, retorna **`VisualFailureReport` / `CopyFailureReport`** (no strings sueltos).
6. **Gobierno de marca**: `BrandGenome` no es loader; expone validaciones ejecutables vía `ComplianceGuard`.
7. **El Orquestador NO compone**: solo coordina por HTTP y decide retry/abort; la ejecución vive en actuadores.

---

## 1) Cambios obligatorios en `shared_lib` (Contracts)

### 1.1 Ubicación y estructura

```
shared_lib/src/contracts/
├── enums.py
├── payload.py
├── artifacts.py          # VisualAsset, CopyVariant, Reports
├── specs.py              # PlatformSpec
├── product.py            # ProductAsset
└── quality.py            # Quality primitives (si se separa)
```

### 1.2 Enums mínimos (si no existen ya)

* `Severity = CRITICAL | HIGH | MEDIUM | LOW`
* `FailureReason` (ya existe en Fase 5) + reason_codes específicos de ejecución (a nivel report).

---

## 2) Contratos blindados (Pydantic v2, strict)

> Regla: **campos obligatorios** cuando son críticos para reproducibilidad / auditoría.
> Regla: **schema_version** en artefactos principales.

### 2.1 PlatformSpec (`contracts/specs.py`)

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Literal

class BoundingBox(BaseModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    z_index: int = Field(ge=0)

class PlatformSpec(BaseModel):
    schema_version: str = "1.0"

    platform_id: str  # e.g. "META_STORY", "LINKEDIN_FEED"
    aspect_ratio: str
    canvas_width: int
    canvas_height: int

    safe_zones: List[BoundingBox]  # zonas intocables
    text_limits: Dict[str, int]    # {"headline": 40, "body": 125, "cta": 18}
    supported_formats: List[Literal["png", "jpg", "webp"]]
```

### 2.2 ProductAsset (`contracts/product.py`)

```python
from pydantic import BaseModel, HttpUrl
from typing import Optional

class ProductAsset(BaseModel):
    schema_version: str = "1.0"

    product_id: str
    image_url: HttpUrl
    mask_url: Optional[HttpUrl] = None  # opcional si ya existe
    image_hash: str                     # SHA256 del input (bytes)
```

### 2.3 Artefactos Visuales (`contracts/artifacts.py`)

```python
from pydantic import BaseModel, Field, HttpUrl
from typing import Dict, Any, Optional, List, Literal
from uuid import UUID
from .enums import Severity

class LayoutPlan(BaseModel):
    schema_version: str = "1.0"

    plan_id: UUID
    canvas_width: int
    canvas_height: int
    product_placement: "BoundingBox"
    text_placement: "BoundingBox"
    safe_zone_violations: int = Field(ge=0)
    rationale: str  # explicación determinista basada en reglas

class GenerationMetadata(BaseModel):
    schema_version: str = "1.0"

    # Modelo
    model_name: str
    model_version: str

    # Reproducibilidad
    seed: int
    scheduler: str
    steps: int
    cfg_scale: float
    denoise_strength: float

    # Control
    controlnet_config: Dict[str, Any]  # pesos, modelos, etc.

    # Evidencia input
    input_image_hash: str   # SHA256 del producto original
    layout_id: UUID         # LayoutPlan usado
    prompt_hash: str        # SHA256(prompt_final + negative_prompt_final)

class TextLayer(BaseModel):
    schema_version: str = "1.0"

    layer_id: UUID
    image_url: HttpUrl
    bounding_box: "BoundingBox"
    font_family_used: str
    font_size: int
    content_hash: str       # SHA256 del texto + params tipográficos

class VisualAsset(BaseModel):
    schema_version: str = "1.0"

    asset_id: UUID
    url: HttpUrl
    format: Literal["png", "jpg", "webp"]
    layout_used: LayoutPlan
    metadata: GenerationMetadata
    text_layer: Optional[TextLayer] = None
    visual_hash: str  # SHA256(bytes imagen final)

class VisualFailureReport(BaseModel):
    schema_version: str = "1.0"

    reason_code: str  # e.g. "SAFE_ZONE_VIOLATION", "CONTROLNET_FAILURE", "LOW_CONTRAST"
    severity: Severity
    evidence: Dict[str, Any]  # métricas, thresholds, histograma, etc.
```

### 2.4 Artefactos Copy (`contracts/artifacts.py`)

```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal, Optional
from .enums import Severity

class ToneGuardReport(BaseModel):
    schema_version: str = "1.0"

    score: int = Field(ge=0, le=100)
    length_check: Literal["PASS", "FAIL_SHORT", "FAIL_LONG"]
    forbidden_terms_found: List[str]
    cliché_density: float = Field(ge=0.0, le=1.0)
    readability_score: float  # métrica determinista (no juicio LLM)
    evidence: Dict[str, Any] = Field(default_factory=dict)
    reasoning: str            # texto generado por reglas (no por LLM)

class CopyVariant(BaseModel):
    schema_version: str = "1.0"

    headline: str
    body: str
    cta: str
    tags: Dict[str, str] = Field(default_factory=dict)  # angle_tag, tone_tag
    tone_guard: ToneGuardReport

class CopyFailureReport(BaseModel):
    schema_version: str = "1.0"

    reason_code: str  # e.g. "FORBIDDEN_TERMS", "TOO_LONG", "TONE_MISMATCH"
    severity: Severity
    evidence: Dict[str, Any]
```

### 2.5 Actualización obligatoria de `CampaignPayload` (`contracts/payload.py`)

Campos nuevos (append-only):

* `platform_spec: Optional[PlatformSpec]`
* `product_asset: Optional[ProductAsset]` (o referencia equivalente)
* `layout_plan: Optional[LayoutPlan]` (si se desea auditar el layout separado del asset)
* `visual_candidates: List[VisualAsset]`
* `copy_candidates: List[CopyVariant]`
* `selected_visual: Optional[VisualAsset]`
* `selected_copy: Optional[CopyVariant]`

Regla: `selected_*` solo se llena cuando el orquestador decide “candidato ganador” (antes de `QUALITY_AUDIT` o dentro de ese gate).

---

## 3) microservice_visual — Visual Engine Enterprise

### 3.1 Responsabilidad exacta

**Entrada:** `StrategyBrief + BrandGenome + PlatformSpec + ProductAsset`
**Salida:** `VisualAsset` **o** `VisualFailureReport`
**NO HACE:** estrategia, copy, publicación, elección final, ni estados FSM.

### 3.2 Estructura de carpetas (hexagonal)

```
microservice_visual/
├── core/
│   ├── engines/
│   │   ├── layout_engine.py          # matemático
│   │   ├── prompt_builder.py         # determinista (brief+genome+memoria)
│   │   ├── generation_engine.py      # SDXL/Flux + ControlNet (adapter)
│   │   ├── harmonizer.py             # img2img low denoise (adapter)
│   │   ├── typography_engine.py      # Skia/Cairo
│   │   └── validators.py             # histogram, blank-image, etc
│   ├── compliance_bridge.py          # llama ComplianceGuard (BrandGenome ejecutable)
│   └── pipeline.py                   # orquestación interna del servicio
├── adapters/
│   ├── diffusion_client.py           # Replicate/Stability/Diffusers local
│   ├── storage.py                    # S3/MinIO/Local
│   ├── image_io.py                   # Pillow/OpenCV helpers
│   └── hashing.py                    # SHA256 bytes
├── api/
│   ├── routes.py                     # POST /v1/visual/generate
│   └── schemas.py                    # request/response (import contracts)
└── main.py
```

### 3.3 API (contrato y códigos)

**POST `/v1/visual/generate`**

* `200 OK` → `VisualAsset`
* `422 Unprocessable Entity` → `VisualFailureReport` (fallo estructural / validación)
* `503 Service Unavailable` → upstream generativo caído (para retry por política)
* `409 Conflict` → idempotency conflict (si se implementa idempotency a nivel servicio)

### 3.4 Pipeline mínimo obligatorio (sin ambigüedad)

**Paso 1 — Layout (determinista)**

* calcula `LayoutPlan` a partir de:

  * `PlatformSpec.canvas_*`
  * safe zones
  * reglas del `BrandGenome` (padding mínimo, escala mínima, etc.)
* si `safe_zone_violations > 0` → **retorna `VisualFailureReport(reason_code="SAFE_ZONE_VIOLATION", severity=CRITICAL)`**

**Paso 2 — Preparación de producto**

* normaliza (resolución, alpha, color space)
* si no hay máscara: genera con RemBG (adapter)
* genera **canny map** y (si aplica) **depth map**
* valida “bordes detectados mínimos” (si 0/insuficiente → `CONTROLNET_FAILURE`)

**Paso 3 — Generación (SDXL/Flux + ControlNet)**

* `prompt_final` se construye **solo** desde:

  * `StrategyBrief.visual_concept`
  * `BrandGenome.tone`
  * `StrategyBrief.do_not_do`
* `negative_prompt_final` debe incluir (mínimo):

  * `"text, watermark, logo, low quality, blurry"`
  * * negativos del genoma (si existen)
* la generación debe ser **con máscara/layout** para evitar composiciones amateur (fondo vs sujeto).

**Paso 4 — Harmonization (img2img low denoise)**

* objetivo: quitar “pegote”, igualar iluminación, suavizar bordes
* registra `denoise_strength` y scheduler/steps

**Paso 5 — Tipografía (Skia/Cairo)**

* render vectorial con reglas del `BrandGenome` (fuentes, tracking/kerning si aplica)
* produce `TextLayer` en PNG transparente
* valida:

  * contraste WCAG (>= 4.5) contra el fondo en zona de texto → si falla: `LOW_CONTRAST`
  * overflow (texto no cabe en bounding box) → `TEXT_OVERFLOW`

**Paso 6 — ComplianceBridge (BrandGenome ejecutable)**

* ejecutar validaciones mínimas:

  * `validate_safe_zones(layout_plan, platform_spec, genome)`
  * `validate_contrast_ratio(...)`
  * `validate_hex_palette(...)` (si aplica a overlays)
  * `validate_font_family(...)`
* si falla: `POLICY_VIOLATION` con evidencia (check_id, threshold, actual)

**Paso 7 — Persistir & responder**

* guarda imagen final en storage
* computa `visual_hash` (SHA256 bytes)
* computa `prompt_hash`
* retorna `VisualAsset` con `GenerationMetadata` completo.

---

## 4) microservice_analyst — Copy Actuator + ToneGuard

### 4.1 Responsabilidad exacta

* Genera **variantes** de copy según `StrategyBrief`
* Ejecuta `ToneGuard` **determinista** y selecciona top-1
* Devuelve `CopyVariant[]` + `selected` (o permite selección al orquestador, pero el contrato debe reflejarlo)

### 4.2 Ubicación sugerida

`microservice_analyst/core/copy_engine.py`

### 4.3 API (si se expone como endpoint)

**POST `/v1/copy/generate`**

* `200 OK` → `{ variants: List[CopyVariant], selected: CopyVariant }`
* `422` → `CopyFailureReport` (forbidden terms, demasiado largo, etc.)

### 4.4 ToneGuard determinista (definición)

ToneGuard debe puntuar con:

* chequeo de longitudes por `PlatformSpec.text_limits`
* términos prohibidos por `BrandGenome` + `RiskProfile`
* densidad de clichés (diccionario interno, configurable)
* legibilidad (métrica determinista: Flesch/Fernández-Huerta según idioma)
* score 0–100 con evidencia.

Regla: **LLM nunca juzga**, solo genera.

---

## 5) Integración con Orquestador (FSM — `CONTENT_PROD`)

### 5.1 Regla de comunicación

Orquestador llama por **HTTP async** a:

* `microservice_visual`
* `microservice_analyst` (copy)

Nunca imports directos.

### 5.2 Flujo canonical (scatter/gather)

En `CONTENT_PROD`:

1. Resolver `PlatformSpec` (catálogo interno determinista).
2. Guardar `payload.platform_spec` (append-only).
3. Ejecutar en paralelo:

   * Visual.generate
   * Copy.generate
4. Manejar respuestas:

   * si `VisualFailureReport` o `CopyFailureReport`:

     * registrar en ledger (audit)
     * aplicar política de retry por `reason_code` (cambiar seed, ajustar negativos, reducir texto, etc.)
     * si excede `max_retries` → `FAILED` con `terminal_reason` y `terminal_details` estructurados.
5. En success:

   * append `visual_candidates`, `copy_candidates`
   * opcional: set `selected_visual/selected_copy` (por reglas deterministas: “mejor score / primer PASS”)
   * transicionar a `QUALITY_AUDIT`

**Nota**: `QUALITY_AUDIT` (Fase 8) es el gate final; aquí solo se garantiza “mínimo de calidad técnica”.

---

## 6) Ledger obligatorio (Fuente de verdad)

Cada intento (success o failure) escribe:

* `execution_id`, `campaign_id`, `state=CONTENT_PROD`
* `attempt_no`
* `service=visual|copy`
* `result=PASS|FAIL`
* `reason_code` (si fail)
* hashes (`input_image_hash`, `visual_hash`, `prompt_hash`) cuando aplique
* `generation_metadata` (en success y, si se puede, en fail parcial)

La UI/Executive Panel lee del ledger, no de logs.

---

## 7) Pruebas obligatorias (Quality Assurance real)

### 7.1 Contract Tests (bloqueantes)

* Todo microservicio importa modelos desde `shared_lib` y **no define duplicados**.
* Validación Pydantic strict en entradas/salidas.

### 7.2 Unit tests (sin IA)

* `LayoutEngine`: safe zones, bounding boxes, overflow
* `ToneGuard`: longitudes, forbidden terms, cliché_density
* `ComplianceBridge`: contrast check, safe zone check

### 7.3 Integration tests (con IA mockeada)

* `diffusion_client` stub devuelve imagen fija
* pipeline produce `VisualAsset` + hashes + metadata

### 7.4 End-to-End (mínimo)

* Orquestador ejecuta una campaña:

  * `CONTENT_PROD` genera candidatos
  * persiste en ledger
  * avanza a `QUALITY_AUDIT`

---

## 8) Observabilidad (mínimo enterprise)

* Logs JSON (`structlog`) con `execution_id`, `campaign_id`, `state`
* Tracing OTel: spans por etapa del pipeline (layout/gen/harmonize/text/storage)
* Métricas:

  * latencia por etapa
  * tasa de fallos por reason_code
  * retries promedio

---

## 9) Criterio de “Anuncio Increíble” (definición técnica)

Se considera “apto” cuando:

* no hay violaciones de safe zones
* contraste texto >= 4.5 (o regla del genoma)
* texto no overflow
* imagen no borrosa/negra (checks deterministas)
* metadata completa (reproducibilidad)
* copy pasa ToneGuard con score >= umbral configurable (ej. 80)

El gate final de “score estético” (Vision AI) vive en Fase 8.

---

## 10) Checklist final (para aprobar implementación)

* [ ] Contracts implementados en `shared_lib` y versionados
* [ ] `PlatformSpec` y `ProductAsset` existen y se usan
* [ ] Visual Engine retorna `VisualAsset` o `VisualFailureReport` (no strings)
* [ ] Copy Actuator retorna `CopyVariant` + `ToneGuardReport` determinista
* [ ] Orquestador usa `CONTENT_PROD` (sin estados inventados)
* [ ] Ledger registra intentos y evidencia
* [ ] Tests: layout/toneguard/contracts pasan
* [ ] No existen modelos duplicados fuera de `shared_lib`

---
