// --- ETAPA 2: Estratega ---
// Función asíncrona que define el ángulo de marketing y mensaje clave
async function defineStrategy(analysisResult, targetProfile) {
  const fetch = require('node-fetch');
  const API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  const prompt = `Eres un director de estrategia de marketing B2B. Recibe el siguiente análisis de prospecto y perfil objetivo. Devuelve un objeto JSON válido con dos campos: \n- "angle": elige uno de ['Lógica/ROI', 'Emocional/Alivio del Dolor', 'Prueba Social'] según el contexto.\n- "key_message": una frase concisa que resuma el ángulo estratégico.\n\nAnálisis: ${JSON.stringify(analysisResult)}\nPerfil objetivo: ${JSON.stringify(targetProfile)}\nJSON:`;
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Responde siempre en formato JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  };
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    let strategyResult = result.choices?.[0]?.message?.content;
    if (typeof strategyResult === 'string') {
      try {
        strategyResult = JSON.parse(strategyResult);
      } catch (e) {
        strategyResult = { angle: '', key_message: '' };
      }
    }
    return {
      angle: strategyResult.angle || '',
      key_message: strategyResult.key_message || ''
    };
  } catch (err) {
    return { angle: '', key_message: '' };
  }
}
// Analista IA: función robusta para analizar el texto de la señal
async function analyzeSignal(signalText) {
  const fetch = require('node-fetch');
  const API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  const prompt = `\nAnaliza el siguiente texto de un prospecto. Tu única salida debe ser un objeto JSON válido.\nExtrae el 'dolor principal' (pain_point), la 'marca' o 'producto' mencionado (brand_mentioned), y el 'sentimiento' (sentiment: "frustración", "curiosidad", "interés").\nSi no puedes identificar un campo, devuélvelo como un string vacío.\nTexto: "${signalText}"\nJSON:`;
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Responde siempre en formato JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  };
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    let aiResultObject = result.choices?.[0]?.message?.content;
    if (typeof aiResultObject === 'string') {
      try {
        aiResultObject = JSON.parse(aiResultObject);
      } catch (e) {
        aiResultObject = { pain_point: '', brand_mentioned: '', sentiment: '' };
      }
    }
    // Validación de campos vacíos
    return {
      pain_point: aiResultObject.pain_point || '',
      brand_mentioned: aiResultObject.brand_mentioned || '',
      sentiment: aiResultObject.sentiment || ''
    };
  } catch (err) {
    return { pain_point: '', brand_mentioned: '', sentiment: '' };
  }
}

module.exports = { analyzeSignal };
// backend/openai.js
const fetch = require('node-fetch');


/**
 * Llama a OpenAI para generar campaña o prompt de imagen.
 * @param data - Debe incluir 'prompt'.
 * @param expectJson - Si true, fuerza response_format: json_object. Si false, no lo incluye.
 */
const admin = require('firebase-admin');

/**
 * --- ETAPA 3: Copywriter ---
 * Genera variantes de anuncios basadas en la estrategia definida previamente.
 * @param strategyResult - Resultado del estratega (angle y key_message).
 * @param targetProfile - Perfil del prospecto objetivo.
 * @param expectJson - Si true, fuerza response_format: json_object.
 */
async function generateCampaignAI(strategyResult, targetProfile, expectJson = true) {
  console.log('[Copywriter] INICIO generateCampaignAI');
  console.log('[Copywriter] Parámetros recibidos:', { strategyResult, targetProfile, expectJson });
  
  const API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  if (!API_KEY) throw new Error('OPENAI_API_KEY no configurada');

  const prompt = `Eres un copywriter de élite especializado en campañas de alta conversión. Tu ángulo de ataque es "${strategyResult.angle}" y tu mensaje clave es "${strategyResult.key_message}". 

Tu misión es escribir EXACTAMENTE 3 variantes de anuncios dirigidos directamente a ${targetProfile.name || 'el prospecto'}, que es ${targetProfile.jobTitle} en ${targetProfile.companyName}. 

INSTRUCCIONES CRÍTICAS - CUMPLE EXACTAMENTE:
1. Genera EXACTAMENTE 3 variantes de anuncios (ni más, ni menos)
2. Háblale en segunda persona ('tú') - dirígete directamente a él/ella
3. NO uses su nombre en el texto del anuncio, pero úsalo como contexto para tu escritura
4. Sé extremadamente conciso y potente
5. Cada anuncio debe tener: título (máximo 8 palabras) y texto (máximo 40 palabras)
6. Usa el ángulo y mensaje clave proporcionados como base estratégica
7. Cada variante debe ser diferente pero mantener la consistencia estratégica
8. Devuelve un objeto JSON con el array "ad_variants" conteniendo exactamente 3 elementos

FORMATO DE RESPUESTA OBLIGATORIO:
{
  "ad_variants": [
    {
      "title": "Título conciso del primer anuncio",
      "text": "Texto persuasivo máximo 40 palabras que conecte directamente con el dolor y la solución"
    },
    {
      "title": "Título conciso del segundo anuncio", 
      "text": "Texto persuasivo máximo 40 palabras con enfoque diferente pero mismo ángulo estratégico"
    },
    {
      "title": "Título conciso del tercer anuncio",
      "text": "Texto persuasivo máximo 40 palabras con tercer enfoque complementario"
    }
  ]
}`;

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Responde siempre en formato JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    response_format: { type: 'json_object' }
  };

  console.log('[Copywriter] Enviando request a OpenAI...');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[Copywriter] Error de respuesta OpenAI:', errorData);
    throw new Error(`Error OpenAI: ${errorData}`);
  }
  
  const result = await response.json();
  console.log('[Copywriter] Respuesta de OpenAI recibida:', result);
  
  let copyResult = result.choices[0]?.message?.content;
  // Si la respuesta es string, intentar parsear a objeto
  if (typeof copyResult === 'string') {
    try {
      copyResult = JSON.parse(copyResult);
      console.log('[Copywriter] JSON parseado correctamente:', copyResult);
    } catch (e) {
      console.error('[Copywriter] Error al parsear JSON:', copyResult);
      copyResult = { ad_variants: [] };
    }
  }
  
  // Validación estricta para asegurar exactamente 3 variantes
  let adVariants = copyResult.ad_variants || [];
  
  // Validar que tenemos exactamente 3 variantes
  if (!Array.isArray(adVariants) || adVariants.length !== 3) {
    console.warn('[Copywriter] ⚠️ La IA no devolvió exactamente 3 variantes. Cantidad recibida:', adVariants.length);
    
    // Si tenemos menos de 3, completar con variantes por defecto
    while (adVariants.length < 3) {
      const variantNumber = adVariants.length + 1;
      adVariants.push({
        title: `${strategyResult.angle} - Variante ${variantNumber}`,
        text: `${strategyResult.key_message} Descubre cómo optimizar tu estrategia hoy mismo.`
      });
    }
    
    // Si tenemos más de 3, recortar a exactamente 3
    if (adVariants.length > 3) {
      adVariants = adVariants.slice(0, 3);
    }
    
    console.log('[Copywriter] ✅ Corregido a exactamente 3 variantes:', adVariants.length);
  }
  
  // Validar estructura de cada variante
  adVariants = adVariants.map((variant, index) => ({
    title: variant.title || `Variante ${index + 1}`,
    text: variant.text || `${strategyResult.key_message} - Texto por defecto`
  }));
  
  const validatedResult = {
    ad_variants: adVariants
  };
  
  console.log('[Copywriter] ✅ FIN generateCampaignAI - 3 variantes validadas');
  console.log('[Copywriter] Variantes finales:', validatedResult.ad_variants.map((v, i) => `${i+1}. ${v.title}`));
  return validatedResult;
}

