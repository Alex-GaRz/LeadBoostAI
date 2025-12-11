
# 📄 RFC-PHOENIX-04: DETERMINISTIC VISUAL ENGINE (DVE)

| Metadatos | Detalle |
| :--- | :--- |
| **Proyecto** | LeadBoostAI - Sistema Operativo Empresarial Autónomo |
| **Fase** | **FASE 4 - Motor Visual: Fidelidad de Producto** |
| **Autor** | Principal ML & Computer Vision Architect |
| **Estado** | `DRAFT` (Pendiente de Aprobación de Ingeniería) |
| **Dependencias** | RFC-PHOENIX-03 (Seguridad), PLAN 2 (Fase 4) |
| **Arquitectura** | Pipeline Gráfico Basado en Nodos (DAG) |

-----

## 1\. Resumen Ejecutivo

### 1.1 El Problema (Alucinación Generativa)

Los modelos generativos (DALL-E 3, Midjourney) son artistas, no ingenieros. Cuando se les pide "dibuja una lata de Coca-Cola", inventan los píxeles. En un contexto Enterprise, esto es inaceptable. **El producto (SKU) es sagrado.** Alterar un píxel del logo o deformar el envase constituye un riesgo de marca y legal. Además, la IA generativa es incapaz de renderizar tipografías corporativas con el kerning y espaciado exactos requeridos por un Brand Book.

### 1.2 La Solución (Composición Determinista)

No "generaremos" el anuncio completo. Lo **ensamblaremos**.
Implementaremos un **Motor Visual Híbrido** basado en un Grafo Acíclico Dirigido (DAG).

1.  **El Producto:** Se extrae quirúrgicamente (segmentación) y se trata como una capa inmutable.
2.  **El Contexto:** Se genera o selecciona (fondo) alrededor del producto.
3.  **El Mensaje:** Se renderiza programáticamente (HTML/CSS) para garantizar perfección tipográfica.
4.  **La Auditoría:** Un "fiscal" OCR valida que el precio en la imagen coincida con la base de datos antes de guardar.

-----

## 2\. Arquitectura del Microservicio (`microservice_visual`)

El sistema no es un script lineal. Es un orquestador de nodos de procesamiento independientes.

### 2.1 Estructura de Archivos

```text
microservice_visual/
├── core/
│   ├── __init__.py
│   ├── pipeline.py            # Orquestador del DAG
│   ├── context.py             # Objeto de estado que viaja por el tubo (Blackboard pattern)
│   └── interfaces.py          # Clase Abstracta IPipelineNode
├── nodes/                     # Implementaciones concretas de cada paso
│   ├── __init__.py
│   ├── input_node.py          # Carga y validación de assets crudos
│   ├── segmentation_node.py   # rembg (u2net) + Alpha Matting
│   ├── background_node.py     # GenAI Inpainting / Stock Fetcher
│   ├── composition_node.py    # Pillow Layering (Pixel Immutable Logic)
│   ├── typography_node.py     # Playwright HTML Renderer
│   └── forensic_node.py       # Tesseract/EasyOCR Validation
├── templates/                 # Plantillas HTML/CSS (Jinja2) para anuncios
│   ├── promo_retail.html
│   └── luxury_showcase.html
├── api/
│   └── routes.py              # Endpoint FastAPI (Trigger)
├── main.py                    # Entrypoint
└── requirements.txt
```

-----

## 3\. Diseño del Grafo (DAG Architecture)

### 3.1 El Contrato (`core/interfaces.py`)

Cada operación visual es un `Node`. Los nodos no saben quién viene antes o después, solo transforman el `VisualContext`.

```python
from abc import ABC, abstractmethod
from typing import Any, Dict

class VisualContext:
    """La 'cinta transportadora' que lleva los datos entre nodos."""
    def __init__(self, sku_data: Dict):
        self.sku_id = sku_data['id']
        self.raw_image = None       # PIL Image Original
        self.mask = None            # Alpha Channel Mask
        self.product_layer = None   # Producto Recortado (RGBA)
        self.background_layer = None
        self.text_layer = None
        self.final_composition = None
        self.metadata = {}          # Log de auditoría

class IPipelineNode(ABC):
    """Contrato estricto para cada paso del proceso visual."""
    @abstractmethod
    async def process(self, context: VisualContext) -> VisualContext:
        """
        Recibe el contexto, realiza una transformación atómica y lo devuelve.
        Debe lanzar VisualPipelineError si falla.
        """
        pass
```

-----

## 4\. Estrategia Técnica por Nodo

### 4.1 Nodo de Segmentación (`nodes/segmentation_node.py`)

