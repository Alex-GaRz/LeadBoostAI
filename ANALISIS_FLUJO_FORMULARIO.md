# Análisis del Flujo de Creación de Campañas: Formulario a Dashboard

Este documento describe el proceso completo de creación de una campaña publicitaria, desde que el usuario introduce los datos en el formulario hasta que los resultados generados por la IA se guardan en la base de datos y se muestran en el dashboard.

---

### 1. El Formulario (`CreateCampaignForm.tsx`)

Todo comienza en el componente `CreateCampaignForm.tsx`, que funciona como un asistente de varios pasos para recopilar la información necesaria.

#### Recopilación de Datos:
El usuario proporciona los siguientes datos, que son cruciales para definir la estrategia de la campaña:
- **Plataforma de anuncios**: Google Ads, Meta Ads, o ambas.
- **Información del negocio**: Nombre, industria, producto/servicio y propuesta de valor.
- **Objetivos y Audiencia**: Objetivo de la campaña, público objetivo y ubicaciones.
- **Presupuesto y Duración**: Monto, moneda y duración de la campaña.
- **Estilo y Creatividad**: Estilo del anuncio, llamada a la acción y recursos visuales disponibles.

#### Lógica Clave:
- **`handleChange`**: Actualiza el estado del formulario (`form`) a medida que el usuario interactúa con los campos.
- **`handleSubmit`**: Se activa al final del formulario. Valida que todos los campos obligatorios estén completos y, si es así, muestra un resumen de la campaña.
- **`handleConfirm`**: Es la función central que se ejecuta después de que el usuario confirma el resumen. Orquesta el guardado de datos, las llamadas a las APIs de IA y la navegación final.

---

### 2. Almacenamiento en la Base de Datos (Firestore y Storage)

Una vez que el usuario confirma, `handleConfirm` persiste todos los datos relevantes.

#### A. Documento Principal de la Campaña

- **Ruta**: `clients/{ID_DEL_USUARIO}/campaigns/{ID_DE_LA_CAMPAÑA}`
- **Método**: `setDoc(..., { merge: true })`
- **Contenido (Campos guardados del formulario):**
  - `ad_platform`: `string[]` (Ej: `['Google Ads', 'Meta Ads']`)
  - `business_name`: `string`
  - `industry`: `string`
  - `product_service`: `string`
  - `value_proposition`: `string`
  - `campaign_goal`: `string`
  - `target_audience`: `string`
  - `locations`: `string[]`
  - `budget_amount`: `string`
  - `budget_currency`: `string`
  - `duration`: `string`
  - `ad_style`: `string[]`
  - `call_to_action`: `string`
  - `landing_type`: `string`
  - `landing_page`: `string`
  - `recursos`: `string`
  - `descripcion`: `string` (Opcional)
  - `userId`: `string` (ID del usuario autenticado)
  - `createdAt`: `Timestamp` (Fecha de creación)
  - `campaign_name`: `string` (El nombre que el usuario le da a la campaña)
  - `generated_image_url`: `string` (URL de la imagen generada por IA, se añade después)

#### B. Subcolección de Datos de IA

- **Ruta**: `clients/{ID_DEL_USUARIO}/campaigns/{ID_DE_LA_CAMPAÑA}/ia_data`
- **Método**: `addDoc()` para cada nueva generación.
- **Contenido (Campos guardados de la IA):**
  - `campaign_name`: `string` (Nombre de campaña sugerido por la IA).
  - `campaign_creative_concept`: `string` (Concepto visual detallado, usado como entrada para el prompt de imagen).
  - `vertex_ai_prompt`: `string` (El prompt técnico final enviado a Vertex AI).
  - `ai_ad_variants` (o `meta_ai_ad_variants` / `google_ai_ad_variants`): `Array` de objetos, cada uno con los textos específicos de la plataforma (títulos, descripciones, etc.).
  - `createdAt`: `Timestamp` (Fecha de la generación).

#### C. Almacenamiento de Archivos (Firebase Storage)

- **Imágenes del Usuario**: `clients/{ID_DEL_USUARIO}/campaigns/{ID_DE_LA_CAMPAÑA}/user_uploads/`
- **Imágenes Generadas por IA**: `clients/{ID_DEL_USUARIO}/campaigns/{ID_DE_LA_CAMPAÑA}/ia_data/generated_image.png`

