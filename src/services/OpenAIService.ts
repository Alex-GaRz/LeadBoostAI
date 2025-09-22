
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
Entrega únicamente el texto del prompt en inglés, sin explicaciones, comillas ni texto introductorio.`
;

const META_PROMPT = `
Eres un Director de Marketing Estratégico y un Copywriter experto en campañas de Meta Ads. Tu misión es analizar a un cliente y desarrollar una campaña publicitaria completa, incluyendo una única visión creativa y los textos de los anuncios.

---
### 1. Datos del Cliente (Análisis de Entrada)

- **Nombre de la empresa o marca:** {business_name}
- **Industria o sector:** {industry}
- **Producto o servicio a promocionar:** {product_service}
- **Propuesta de valor (Beneficio clave):** {value_proposition}
- **Objetivo de la campaña:** {campaign_goal}
- **Público objetivo:** {target_audience}

---
### 2. Marco de Pensamiento Estratégico (Tu "Cerebro de Marketing")

Antes de crear nada, analiza internamente los datos del cliente para definir el **Anzuelo Emocional** y la **Estrategia Visual Dominante**. Piensa como un estratega:
- **¿Qué vende realmente este producto o servicio?** (Emoción, estatus, solución, transformación, energía, rendimiento).
- **¿Qué quiere sentir el público objetivo?** (Confianza, felicidad, fuerza, alivio, éxito).
- **¿Cuál es la historia visual más impactante para contar en un solo anuncio?** (¿Producto como héroe en su entorno, persona usando el producto, metáfora visual?).
- **Estrategia Visual Dominante (Elige UNA y descríbela):**
    - **A) Producto Protagonista en Escenario:** El producto real en primer plano, integrado en un fondo generado que evoca el beneficio o ambiente (ej. zapato en calle elegante, proteína en gimnasio).
    - **B) Experiencia con Personas:** Mostrar personas reales interactuando con el producto/servicio para ilustrar el beneficio o estilo de vida (ej. familia con bicicleta, gente feliz con un servicio).
    - **C) Concepto Abstracto/Simbolismo:** Para ideas intangibles o servicios donde una metáfora visual es más efectiva (ej. nubes para la "nube" informática, flechas para el crecimiento).
    - **D) Detalle o Primer Plano Enfatizado:** Enfocarse en una parte clave del producto o un detalle estético que comunica la calidad o innovación.

Usa este análisis para guiar TODA la creatividad a continuación.

---
### 3. Instrucciones de Generación de Campaña

**Paso A: Generación de Concepto Creativo Central**
Basado en tu análisis estratégico, genera **UN ÚNICO Y PODEROSO Concepto Creativo Visual** para toda la campaña. Este concepto debe detallar la escena, los personajes (si aplica), el ambiente, la iluminación y la interacción con el producto/servicio. Deberá ser la base para la imagen principal del anuncio y estar alineado con la **Estrategia Visual Dominante** elegida. **Si el producto es físico y la estrategia es "Producto Protagonista", la descripción debe indicar explícitamente que el producto debe integrarse de forma fotorrealista como un "asset" pre-existente.**

**Paso B: Generación de Textos y Audiencias**
Genera un **Nombre de campaña** original y alineado al objetivo.
Luego, crea **3 variantes de anuncio** de texto, cada una con un ángulo único:
- **Variante 1: Emocional:** Conecta con los sentimientos y valores del público.
- **Variante 2: Racional:** Enfócate en la lógica y los beneficios tangibles.
- **Variante 3: Aspiracional:** Muestra el estilo de vida o el resultado ideal.

**Para CADA una de las 3 variantes, incluye lo siguiente:**
- **Título del anuncio (máx. 40 chars):** Atractivo, claro y enfocado en un beneficio.
- **Texto principal (máx. 125 chars):** Persuasivo y que refuerce el ángulo de la variante.
- **CTA (Call to Action):** Único para cada variante, corto y orientado a la acción.
- **Audiencias (2 sugerencias):** Sugiere dos grupos de audiencias específicas para Meta Ads.

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
Eres un experto en marketing digital con más de 15 años de experiencia en Google Ads.  
Tu tarea es generar **1 campaña completa** basada en los datos de un cliente y entregar la información lista para guardarse en la base de datos con la siguiente estructura:

