
#📄 BLUEPRINT_VISUAL_ENGINE_STRUCTURE.md| Metadatos | Detalle |
| --- | --- |
| **Proyecto** | LeadBoostAI - Phoenix V5 |
| **Fase** | **FASE 7 - Estructura del Motor Visual Enterprise** |
| **Objetivo** | Definir la arquitectura de software, módulos y responsabilidades del motor de renderizado. |
| **Stack** | Python 3.11, FastAPI, Pydantic, Pillow/OpenCV, Skia (Future). |
| **Estado** | `APPROVED_FOR_SKELETON_GENERATION` |

---

##1. Visión Arquitectónica (Layered Architecture)El servicio sigue una arquitectura de capas estricta para separar la **Matemática** (Layout), la **Generación** (AI Models), el **Procesamiento** (Image Ops) y la **Orquestación** (Pipeline).

```mermaid
graph TD
    API[API Layer (Routes)] --> PIPELINE[Core Pipeline]
    
    subgraph "Core Domain (Engines)"
        PIPELINE --> LAYOUT[Layout Engine (Math)]
        PIPELINE --> CN_ADAPTER[ControlNet Adapter (CV2)]
        PIPELINE --> GEN[Generation Engine (SDXL)]
        PIPELINE --> HARM[Harmonization Engine (Img2Img)]
        PIPELINE --> TYPO[Typography Engine (Skia/Cairo)]
    end
    
    subgraph "Infrastructure (Adapters)"
        GEN --> DIFF_CLIENT[Diffusion Client]
        CN_ADAPTER --> CN_CLIENT[ControlNet Client]
        TYPO --> STORAGE[Storage Client]
    end
    
    SHARED[(Shared Lib Contracts)] -.-> LAYOUT
    SHARED -.-> GEN

```

---

##2. Estructura de Carpetas (Canonical Tree)Esta es la estructura de archivos **EXACTA** que debe existir en `microservice_visual/`.

```text
microservice_visual/
├── api/
│   ├── __init__.py
│   └── routes.py              # Endpoint POST /v1/visual/generate
├── core/
│   ├── __init__.py
│   ├── pipeline/
│   │   ├── __init__.py
│   │   └── visual_pipeline.py # Orquestador principal del flujo visual
│   └── engines/
│       ├── __init__.py
│       ├── layout_engine.py       # Cálculo de Bounding Boxes y Safe Zones
│       ├── generation_engine.py   # Coordinador de SDXL/Flux
│       ├── controlnet_adapter.py  # Pre-procesamiento (Canny/Depth maps)
│       ├── harmonization_engine.py # Blending y corrección de color
│       └── typography_engine.py   # Renderizado de texto vectorial
├── adapters/
│   ├── __init__.py
│   ├── diffusion_client.py    # Cliente HTTP/RPC para la API de generación
│   ├── controlnet_client.py   # Cliente para inyectar señales de control
│   └── storage_client.py      # Cliente S3/MinIO/LocalFS
├── configuration/
│   ├── __init__.py
│   └── settings.py            # Variables de entorno y constantes
├── utils/
│   ├── __init__.py
│   ├── image_ops.py           # Operaciones de bajo nivel (PIL/Numpy)
│   ├── hashing.py             # SHA256 para assets
│   └── validation.py          # Checks de integridad de imágenes
├── main.py                    # Entrypoint FastAPI
└── requirements.txt

```

---

##3. Especificación de Componentes (Stubs & Responsabilidades)A continuación, se definen las clases y firmas de métodos requeridas. **NO implementar lógica**, solo la estructura.

###3.1. Core Engines####`core/engines/layout_engine.py`**Responsabilidad:** Matemática pura. No sabe qué es una imagen. Solo conoce coordenadas y rectángulos.
**Dependencias:** `shared_lib.contracts` (`PlatformSpec`, `LayoutPlan`).

```python
from shared_lib.contracts.artifacts import LayoutPlan, PlatformSpec
from shared_lib.contracts.artifacts import StrategyBrief

class LayoutEngine:
    def calculate_layout(self, spec: PlatformSpec, brief: StrategyBrief) -> LayoutPlan:
        """
        Calcula las coordenadas (BoundingBoxes) para producto, texto y safe zones.
        Debe respetar los márgenes del BrandGenome (inyectado o parte del brief).
        """
        pass

    def _validate_safe_zones(self, plan: LayoutPlan, spec: PlatformSpec) -> bool:
        """Verifica matemáticamente que no haya colisiones ilegales."""
        pass

```

####`core/engines/controlnet_adapter.py`**Responsabilidad:** Procesamiento de imagen del producto para preparar las guías de la IA.
**Dependencias:** `opencv`, `PIL`, `utils.image_ops`.

```python
from typing import Any, Dict

class ControlNetAdapter:
    def prepare_canny_map(self, product_image_bytes: bytes) -> bytes:
        """Genera el mapa de bordes Canny desde la imagen del producto."""
        pass

    def prepare_depth_map(self, product_image_bytes: bytes) -> bytes:
        """Genera el mapa de profundidad (si aplica)."""
        pass
    
    def validate_input_image(self, image_bytes: bytes) -> bool:
        """Asegura que la imagen de entrada sea válida para procesar."""
        pass

```