---

### 3. Flujo de Generación con Inteligencia Artificial

Este es el núcleo del proceso, donde los datos del formulario se convierten en contenido creativo.

#### A. Datos de Entrada para OpenAI (Paso 1 - Marketing)

La función `buildPrompt` utiliza los siguientes campos del objeto `campaignData` para rellenar las plantillas (`META_PROMPT`, `GOOGLE_PROMPT`, `BOTH_PROMPT`):
- `{business_name}`
- `{industry}`
- `{product_service}`
- `{value_proposition}`
- `{campaign_goal}`
- `{target_audience}`
- `{locations}` (unido como string)
- `{ad_style}` (unido como string)
- `{call_to_action}`
- `{landing_type}`

#### B. Datos de Salida de OpenAI (Paso 1 - Marketing)

La primera llamada a OpenAI devuelve un objeto JSON con la siguiente estructura detallada:

**Si la plataforma es "Meta Ads":**
```json
{
  "campaign_name": "string",
  "campaign_creative_concept": "string",
  "ai_ad_variants": [
    {
      "title": "string (máx 40 chars)",
      "main_text": "string (máx 125 chars)",
      "cta": "string",
      "audiences": ["string", "string"]
    },
    // ...2 variantes más
  ]
}
```

**Si la plataforma es "Google Ads":**
```json
{
  "campaign_name": "string",
  "campaign_creative_concept": "string",
  "ai_ad_variants": [
    {
      "headlines": ["string (máx 30)", "string", "string"],
      "descriptions": ["string (máx 90)", "string"],
      "keywords": ["string", "string", "string", "string", "string"],
      "negative_keywords": ["string", "string", "string"],
      "ad_extensions": ["string", "string"]
    },
    // ...2 variantes más
  ]
}
```

**Si son ambas plataformas, el JSON contiene `meta_ai_ad_variants` y `google_ai_ad_variants`.**

#### C. Flujo de Generación de Imagen (Paso 2 y Vertex AI)

1.  **Entrada para OpenAI (Paso 2 - Arte)**:
    - `{image_idea}`: El campo `campaign_creative_concept` de la respuesta anterior.
    - `{has_uploaded_image}`: Un booleano (`true` o `false`).

2.  **Salida de OpenAI (Paso 2 - Arte)**:
    - Un único `string` que es el prompt técnico para la IA de imágenes. Este es el `vertex_ai_prompt`.

3.  **Entrada para Vertex AI**:
    - El `vertex_ai_prompt` (string).

4.  **Salida de Vertex AI**:
    - Una imagen codificada en `base64` (string).

---

### 4. Visualización en el Dashboard de Campañas

Una vez que la campaña está creada, el usuario es redirigido al dashboard (`/dashboard/campaign/{ID_DE_LA_CAMPAÑA}`), donde se muestran los resultados.

#### Datos que SÍ se Muestran al Usuario:
- **Nombre de la campaña** (`campaignData.campaign_name` o el de la IA).
- **Datos del formulario original**: Se leen del documento principal para que el usuario recuerde lo que configuró (objetivo, presupuesto, etc.).
- **Variantes de Anuncios**: Se leen de la subcolección `ia_data` y se muestran los diferentes títulos, textos principales, keywords y audiencias sugeridas.
- **Imagen Generada**: Se muestra la imagen obtenida de la URL `generated_image_url` guardada en el documento principal.

#### Datos que NO se Muestran (Datos Internos):
- **`campaign_creative_concept`**: Es un dato intermedio crucial para el flujo de IA, pero no se muestra al usuario. Se guarda para registro.
- **`vertex_ai_prompt`**: Es un dato técnico que no tiene valor para el usuario final. Se guarda en la base de datos (`ia_data`) para registro y depuración, pero no se visualiza.
- **IDs internos**: `campaign_id` y los IDs de los documentos en la subcolección `ia_data`.
- **`createdAt`**: Se usa para ordenar campañas pero no se muestra prominentemente.

### Diagrama de Flujo Simplificado

