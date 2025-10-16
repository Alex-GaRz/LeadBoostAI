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

  const prompt = `Eres un copywriter de élite. Tu ángulo de ataque es "${strategyResult.angle}" y tu mensaje clave es "${strategyResult.key_message}". 

Tu misión es escribir 3 variantes de anuncios dirigidos directamente a ${targetProfile.name || 'el prospecto'}, que es ${targetProfile.jobTitle} en ${targetProfile.companyName}. 

INSTRUCCIONES CRÍTICAS:
1. Háblale en segunda persona ('tú') - dirígete directamente a él/ella
2. NO uses su nombre en el texto del anuncio, pero úsalo como contexto para tu escritura
3. Sé extremadamente conciso y potente
4. Cada anuncio debe tener: título (máximo 8 palabras) y texto (máximo 40 palabras)
5. Usa el ángulo y mensaje clave proporcionados como base estratégica
6. Devuelve un objeto JSON con el array "ad_variants"

Formato de respuesta:
{
  "ad_variants": [
    {
      "title": "Título conciso del anuncio",
      "text": "Texto persuasivo máximo 40 palabras que conecte directamente con el dolor y la solución, hablándole en segunda persona"
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
  
  // Validación y estructura de respuesta
  const validatedResult = {
    ad_variants: copyResult.ad_variants || []
  };
  
  console.log('[Copywriter] FIN generateCampaignAI');
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
  
  const prompt = `Eres un director de arte experto en campañas publicitarias B2B. Tu misión es crear un prompt técnico y visual para una IA de imagen.

CONTEXTO DE LA CAMPAÑA:
- Ángulo estratégico: ${strategyResult.angle}
- Mensaje clave: ${strategyResult.key_message}
- Título del anuncio: ${mainAd.title}
- Texto del anuncio: ${mainAd.text}

INSTRUCCIONES:
1. Crea un prompt técnico para generar una imagen que complemente visualmente la estrategia y el mensaje
2. La imagen debe ser profesional, moderna y apropiada para el ángulo estratégico elegido
3. Incluye detalles específicos sobre composición, colores, estilo y elementos visuales
4. Máximo 150 palabras en el prompt de imagen
5. Devuelve un objeto JSON con el campo "image_prompt"

ESTILOS SEGÚN ÁNGULO:
- "Lógica/ROI": Gráficos, datos, profesional, colores azules/grises
- "Emocional/Alivio del Dolor": Personas, expresiones, colores cálidos
- "Prueba Social": Equipos, logotipos, testimonios, colores corporativos

Formato de respuesta:
{
  "image_prompt": "Prompt técnico detallado para la generación de imagen..."
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
