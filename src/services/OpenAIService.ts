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
}

// --- Prompts Finales y Optimizados ---

const META_PROMPT = `
Eres un experto en marketing digital y creación de campañas Meta Ads.  
Tu tarea es generar 1 campaña completa basada en los datos de un cliente y entregar la información lista para guardarse en la base de datos con la siguiente estructura:

Datos del cliente (variables de BD)

Nombre de la empresa o marca: {business_name} (BD: business_name)  
Industria o sector: {industry} (BD: industry)  
Producto o servicio a promocionar: {product_service} (BD: product_service)  
Propuesta de valor: {value_proposition} (BD: value_proposition)  
Objetivo de la campaña: {campaign_goal} (BD: campaign_goal)  
Público objetivo: {target_audience} (BD: target_audience)  
Ubicaciones de anuncios: {locations} (BD: locations)  
Presupuesto y moneda: {budget_amount} {budget_currency} (BD: budget_amount, budget_currency)  
Duración de la campaña: {duration} (BD: duration)  
Estilo de anuncio: {ad_style} (BD: ad_style)  
Call to action (CTA): {call_to_action} (BD: call_to_action)  
Tipo de destino y valor: {landing_type}, {landing_page} (BD: landing_type, landing_page)

---

Instrucciones de generación

Genera un Nombre de campaña original, creativo y alineado al objetivo. (BD: campaign_name)  
Crea 3 variantes de anuncio generadas por IA, diferenciadas en enfoque y mensaje:  

- Variante 1: Emocional → conexión humana + beneficio principal del producto, integrando información de las variables de BD.  
- Variante 2: Racional → comparaciones, métricas, ahorro, calidad o diferenciadores concretos.  
- Variante 3: Aspiracional → estilo de vida, estatus o cambio deseado que se logra usando el producto.

Para cada variante incluye:

- Título del anuncio (máx. 40 caracteres, específico, atractivo y relacionado con la propuesta de valor, usando un beneficio concreto o diferenciador).  
- Texto principal (máx. 125 caracteres, directo, natural, alineado a las variables de BD, resaltando un beneficio concreto o diferenciador; evita claims absolutos o exageraciones).  
- CTA (distinto en cada variante, breve, persuasivo y en formato “acción + beneficio”, ej.: “Compra y ahorra hoy”).  
- Ideas de imágenes/videos (mínimo 3, combinando producto en uso, estilo de vida aspiracional y prueba social; al menos una debe mostrar uso real del producto, otra estilo de vida aspiracional y otra prueba social con clientes o micro-influencers).  
- Formatos sugeridos (carrusel, video, colección, imagen única, según el enfoque del anuncio).  
- Audiencias personalizadas/lookalikes (mínimo 2 por variante, combinando intereses + comportamientos + lookalikes, específicas y alineadas al público objetivo).  
- Vista Previa (descripción breve de cómo se verá el anuncio).

Reglas adicionales de estilo y validación

- Tono persuasivo, natural y auténtico, evitando exageraciones o frases poco creíbles.  
- Cada variante debe aportar un ángulo único y no repetirse.  
- Los títulos deben ser específicos y diferenciadores, evitando genéricos como “Economía y Estilo” o “La mejor opción”.  
- Texto principal debe resaltar beneficios concretos, integrando datos de la BD, métricas o diferenciadores claros (ej.: % de ahorro, durabilidad, sostenibilidad).  
- Cada CTA debe ser único y relevante al objetivo de la campaña.  
- Ideas visuales deben reflejar uso real del producto por el público objetivo y aspiraciones reales.  
- Audiencias deben ser concretas y adaptadas al target, evitando términos genéricos.  
- Mantener coherencia entre propuesta de valor, landing page y mensaje del anuncio.  
- Cumplir con las políticas de Meta Ads (no prometer resultados absolutos).

---

Formato de salida requerido (JSON para guardar en BD)
{
  "campaign_name": "...",
  "ai_ad_variants": [
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
  ]
}
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
  ]
}

**Nota:** Sé creativo, profesional y enfocado en resultados. Cada variante debe estar adaptada al público, presupuesto, objetivo y estilo proporcionado, generando campañas completas, coherentes y listas para Meta Ads y Google Ads, evitando repeticiones y maximizando impacto.
`;



/**
 * Reemplaza los placeholders en el prompt con los datos de la campaña.
 */
function buildPrompt(promptTemplate: string, data: CampaignData): string {
  let prompt = promptTemplate;
  const variables = {
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
  };

  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(key, 'g'), value);
  }

  return prompt;
}

/**
 * Genera contenido de campaña usando la API de OpenAI.
 * @param data - Los datos de la campaña del formulario.
 * @returns El objeto JSON con los datos de la campaña generados por la IA.
 */
export async function generateCampaignAI(data: CampaignData): Promise<any> {
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

  const prompt = buildPrompt(promptTemplate, data);

  try {
    const response = await fetch('/api/openai/generate-campaign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, prompt }),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Error al generar la campaña con IA');
    }
    // El backend devuelve el JSON como string, así que lo parseamos
    return JSON.parse(result.result);
  } catch (error) {
    throw new Error('Hubo un problema al generar la campaña. Inténtelo de nuevo más tarde.');
  }
}