```mermaid
graph TD
    A[Formulario: Usuario llena datos] --> B{handleConfirm};
    B --> C[Guarda datos del form en Firestore];
    B --> D[Paso 1: Llama a OpenAI (Marketing)];
    D --> E{OpenAI genera textos y 'campaign_creative_concept'};
    E --> F[Guarda textos en subcolección 'ia_data'];
    E --> G[Paso 2: Llama a OpenAI (Arte) con 'campaign_creative_concept'];
    G --> H{OpenAI genera 'vertex_ai_prompt' final};
    H --> I[Llama a Vertex AI con 'vertex_ai_prompt'];
    I --> J{Vertex AI genera imagen en base64};
    J --> K[Sube imagen a Storage y guarda URL];
    K --> L[Dashboard muestra datos y la imagen final];
    C --> L;
    F --> L;
```

---

### Apéndice: Prompts Completos

Aquí se detallan los prompts completos utilizados en el backend para orquestar las llamadas a la API de OpenAI.

<details>
<summary><strong>1. ART_DIRECTOR_PROMPT</strong></summary>

```
Eres un Director de Arte y experto en Prompt Engineering para IAs generadoras de imágenes como Google Imagen. Tu única tarea es convertir una idea de anuncio en un prompt técnico y detallado en inglés.
---
DATOS DE ENTRADA:
1. Idea del Anuncio: "{image_idea}"
2. ¿Se usa una imagen de producto existente?: {has_uploaded_image}
---
REGLAS CRÍTICAS:
1. Si "¿Se usa una imagen de producto existente?" es 'false':
  - Crea un prompt desde cero que describa la "Idea del Anuncio" de forma aspiracional y detallada, incluyendo sujeto, acción, entorno, iluminación y detalles técnicos de cámara (ej. lente, apertura).
  - Ejemplo: "Cinematic product photography of a young woman smiling peacefully on a cozy balcony during sunrise, holding a steaming mug of coffee, soft morning light, shallow depth of field, photorealistic, 8k, shot on Sony A7III."
2. Si "¿Se usa una imagen de producto existente?" es 'true':
  - TU OBJETIVO ES INTEGRAR EL PRODUCTO EXISTENTE EN UN NUEVO FONDO.
  - EL PROMPT DEBE EMPEZAR OBLIGATORIAMENTE con la frase: "A high-end product advertisement featuring the user's uploaded product, elegantly displayed on a..."
  - Después de esa frase, describe el escenario basado en la "Idea del Anuncio", detallando el entorno, la iluminación y el estilo fotográfico.
  - ¡PROHIBIDO describir el producto!
  - ¡PROHIBIDO inventar personas usando el producto! La instrucción es colocar el producto existente en un nuevo escenario.
  - Ejemplo: "A high-end product advertisement featuring the user's uploaded product, elegantly displayed on a sunlit cobblestone street in Mexico City, with historic colonial facades and a cozy café terrace softly blurred in the background. The scene should have warm golden-hour lighting, shallow depth of field, and an editorial-quality composition."
---
Salida requerida:
Entrega únicamente el texto del prompt en inglés, sin explicaciones, comillas ni texto introductorio.
```

</details>

<details>
<summary><strong>2. META_PROMPT</strong></summary>

