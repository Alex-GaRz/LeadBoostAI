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
Eres un experto en marketing digital y creación de campañas de Meta Ads.
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

**Instrucciones de generación:**
1. Genera un **Nombre de campaña** original y creativo. (BD: campaign_name)
2. Crea **3 variantes de anuncio generadas por IA**. Para cada variante, incluye:
   - Título del anuncio
   - Texto principal
   - CTA
   - Ideas de imágenes/videos
   - Formatos sugeridos (carrusel, video, colección, etc.)
   - Audiencias personalizadas/lookalikes
   - Vista Previa (una descripción breve de cómo se verá el anuncio)
   (BD: ai_ad_variants)


**Formato de salida requerido (JSON para guardar en BD):**
{
  "campaign_name": "...",
  "ai_ad_variants": [
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    }
  ],
  
}

**Nota:** Sé creativo, profesional y enfocado en resultados. Cada variante debe estar adaptada al público, presupuesto, objetivo y estilo proporcionado.
`;

const GOOGLE_PROMPT = `
Eres un experto en marketing digital y creación de campañas de Google Ads.
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

**Instrucciones de generación:**
1. Genera un **Nombre de campaña** original y creativo. (BD: campaign_name)
2. Crea **3 variantes de anuncio generadas por IA**. Para cada variante, incluye:
   - Título sugerido
   - Descripción corta
   - Keywords recomendadas
   - CTA
   - Estrategia de puja
   - Negative keywords
   - Extensiones de anuncio
   (BD: ai_ad_variants)


**Formato de salida requerido (JSON para guardar en BD):**
{
  "campaign_name": "...",
  "ai_ad_variants": [
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "..."],
      "ad_extensions": ["...", "..."]
    }
  ],

}

**Nota:** Sé creativo, profesional y enfocado en resultados. Cada variante debe estar adaptada al público, presupuesto, objetivo y estilo proporcionado.
`;

const BOTH_PROMPT = `
Eres un experto en marketing digital y creación de campañas para Meta Ads y Google Ads.
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

**Instrucciones de generación:**
1. Genera un **Nombre de campaña** original y creativo. (BD: campaign_name)
2. Genera las campañas **Meta Ads**:
   - Crea **3 variantes de anuncio generadas por IA**. Para cada variante, incluye:
     - Título del anuncio
     - Texto principal
     - CTA
     - Ideas de imágenes/videos
     - Formatos sugeridos
     - Audiencias personalizadas/lookalikes
     - Vista Previa (una descripción breve de cómo se verá el anuncio)
     (BD: meta_ai_ad_variants)

3. Genera las campañas **Google Ads**:
   - Crea **3 variantes de anuncio generadas por IA**. Para cada variante, incluye:
     - Título sugerido
     - Descripción corta
     - Keywords recomendadas
     - CTA
     - Estrategia de puja
     - Negative keywords
     - Extensiones de anuncio
     (BD: google_ai_ad_variants)


**Formato de salida requerido (JSON para guardar en BD):**
{
  "campaign_name": "...",
  "meta_ai_ad_variants": [
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    },
    {
      "title": "...",
      "main_text": "...",
      "cta": "...",
      "image_video_ideas": ["...", "..."],
      "recommended_formats": ["...", "..."],
      "audiences": ["...", "..."],
      "preview": "..."
    }
  ],

  "google_ai_ad_variants": [
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "..."],
      "ad_extensions": ["...", "..."]
    },
    {
      "suggested_title": "...",
      "short_description": "...",
      "recommended_keywords": ["...", "..."],
      "cta": "...",
      "bidding_strategy": "...",
      "negative_keywords": ["...", "..."],
      "ad_extensions": ["...", "..."]
    }
  ],

}

**Nota:** Sé creativo, profesional y enfocado en resultados. Cada variante debe estar adaptada al público, presupuesto, objetivo y estilo proporcionado, generando campañas completas y coherentes para Meta Ads y Google Ads.
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