**Objetivo:** Aislar el producto con precisión quirúrgica.
**Tecnología:** `rembg` (u2net model) con Alpha Matting activado para bordes suaves (pelo, transparencias).

  * **Configuración Crítica:**
      * `alpha_matting=True`: Para evitar bordes "duros" o pixelados.
      * `alpha_matting_foreground_threshold=240`: Preservar detalles del objeto.
      * **Validación de Integridad:** Calcular el Hash (SHA-256) de los píxeles visibles del producto post-recorte. Este hash debe coincidir con el "Golden Master" del SKU si existe.

### 4.2 Nodo de Fondo (`nodes/background_node.py`)

**Objetivo:** Crear atmósfera sin tocar el producto.
**Estrategia:**

  * Si es GenAI: Usar Inpainting (Stable Diffusion XL / DALL-E) enviando la máscara del producto como "área negativa" (do not touch) o componiendo el fondo *a posteriori*.
  * Si es Stock: Descargar asset de banco de imágenes compatible con la iluminación del producto.

### 4.3 Nodo de Tipografía (`nodes/typography_node.py`)

**Objetivo:** Texto perfecto. Ninguna IA generativa sabe escribir "50% OFF" consistentemente.
**Estrategia: Renderizado Headless Browser.**

1.  **Templating:** Usar `Jinja2` para inyectar variables (`{{ price }}`, `{{ copy_text }}`) en una plantilla HTML/CSS real que respeta el Brand Book (fuentes WOFF2, colores HEX, kerning).
2.  **Renderizado:** `Playwright` levanta un navegador headless, carga el HTML (con fondo transparente `background: transparent;`) y toma un *screenshot* en alta resolución.
3.  **Resultado:** Una capa PNG (RGBA) con texto vectorial rasterizado perfectamente.

### 4.4 Nodo de Composición (`nodes/composition_node.py`)

**Objetivo:** El ensamblaje final (Layering).
**Lógica (Pillow):**

```python
final_image = Image.new("RGBA", size)
final_image.alpha_composite(background_layer)
final_image.alpha_composite(product_layer, position=(x, y)) # EL PRODUCTO VA ARRIBA
final_image.alpha_composite(text_layer)
```

  * **Invariante:** La capa del producto **jamás** se modifica (no filtros, no distorsión). Solo se posiciona.

### 4.5 Nodo Forense (`nodes/forensic_node.py`)

**Objetivo:** Validación de Negocio Automatizada.
**Tecnología:** `pytesseract` (Tesseract OCR) o `EasyOCR`.

1.  **Extracción:** Leer todo el texto de `final_image`.
2.  **Regex Matching:** Buscar patrones de precio (ej. `$1,200`, `20%`).
3.  **Cruce de Datos:**
      * ¿El precio leído ($990) coincide con `db.products.get(sku).price` ($990)?
      * **Si SÍ:** `context.metadata['ocr_check'] = PASS`.
      * **Si NO:** `raise IntegrityError("Precio en imagen no coincide con DB")`. **RECHAZO AUTOMÁTICO**.

-----

## 5\. Plan de Implementación (Modular)

Este orden garantiza que cada pieza sea testeable por separado antes de la integración.

1.  **Cimientos:** Configurar entorno Docker con dependencias pesadas (`playwright install`, modelos `u2net`).
2.  **Módulo de Segmentación:** Implementar `SegmentationNode` y crear test unitario que tome una foto de zapato y devuelva PNG transparente.
3.  **Módulo de Tipografía:** Crear `typography_node` y una plantilla HTML base. Test: Generar PNG con precio dinámico.
4.  **Core Pipeline:** Implementar la clase `VisualPipeline` que encadene nodos.
5.  **Ensamblaje:** Crear `CompositionNode` y probar la superposición de capas.
6.  **Policía Visual:** Implementar `ForensicNode` con OCR. Testear con imágenes que tengan precios correctos e incorrectos.
7.  **Exposición:** Crear endpoint FastAPI `POST /generate_asset` que reciba el SKU y el Copy, y devuelva la URL de la imagen generada.

-----

## 6\. Criterios de Aceptación (DoD)

  * [ ] **Zero Hallucination:** El producto en la imagen final es bit-a-bit idéntico al recorte original (validado por inspección visual y Hash).
  * [ ] **Tipografía Perfecta:** El texto es legible, usa la fuente de la marca y no tiene "glitches" de IA.
  * [ ] **Validación Forense:** El sistema rechaza automáticamente cualquier imagen donde el precio OCR difiera del precio DB.
  * [ ] **Persistencia:** La imagen final y sus capas (raw, mask, text) se guardan en disco/S3 con IDs trazables.
  * [ ] **Performance:** Tiempo total de generación \< 15 segundos por asset.

-----