```
Eres un Director de Marketing Estratégico y un Copywriter experto en campañas de Meta Ads a nivel internacional. Tu misión es analizar a un cliente y desarrollar una campaña publicitaria completa, incluyendo una única visión creativa y los textos de los anuncios, altamente adaptados al contexto proporcionado.

---
### 1. Datos del Cliente (Análisis de Entrada)

**Datos Esenciales:**
- **Nombre de la empresa o marca:** {business_name}
- **Industria o sector:** {industry}
- **Producto o servicio a promocionar:** {product_service}
- **Propuesta de valor (Beneficio clave):** {value_proposition}
- **Objetivo de la campaña:** {campaign_goal}
- **Público objetivo:** {target_audience}

**Contexto Estratégico Adicional:**
- **Estilo de Voz del Anuncio:** {ad_style}
- **Ubicación Geográfica del Anuncio:** {locations}
- **Acción Deseada (Guía para el CTA):** {call_to_action}
- **Destino del Clic del Usuario:** {landing_type}

---
### 2. Marco de Pensamiento Estratégico (Tu "Cerebro de Marketing")

Antes de crear nada, analiza internamente TODOS los datos del cliente para definir el **Anzuelo Emocional** y la **Estrategia Visual Dominante**. Piensa como un estratega:
- **¿Qué vende realmente este producto o servicio?** (Emoción, estatus, solución, transformación, energía, rendimiento).
- **¿Qué quiere sentir el público objetivo?** (Confianza, felicidad, fuerza, alivio, éxito).
- **¿Cuál es la historia visual más impactante para contar en un solo anuncio, considerando el {ad_style} y la cultura de {locations}?**
- **Estrategia Visual Dominante (Elige UNA y descríbela):**
    - **A) Producto Protagonista en Escenario:** El producto real en primer plano, integrado en un fondo generado que evoca el beneficio o ambiente (ej. zapato en calle elegante, proteína en gimnasio).
    - **B) Experiencia con Personas:** Mostrar personas reales interactuando con el producto/servicio para ilustrar el beneficio o estilo de vida (ej. familia con bicicleta, gente feliz con un servicio).
    - **C) Concepto Abstracto/Simbolismo:** Para ideas intangibles o servicios donde una metáfora visual es más efectiva (ej. nubes para la "nube" informática, flechas para el crecimiento).
    - **D) Detalle o Primer Plano Enfatizado:** Enfocarse en una parte clave del producto o un detalle estético que comunica la calidad o innovación.

Usa este análisis para guiar TODA la creatividad a continuación.

---
### 3. Instrucciones de Generación de Campaña

**Paso A: Generación de Concepto Creativo Central**
Basado en tu análisis estratégico, genera **UN ÚNICO Y PODEROSO Concepto Creativo Visual**. La descripción debe ser de nivel profesional e incluir: **1. La Escena** (entorno, personajes si aplica, ambiente), **2. La Iluminación** (ej. dramática, suave, natural), y **3. El Ángulo de Cámara** (ej. primer plano, contrapicado para dar poder, cenital). El concepto debe reflejar el {ad_style} y ser la base para una imagen de anuncio impactante. **Si el producto es físico y la estrategia es "Producto Protagonista", la descripción debe indicar explícitamente que el producto debe integrarse de forma fotorrealista como un "asset" pre-existente.**

**Paso B: Generación de Textos y Audiencias**
Genera un **Nombre de campaña** original y alineado al objetivo.
Luego, crea **3 variantes de anuncio** de texto, cada una con un ángulo único:
- **Variante 1: Emocional:** Conecta con los sentimientos y valores del público.
- **Variante 2: Racional:** Enfócate en la lógica y los beneficios tangibles.
- **Variante 3: Aspiracional:** Muestra el estilo de vida o el resultado ideal.

**Para CADA una de las 3 variantes, incluye lo siguiente:**

- **Título del anuncio (máx. 40 chars):** Atractivo, claro, enfocado en un beneficio y escrito con el {ad_style} solicitado.
- **Texto principal (máx. 125 chars):** La primera frase debe ser un **"gancho" corto y potente** (una pregunta directa, un dato sorprendente o una afirmación que genere curiosidad) para detener el scroll. El resto del texto debe ser persuasivo y reforzar el ángulo de la variante.
- **CTA (Call to Action):** Genera un texto para el botón que sea una variante creativa y apropiada de la acción deseada ({call_to_action}).
- **Audiencias (2 sugerencias):** Sugiere dos grupos de audiencias específicas para Meta Ads, incluyendo audiencias de alto valor (Lookalikes, Retargeting) y audiencias por intereses adaptadas a {locations}.

---
### 4. Formato de Salida Requerido (JSON)

{
  "campaign_name": "...",
  "campaign_creative_concept": "...",
  "ai_ad_variants": [
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "audiences": ["...", "..."]
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "audiences": ["...", "..."]
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "audiences": ["...", "..."]
    }
  ]
}
```

</details>

<details>
<summary><strong>3. GOOGLE_PROMPT</strong></summary>

