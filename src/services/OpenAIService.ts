
// src/services/OpenAIService.ts

// Interfaces para tipar los datos de la campaña y las respuestas de la IA
interface CampaignData {
  business_name: string;
  industry: string;
  product_service: string;
  value_proposition: string;
  campaign_goal: string;
  target_audience: string;
  locations: string[];
  budget_amount: string;
  budget_currency: string;
  duration: string;
  ad_style: string[];
  call_to_action: string;
  landing_type: string;
  landing_page: string;
  ad_platform: string[];
  recursos: string;
  descripcion?: string;
}

// --- Prompts Finales y Optimizados ---

// Prompt base para el Director de Arte (imagen)
const ART_DIRECTOR_PROMPT = `
Tu tarea es crear un prompt en inglés para una IA generadora de imágenes.

---
### CONTEXTO:
- Se te dará una "Idea de Anuncio".
- Tu prompt debe describir un fondo o escenario para una imagen de producto que ya existe.

---
### IDEA DE ANUNCIO:
"{image_idea}"

---
### REGLAS ABSOLUTAS:
1.  **Describe ÚNICAMENTE el fondo.**
2.  **NO menciones el producto, el sujeto o sus características (color, forma, material). NUNCA.**
3.  Tu prompt debe detallar el escenario, la iluminación y el estilo fotográfico del fondo.
4.  El prompt debe empezar con "Photorealistic background of..."

---
### EJEMPLO:
- **Idea de Anuncio:** "Un zapato de lujo en un taller de artesano."
- **Prompt Generado:** "Photorealistic background of a rustic artisan's workbench inside a workshop. The scene is bathed in warm, soft morning light streaming from a side window. In the background, vintage leatherworking tools are softly blurred. Moody, atmospheric, shallow depth of field."

---
### INSTRUCCIÓN FINAL:
Genera únicamente el prompt en inglés, sin explicaciones ni texto adicional.
`;

const META_PROMPT = `
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
`;

const GOOGLE_PROMPT = `
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
`;

const BOTH_PROMPT = `
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
}`;



/**
 * Reemplaza los placeholders en el prompt con los datos de la campaña.
 */
function buildPrompt(promptTemplate: string, data: CampaignData): string {
  let prompt = promptTemplate;
  const variables: { [key: string]: string | undefined } = {
    '{business_name}': data.business_name,
    '{industry}': data.industry,
    '{product_service}': data.product_service,
    '{value_proposition}': data.value_proposition,
    '{campaign_goal}': data.campaign_goal,
    '{target_audience}': data.target_audience,
    '{locations}': data.locations.join(', '),
    '{budget_amount}': data.budget_amount,
    '{budget_currency}': data.budget_currency,
    '{duration}': data.duration,
    '{ad_style}': data.ad_style.join(', '),
    '{call_to_action}': data.call_to_action,
    '{landing_type}': data.landing_type,
    '{landing_page}': data.landing_page,
    '{recursos}': data.recursos,
    '{descripcion}': data.descripcion,
  };

  for (const [key, value] of Object.entries(variables)) {
    if (value) {
      prompt = prompt.replace(new RegExp(key, 'g'), value);
    }
  }

  if (data.recursos === 'imagen_lista') {
    // Si recursos es 'imagen_lista', eliminamos el fragmento de prompt para Vertex AI.
    const vertexPromptFragment = /Usa la información del cliente.*Devuelve solo el prompt textual listo para enviar a Vertex, sin explicaciones adicionales\./;
    prompt = prompt.replace(vertexPromptFragment, '');
  }

  return prompt;
}

/**
 * Genera contenido de campaña usando la API de OpenAI.
 * @param data - Los datos de la campaña del formulario.
 * @returns El objeto JSON con los datos de la campaña generados por la IA.
 */

/**
 * Refactor: Genera la campaña en dos pasos (copy y prompt de imagen).
 * @param data - Datos del formulario del cliente.
 * @param imageIdeaIndex - (opcional) Índice de la image_video_idea a usar para el prompt de imagen (por defecto 0).
 * @param hasUploadedImage - Booleano: ¿el usuario subió una imagen de producto?
 * @returns Objeto JSON final con vertex_ai_prompt.
 */
export async function generateCampaignAI(
  data: CampaignData,
  imageIdeaIndex: number = 0,
  hasUploadedImage: boolean = false
): Promise<any> {
  // 1. Primera llamada: Copywriter
  let promptTemplate: string;
  const hasGoogle = data.ad_platform.includes('Google Ads');
  const hasMeta = data.ad_platform.includes('Meta Ads');
  if (hasGoogle && hasMeta) {
    promptTemplate = BOTH_PROMPT;
  } else if (hasGoogle) {
    promptTemplate = GOOGLE_PROMPT;
  } else if (hasMeta) {
    promptTemplate = META_PROMPT;
  } else {
    throw new Error('No se ha especificado una plataforma de anuncios válida.');
  }
  const copyPrompt = buildPrompt(promptTemplate, data);
  let copyResponse;
  try {
    const response = await fetch('/api/openai/generate-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, prompt: copyPrompt }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Error al generar la campaña con IA');
    copyResponse = JSON.parse(result.result);

    // --- INICIO DE LA MODIFICACIÓN PARA ESCENARIO 3 ---
    // Si el usuario proveyó su propia idea, la usamos en lugar de la que generó la IA.
    if (data.recursos === 'solo_ideas' && data.descripcion) {
      console.log("Escenario 'solo_ideas' detectado. Reemplazando 'campaign_creative_concept' con la descripción del usuario.");
      copyResponse.campaign_creative_concept = data.descripcion;
    }
    // --- FIN DE LA MODIFICACIÓN ---

    // Mostrar el JSON (ya modificado si aplica) en la consola del navegador
    console.log('Respuesta OpenAI (copyResponse):', copyResponse);
  } catch (error) {
    throw new Error('Hubo un problema al generar la campaña (copywriter). Inténtelo de nuevo más tarde.');
  }

  // 2. Segunda llamada: Director de Arte
  // Extraer la idea de imagen solo desde campaign_creative_concept
  let imageIdea = '';
  if (copyResponse && typeof copyResponse.campaign_creative_concept === 'string' && copyResponse.campaign_creative_concept.length > 0) {
    imageIdea = copyResponse.campaign_creative_concept;
  } else {
    throw new Error('No se pudo extraer campaign_creative_concept para el prompt de arte. Respuesta IA: ' + JSON.stringify(copyResponse));
  }

  // Construir el prompt para el Director de Arte usando la constante y reemplazando los placeholders
  const artPrompt = ART_DIRECTOR_PROMPT
    .replace('{image_idea}', imageIdea)
    .replace('{has_uploaded_image}', String(hasUploadedImage));

  let vertexPrompt = '';
  try {
    const response = await fetch('/api/openai/generate-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: artPrompt, expectJson: false }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Error al generar el prompt de imagen');
    vertexPrompt = result.result?.trim();
  } catch (error) {
    throw new Error('Hubo un problema al generar el prompt de imagen. Inténtelo de nuevo más tarde.');
  }

  // 3. Combinar resultados y asegurar que vertex_ai_prompt nunca sea vacío
  const finalResult = {
    ...copyResponse,
    vertex_ai_prompt: vertexPrompt || imageIdea || '',
  };
  return finalResult;
}