// --- ETAPA 4: Director de Arte ---
// Función que crea un prompt técnico para generación de imagen basado en la estrategia y copy
async function createImagePrompt(strategyResult, copyResult) {
  console.log('[Director de Arte] INICIO createImagePrompt');
  console.log('[Director de Arte] Parámetros recibidos:', { strategyResult, copyResult });
  
  const fetch = require('node-fetch');
  const API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  
  // Obtener el primer anuncio como referencia principal
  const mainAd = copyResult.ad_variants?.[0] || { title: '', text: '' };
  console.log('[Director de Arte] Anuncio principal seleccionado:', mainAd);
  
  const prompt = `Eres un director de arte experto en campañas publicitarias B2B. Tu misión es crear UNA IMAGEN MAESTRA que funcione perfectamente con las 3 variantes de texto generadas.

CONTEXTO DE LA CAMPAÑA:
- Ángulo estratégico: ${strategyResult.angle}
- Mensaje clave: ${strategyResult.key_message}
- Anuncio principal (referencia): ${mainAd.title} - ${mainAd.text}
- Total de variantes de texto: 3 (esta imagen debe complementar todas)

INSTRUCCIONES PARA LA IMAGEN MAESTRA:
1. Crea UN prompt técnico para generar UNA SOLA IMAGEN que sea versátil y funcione con las 3 variantes de texto
2. La imagen debe ser conceptual y estratégica, no literal a un solo texto específico
3. Debe ser profesional, moderna y apropiada para el ángulo estratégico elegido
4. Incluye detalles específicos sobre composición, colores, estilo y elementos visuales
5. Máximo 150 palabras en el prompt de imagen
6. La imagen debe ser escalable y adaptable para diferentes formatos publicitarios
7. Devuelve un objeto JSON con el campo "image_prompt"

ESTILOS OPTIMIZADOS SEGÚN ÁNGULO:
- "Lógica/ROI": Gráficos conceptuales, dashboards, métricas visuales, colores azules/grises corporativos
- "Emocional/Alivio del Dolor": Transformación visual, antes/después, expresiones de alivio, colores cálidos
- "Prueba Social": Equipos colaborando, logos de clientes, testimonials visuales, colores corporativos confiables

Formato de respuesta:
{
  "image_prompt": "Prompt técnico detallado para generar la imagen maestra que complementará las 3 variantes de texto..."
}`;

  console.log('[Director de Arte] Prompt generado para OpenAI:', prompt.substring(0, 200) + '...');

  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Responde siempre en formato JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  };

  try {
    console.log('[Director de Arte] Enviando request a OpenAI...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    console.log('[Director de Arte] Respuesta de OpenAI recibida:', result);
    
    let imagePromptResult = result.choices?.[0]?.message?.content;
    if (typeof imagePromptResult === 'string') {
      try {
        imagePromptResult = JSON.parse(imagePromptResult);
        console.log('[Director de Arte] JSON parseado correctamente:', imagePromptResult);
      } catch (e) {
        console.error('[Director de Arte] Error al parsear JSON:', imagePromptResult);
        imagePromptResult = { image_prompt: '' };
      }
    }
    
    const finalResult = {
      image_prompt: imagePromptResult.image_prompt || ''
    };
    
    console.log('[Director de Arte] FIN createImagePrompt - Resultado final:', finalResult);
    return finalResult;
  } catch (err) {
    console.error('[Director de Arte] Error en createImagePrompt:', err);
    return { image_prompt: '' };
  }
}

module.exports = { analyzeSignal, generateCampaignAI, defineStrategy, createImagePrompt };