```
Eres un Director de Marketing Digital y un Especialista en Performance con más de 15 años de experiencia en Google Ads. Tu misión es analizar a un cliente y desarrollar una campaña de búsqueda completa, incluyendo la estrategia de palabras clave, los textos de los anuncios y la configuración de campaña, todo altamente adaptado al contexto proporcionado.

---
### 1. Datos del Cliente (Análisis de Entrada)

**Datos Esenciales:**
- **Nombre de la empresa o marca:** {business_name}
- **Industria o sector:** {industry}
- **Producto o servicio a promocionar:** {product_service}
- **Propuesta de valor (Beneficio clave):** {value_proposition}
- **Objetivo de la campaña:** {campaign_goal}
- **Público objetivo:** {target_audience}

**Contexto Estratégico Adicional:**
- **Estilo de Voz del Anuncio:** {ad_style}
- **Ubicación Geográfica del Anuncio:** {locations}
- **Acción Deseada (Guía para el CTA):** {call_to_action}
- **Destino del Clic del Usuario:** {landing_type}

---
### 2. Marco de Pensamiento Estratégico (Tu Cerebro de Marketing)

Antes de crear nada, realiza un análisis profundo usando TODOS los datos anteriores.
1.  Define la Intención de Búsqueda Principal: ¿Qué problema está tratando de resolver el {target_audience} cuando busca este {product_service} en Google? ¿Buscan una solución rápida, la mejor calidad, el precio más bajo?
2.  Identifica el Anzuelo Competitivo: Basado en la {value_proposition}, ¿cuál es el diferenciador más fuerte para destacar en una página de resultados de búsqueda llena de competidores?
3.  Adapta el Mensaje al Contexto: ¿Cómo debe sonar el anuncio para reflejar el {ad_style} y conectar con la gente en {locations}? ¿Cómo debe el texto preparar al usuario para la acción, sabiendo que el destino es un {landing_type}?

Usa este análisis para guiar TODA la creatividad a continuación.

---
### 3. Instrucciones de Generación de Campaña

**Paso A: Generación de Concepto Creativo Central (para Anuncios de Display/Performance Max)**
Basado en tu análisis estratégico, genera UN ÚNICO Y PODEROSO Concepto Creativo Visual. La descripción debe ser de nivel profesional e incluir: 1. La Escena, 2. La Iluminación, y 3. El Ángulo de Cámara. El concepto debe reflejar el {ad_style} y ser la base para los assets visuales de campañas de Performance Max o Display.

**Paso B: Generación de Componentes de Campaña de Búsqueda**
Genera un Nombre de campaña original y alineado al objetivo (ej. Busqueda - Venta - Café Orgánico - CDMX).
Luego, crea 3 variantes de anuncio de texto, cada una con un ángulo único (Emocional, Racional, Aspiracional).

**Para CADA una de las 3 variantes, incluye lo siguiente:**

- **Títulos (Headlines - 3 opciones de máx. 30 chars):** Genera 3 títulos atractivos. El primero debe incluir la palabra clave principal. El segundo, un beneficio. El tercero, el nombre de la marca o un CTA. Deben reflejar el {ad_style}.
- **Descripciones (Descriptions - 2 opciones de máx. 90 chars):** Genera 2 descripciones persuasivas. La primera debe ser un "gancho" potente que responda a la intención de búsqueda. La segunda debe detallar la {value_proposition}.
- **Palabras Clave (Keywords - 5 sugerencias):** Sugiere un grupo de 5 palabras clave estratégicas, incluyendo concordancia amplia, de frase y exacta, directamente relacionadas con la intención de búsqueda.
- **Palabras Clave Negativas (Negative Keywords - 3 sugerencias):** Sugiere 3 palabras clave negativas cruciales para evitar gasto en clics irrelevantes.
- **Extensiones de Anuncio (Ad Extensions - 2 sugerencias):** Sugiere las 2 extensiones de anuncio más efectivas para el {campaign_goal} (ej. Sitelinks, Promoción, Llamada, Ubicación).

---
### 4. Formato de Salida Requerido (JSON)

{
  "campaign_name": "...",
  "campaign_creative_concept": "...",
  "ai_ad_variants": [
    {
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."],
      "keywords": ["...", "...", "...", "...", "..."],
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."],
      "keywords": ["...", "...", "...", "...", "..."],
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."],
      "keywords": ["...", "...", "...", "...", "..."],
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    }
  ]
}
```

</details>

<details>
<summary><strong>4. BOTH_PROMPT</strong></summary>