**Datos del cliente (variables de BD):**
- Nombre de la empresa o marca: {business_name} (BD: business_name)
- Industria o sector: {industry} (BD: industry)
- Producto o servicio a promocionar: {product_service} (BD: product_service)
- Propuesta de valor: {value_proposition} (BD: value_proposition)
- Objetivo de la campaña: {campaign_goal} (BD: campaign_goal)
- Público objetivo: {target_audience} (BD: target_audience)
- Ubicaciones de anuncios: {locations} (BD: locations)
- Presupuesto y moneda: {budget_amount} {budget_currency} (BD: budget_amount, budget_currency)
- Duración de la campaña: {duration} (BD: duration)
- Estilo de anuncio: {ad_style} (BD: ad_style)
- Call to action (CTA): {call_to_action} (BD: call_to_action)
- Tipo de destino y valor: {landing_type}, {landing_page} (BD: landing_type, landing_page)

---

### Instrucciones de generación:
1. Genera un **Nombre de campaña** original, creativo y alineado al objetivo. (BD: campaign_name)  
2. Crea **3 variantes de anuncio generadas por IA**, diferenciadas en enfoque y mensaje:
   - Variante 1: **emocional** → conexión humana + storytelling breve + beneficio principal del producto.
   - Variante 2: **racional** → ventajas concretas, métricas, ahorro, calidad o diferenciadores claros.
   - Variante 3: **aspiracional** → estilo de vida, estatus o logro deseado al usar el producto.

Para cada variante incluye:
- **Título sugerido** (máx. 30 caracteres, claro, atractivo, relacionado con la propuesta de valor)
- **Descripción corta** (máx. 90 caracteres, directa, persuasiva y alineada a las variables de BD)
- **Keywords recomendadas** (3–5 por variante, incluyendo short-tail, long-tail, exact match y phrase match)
- **CTA** (breve, persuasivo, distinto para cada variante y en formato “acción + beneficio”)
- **Estrategia de puja** (coherente con {campaign_goal} y presupuesto, por ejemplo: Maximizar conversiones, Maximizar clics, CPC manual)
- **Negative keywords** (mínimo 3, para filtrar tráfico irrelevante)
- **Extensiones de anuncio** (mínimo 2: sitelinks, llamada, destacados, promoción, etc.)

---

### Reglas de estilo y validación:
- Usa un tono persuasivo, natural y auténtico, adaptado a la industria.
- Evita exageraciones, claims irreales o abuso de mayúsculas/exclamaciones.
- Asegúrate que cada variante tenga **un ángulo único** y que no se repitan.
- Títulos y descripciones deben ser claros, específicos y alineados al público objetivo.
- CTAs deben ser distintos, claros y orientados a acción + beneficio.
- Keywords deben ser estratégicas, incluyendo short-tail, long-tail y variantes de coincidencia.
- Extensiones de anuncio deben aportar valor y reforzar la propuesta de valor.
- Todo el contenido debe cumplir las **políticas de Google Ads**.

---

### Formato de salida requerido (JSON para guardar en BD):
{
  "campaign_name": "...",
  "ai_ad_variants": [
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    }
  ],
  "stability_ai_prompt": "..." // SIEMPRE incluye este campo. Si no se debe generar prompt (por ejemplo, recursos = imagen_lista), pon null o "".
}
INSTRUCCIÓN CRÍTICA: El JSON de salida DEBE incluir SIEMPRE el campo "stability_ai_prompt". Si no corresponde generar prompt (por ejemplo, recursos = imagen_lista), pon el valor null o "". Si corresponde, genera el prompt textual listo para Stability AI, SIEMPRE en inglés (English only), y que NO EXCEDA los 2000 caracteres. No omitas nunca este campo.

`;

const BOTH_PROMPT = `
Eres un experto en marketing digital y creación de campañas para Meta Ads y Google Ads, con más de 15 años de experiencia.  
Tu tarea es generar **1 campaña completa** basada en los datos de un cliente y entregar la información lista para guardarse en la base de datos, asegurando máxima calidad, creatividad y coherencia.

**Datos del cliente (variables de BD):**
- Nombre de la empresa o marca: {business_name} (BD: business_name)
- Industria o sector: {industry} (BD: industry)
- Producto o servicio a promocionar: {product_service} (BD: product_service)
- Propuesta de valor: {value_proposition} (BD: value_proposition)
- Objetivo de la campaña: {campaign_goal} (BD: campaign_goal)
- Público objetivo: {target_audience} (BD: target_audience)
- Ubicaciones de anuncios: {locations} (BD: locations)
- Presupuesto y moneda: {budget_amount} {budget_currency} (BD: budget_amount, budget_currency)
- Duración de la campaña: {duration} (BD: duration)
- Estilo de anuncio: {ad_style} (BD: ad_style)
- Call to action (CTA): {call_to_action} (BD: call_to_action)
- Tipo de destino y valor: {landing_type}, {landing_page} (BD: landing_type, landing_page)

---

### Instrucciones de generación:

1. Genera un **Nombre de campaña** original, creativo y alineado al objetivo. (BD: campaign_name)  