####`core/engines/generation_engine.py`**Responsabilidad:** Configurar y solicitar la generación de la escena base.
**Dependencias:** `adapters.diffusion_client`, `shared_lib.contracts`.

```python
from shared_lib.contracts.artifacts import GenerationMetadata, LayoutPlan
from .controlnet_adapter import ControlNetAdapter

class GenerationEngine:
    def __init__(self, client: 'DiffusionClient', cn_adapter: ControlNetAdapter):
        self.client = client
        self.cn_adapter = cn_adapter

    async def generate_base_scene(
        self, 
        prompt: str, 
        layout: LayoutPlan, 
        product_image: bytes
    ) -> tuple[bytes, GenerationMetadata]:
        """
        Orquesta la llamada a la IA generativa inyectando los ControlNet maps.
        Retorna la imagen cruda (background + producto fusionado) y la metadata forense.
        """
        pass

```

####`core/engines/harmonization_engine.py`**Responsabilidad:** Post-procesamiento para que el producto no parezca "pegado".
**Dependencias:** `utils.image_ops`.

```python
class HarmonizationEngine:
    def apply_harmonization(self, base_image: bytes, mask: bytes, strength: float = 0.3) -> bytes:
        """
        Ejecuta un paso de Img2Img con denoise bajo para unificar luces y sombras
        entre el objeto insertado y el fondo generado.
        """
        pass

```

####`core/engines/typography_engine.py`**Responsabilidad:** Renderizado de texto vectorial.
**Dependencias:** `skia-python` o `cairosvg`, `shared_lib.contracts` (`TextLayer`).

```python
from shared_lib.contracts.artifacts import TextLayer, LayoutPlan, VisualAsset

class TypographyEngine:
    def render_text_overlay(
        self, 
        base_image: bytes, 
        copy_text: dict, 
        layout: LayoutPlan,
        font_config: dict
    ) -> tuple[bytes, TextLayer]:
        """
        Renderiza el texto sobre una capa transparente y lo compone sobre la imagen base.
        Retorna la imagen final compuesta y el objeto TextLayer con metadatos.
        """
        pass

```

---

###3.2. Pipeline Orchestrator####`core/pipeline/visual_pipeline.py`**Responsabilidad:** El director de orquesta. Conecta todos los engines en secuencia.
**Dependencias:** Todos los `core/engines/`.

```python
from shared_lib.contracts.payload import CampaignPayload
from shared_lib.contracts.artifacts import VisualAsset, VisualFailureReport
from typing import List, Union

class VisualPipeline:
    def __init__(self):
        # Inyección de dependencias de los engines
        pass

    async def run_production_flow(self, payload: CampaignPayload) -> Union[List[VisualAsset], VisualFailureReport]:
        """
        Ejecuta el flujo completo:
        1. Layout -> 2. Prep (ControlNet) -> 3. Gen (SDXL) -> 4. Harmonize -> 5. Typography.
        Maneja errores y retorna reportes estructurados si falla.
        """
        pass

```

---

###3.3. Adapters (Infrastructure)####`adapters/diffusion_client.py````python
from abc import ABC, abstractmethod

class DiffusionClient(ABC):
    @abstractmethod
    async def generate(self, params: dict) -> bytes:
        pass

```

####`adapters/storage_client.py````python
from abc import ABC, abstractmethod

class StorageClient(ABC):
    @abstractmethod
    async def upload_asset(self, file_bytes: bytes, filename: str) -> str:
        """Sube el archivo y retorna la URL pública/firmada."""
        pass

```

---

##4. Dependencias Internas (Rules of Engagement)1. **Shared Lib es Dios:** Todos los DTOs (Data Transfer Objects) de entrada y salida de los métodos públicos **DEBEN** provenir de `shared_lib.contracts`. No usar diccionarios crudos para pasar datos complejos entre capas.
2. **Aislamiento de Engines:** El `LayoutEngine` no debe importar `GenerationEngine`. Se comunican solo a través del `VisualPipeline`.
3. **Adapters son tontos:** Los adapters solo saben hablar HTTP/S3. No contienen lógica de negocio (como calcular precios o validar safe zones).
4. **No AI en Layout:** El cálculo de posiciones es determinista. Prohibido usar LLMs para decidir coordenadas (x, y).

---

##5. Próximos Pasos (Implementación)1. **Crear Estructura:** Generar carpetas y archivos vacíos (`__init__.py` y `.py` con las clases arriba descritas).
2. **Configuración:** Implementar `configuration/settings.py` con variables para `SDXL_API_URL`, `CONTROLNET_URL`, `S3_BUCKET`, etc.
3. **Inyección:** Configurar la inyección de dependencias en `main.py` para instanciar el `VisualPipeline` con sus engines y adapters.

---