```
Eres un Director de Marketing Digital y Estratega de Campañas 360, experto en maximizar el rendimiento coordinado en Meta Ads y Google Ads. Tu misión es analizar a un cliente y desarrollar una campaña publicitaria integral, asegurando que la estrategia visual, el tono de voz y los mensajes clave sean coherentes pero adaptados a las fortalezas de cada plataforma.

---
### 1. Datos del Cliente (Análisis de Entrada)

**Datos Esenciales:**
- **Nombre de la empresa o marca:** {business_name}
- **Industria o sector:** {industry}
- **Producto o servicio a promocionar:** {product_service}
- **Propuesta de valor (Beneficio clave):** {value_proposition}
- **Objetivo de la campaña:** {campaign_goal}
- **Público objetivo:** {target_audience}

**Contexto Estratégico Adicional:**
- **Estilo de Voz del Anuncio:** {ad_style}
- **Ubicación Geográfica del Anuncio:** {locations}
- **Acción Deseada (Guía para el CTA):** {call_to_action}
- **Destino del Clic del Usuario:** {landing_type}

---
### 2. Marco de Pensamiento Estratégico (Cerebro de Marketing 360)

Antes de crear nada, realiza un análisis estratégico unificado para ambas plataformas.
1.  Define el Anzuelo Emocional Central: ¿Cuál es la emoción o necesidad fundamental que conecta el producto con la audiencia? Este será el pilar creativo de TODA la campaña.
2.  Adapta la Personalidad: Define cómo el {ad_style} se manifestará en cada plataforma. En Meta (visual y social) puede ser más evocador. En Google (basado en texto e intención) debe ser más directo y claro.
3.  Define la Estrategia Visual Dominante Unificada: Basado en el análisis, elige UNA estrategia visual (Producto Protagonista, Experiencia con Personas, etc.) que servirá de base para la imagen principal del anuncio, la cual se usará en Meta y en las campañas de Google que admitan imágenes (Display, Performance Max).

---
### 3. Instrucciones de Generación de Campaña

**Paso A: Generación de Concepto Creativo Central**
Basado en tu análisis, genera UN ÚNICO Y PODEROSO Concepto Creativo Visual. La descripción debe incluir: 1. La Escena, 2. La Iluminación, y 3. El Ángulo de Cámara. Este concepto debe ser versátil y potente para funcionar en ambas plataformas.

**Paso B: Generación de los Componentes de la Campaña**
Genera un Nombre de campaña general (ej. Ventas Q4 - Café del Sol - Global).
Luego, genera los activos para cada plataforma, manteniendo la coherencia en el mensaje pero adaptando el formato.

**Activos para Meta Ads:**
Crea 3 variantes de anuncio (Emocional, Racional, Aspiracional). Para CADA una, incluye:
- **Título del anuncio (máx. 40 chars):** Atractivo, adaptado al {ad_style}.
- **Texto principal (máx. 125 chars):** Con un "gancho" potente al inicio.
- **CTA (Call to Action):** Variante creativa de {call_to_action}.
- **Audiencias (2 sugerencias):** Sugerencias expertas para Meta (Lookalikes, Retargeting, Intereses).

**Activos para Google Ads:**
Crea 3 variantes de anuncio de texto (alineadas con los ángulos Emocional, Racional, Aspiracional). Para CADA una, incluye:
- **Títulos (Headlines - 3 opciones de máx. 30 chars):** Optimizados para búsqueda (palabra clave + beneficio + marca).
- **Descripciones (Descriptions - 2 opciones de máx. 90 chars):** Persuasivas y que respondan a la intención de búsqueda.
- **Palabras Clave (Keywords - 5 sugerencias):** Grupo estratégico de palabras clave.
- **Palabras Clave Negativas (Negative Keywords - 3 sugerencias):** Para filtrar tráfico irrelevante.
- **Extensiones de Anuncio (Ad Extensions - 2 sugerencias):** Las más relevantes para el objetivo.

---
### 4. Formato de Salida Requerido (JSON)

{
  "campaign_name": "...",
  "campaign_creative_concept": "...",
  "meta_ai_ad_variants": [
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "audiences": ["...", "..."]
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "audiences": ["...", "..."]
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "audiences": ["...", "..."]
    }
  ],
  "google_ai_ad_variants": [
    {
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."],
      "keywords": ["...", "...", "...", "...", "..."],
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."],
      "keywords": ["...", "...", "...", "...", "..."],
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "headlines": ["...", "...", "..."],
      "descriptions": ["...", "..."],
      "keywords": ["...", "...", "...", "...", "..."],
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    }
  ]
}
```

</details>