2. Genera las campañas **Meta Ads**:
   - Crea **3 variantes de anuncio generadas por IA**, diferenciadas en ángulo: emocional, racional y aspiracional.
   - Para cada variante incluye:
     - **Título del anuncio** (máx. 40 caracteres, atractivo, único, alineado a la propuesta de valor, evitando genéricos)
     - **Texto principal** (máx. 125 caracteres, persuasivo, natural, resalta beneficio concreto o diferenciador, evita exageraciones)
     - **CTA** (distinto en cada variante, acción + beneficio, no repetido)
     - **Ideas de imágenes/videos** (mínimo 3: producto en uso, estilo de vida aspiracional, prueba social; evita repetir elementos entre variantes)
     - **Formatos sugeridos** (carrusel, video, colección, imagen única; coherente con el enfoque del anuncio)
     - **Audiencias personalizadas/lookalikes** (mínimo 2, combinando intereses + comportamientos + lookalikes, sin duplicar entre variantes)
     - **Vista Previa** (breve descripción de cómo se verá el anuncio)
   - Verifica coherencia entre propuesta de valor, CTA, mensaje y landing page.
   (BD: meta_ai_ad_variants)

3. Genera las campañas **Google Ads**:
   - Crea **3 variantes de anuncio generadas por IA**, diferenciadas en ángulo: emocional, racional y aspiracional.
   - Para cada variante incluye:
     - **Título sugerido** (máx. 30 caracteres, único y atractivo)
     - **Descripción corta** (máx. 90 caracteres, persuasiva y alineada a la propuesta de valor)
     - **Keywords recomendadas** (3–5 por variante: short-tail, long-tail, exact match, phrase match; evita repetir keywords entre variantes)
     - **CTA** (distinto para cada variante, acción + beneficio)
     - **Estrategia de puja** (coherente con objetivo y presupuesto: Maximizar conversiones, Maximizar clics, CPC manual)
     - **Negative keywords** (mínimo 3 por variante, evita tráfico irrelevante)
     - **Extensiones de anuncio** (mínimo 2: sitelinks, llamada, destacados, promoción, coherentes con el mensaje)
   - Asegúrate de que títulos, descripciones, CTAs, keywords y extensiones sean **únicos y estratégicos** entre las variantes.
   (BD: google_ai_ad_variants)

---

### Reglas de estilo y validación:

- Tono persuasivo, auténtico y adaptado a la industria y público objetivo.
- Evitar claims irreales, exageraciones o abuso de mayúsculas/exclamaciones.
- Cada variante debe aportar **un ángulo único**, sin repetir palabras clave, CTAs, formatos o ideas visuales entre variantes.
- Validar coherencia entre propuesta de valor, landing page, público, CTA y mensaje del anuncio.
- Todo contenido debe cumplir con las **políticas de Meta Ads y Google Ads**.
- Mantener un balance creativo y estratégico: beneficios claros + emoción + aspiración según la variante.

---

### Formato de salida requerido (JSON para guardar en BD):
{
  "campaign_name": "...",
  "meta_ai_ad_variants": [
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    }
  ],

  "google_ai_ad_variants": [
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "...", "..."],
      "ad_extensions": ["...", "..."]
    }
  ],
  "vertex_ai_prompt": "..." // SIEMPRE incluye este campo. Si no se debe generar prompt (por ejemplo, recursos = imagen_lista), pon null o "".
}
INSTRUCCIÓN CRÍTICA: El JSON de salida DEBE incluir SIEMPRE el campo "vertex_ai_prompt". Si no corresponde generar prompt (por ejemplo, recursos = imagen_lista), pon el valor null o "". Si corresponde, genera el prompt textual listo para Vertex AI, SIEMPRE en inglés (English only), y que NO EXCEDA los 2000 caracteres. No omitas nunca este campo.

Usa la información del cliente (empresa, sector, producto/servicio, propuesta de valor, público objetivo, estilo de anuncio, acción deseada y destino de clic) y genera un prompt detallado para Vertex AI que cree una imagen publicitaria profesional. - Si el cliente tiene una foto (recursos = foto_existente), la IA debe usarla como referencia para mejorarla, ajustando composición, estilo y formato según la plataforma. - Si el cliente ya tiene un anuncio (recursos = imagen_lista), no generar prompt para Vertex; usar la imagen subida tal cual. - Si el cliente tiene solo ideas (recursos = solo_ideas) o no tiene nada (recursos = nada), generar un prompt que cree la imagen desde cero, aplicando composición, colores, estilo y formato según la plataforma y público objetivo. Devuelve solo el prompt textual listo para enviar a Vertex, sin explicaciones adicionales.
`;



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
  // Mostrar el JSON generado por OpenAI en la consola del navegador
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
