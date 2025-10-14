// backend/openai.js
const fetch = require('node-fetch');


/**
 * Llama a OpenAI para generar campaña o prompt de imagen.
 * @param data - Debe incluir 'prompt'.
 * @param expectJson - Si true, fuerza response_format: json_object. Si false, no lo incluye.
 */
const admin = require('firebase-admin');

/**
 * Llama a OpenAI para generar campaña y guarda el resultado en Firestore.
 * @param data - Debe incluir 'prompt'.
 * @param userId - ID del usuario para la ruta de Firestore.
 * @param expectJson - Si true, fuerza response_format: json_object. Si false, no lo incluye.
 */
async function generateCampaignAI(data, userId, strategyId, expectJson = true) {
  console.log('[Motor IA] INICIO generateCampaignAI');
  console.log('[Motor IA] Parámetros recibidos:', { data, userId, expectJson });
  // Diagnóstico para instrucciones de imagen
  if (data.imageStyle || data.imageDescription) {
    console.log('[Motor IA] Instrucciones de imagen recibidas:', {
      imageStyle: data.imageStyle,
      imageDescription: data.imageDescription
    });
  }
  const API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  if (!API_KEY) throw new Error('OPENAI_API_KEY no configurada');

  let prompt = data.prompt;
  // Si hay instrucciones de imagen, agrégalas al prompt
  if (data.imageStyle || data.imageDescription) {
    prompt += `\n[INSTRUCCIONES DE IMAGEN]\nEstilo: ${data.imageStyle || ''}\nDescripción: ${data.imageDescription || ''}`;
  }
  // Instrucción especial para campañas quirúrgicas
  const SPECIAL_INSTRUCTION = "INSTRUCCIÓN ESPECIAL: Esta campaña es un 'ataque quirúrgico' dirigido a UNA SOLA PERSONA o empresa. El campo 'target_audience' describe a ese objetivo específico. El campo 'value_proposition' es el dolor exacto que han expresado. Usa un tono directo y personal, y enfoca el 100% del copy en resolver ese dolor puntual.";
  // Si se espera JSON, aseguramos que el prompt contenga la palabra 'json' y la instrucción especial
  if (expectJson) {
    body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Responde siempre en formato JSON.' },
        { role: 'user', content: `${SPECIAL_INSTRUCTION}\n${prompt?.includes('json') ? prompt : `${prompt}\nResponde en formato json.`}` }
      ],
      temperature: 1,
      response_format: { type: 'json_object' }
    };
  } else {
    body = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: `${SPECIAL_INSTRUCTION}\n${prompt}` }
      ],
      temperature: 1,
    };
  }

  console.log('[Motor IA] Enviando request a OpenAI...');
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
    console.error('[Motor IA] Error de respuesta OpenAI:', errorData);
    throw new Error(`Error OpenAI: ${errorData}`);
  }
  const result = await response.json();
  console.log('[Motor IA] Respuesta de OpenAI recibida:', result);
  let aiResultObject = result.choices[0]?.message?.content;
  // Si la respuesta es string, intentar parsear a objeto
  if (typeof aiResultObject === 'string') {
    try {
      aiResultObject = JSON.parse(aiResultObject);
      console.log('[Motor IA] JSON parseado correctamente:', aiResultObject);
    } catch (e) {
      console.error('[Motor IA] Error al parsear JSON:', aiResultObject);
      throw new Error('La respuesta de la IA no es un JSON válido.');
    }
  }
  // Logging de diagnóstico
  // Forzar el campo 'name' a ser el nombre de la empresa objetivo o un valor personalizado
  aiResultObject.name = (aiResultObject.business_name || 'Campaña sin nombre');
  // Eliminar el campo 'id' si existe
  if ('id' in aiResultObject) {
    delete aiResultObject.id;
  }
  // Forzar el campo 'strategyId' desde el parámetro si existe
  if (strategyId) {
    aiResultObject.strategyId = strategyId;
  } else if (data.strategyId) {
    aiResultObject.strategyId = data.strategyId;
  }
  console.log('[Motor IA] Intentando guardar en la colección: clients/' + userId + '/campaigns');
  console.log('[Motor IA] Objeto a guardar:', aiResultObject);
  // Guardar en Firestore usando add() para que Firestore genere el ID automáticamente
  try {
    const db = admin.firestore();
    const campaignCollectionRef = db.collection(`clients/${userId}/campaigns`);
    const docRef = await campaignCollectionRef.add(aiResultObject);
    console.log('[Motor IA] Documento guardado con éxito en Firestore con ID:', docRef.id);
    console.log('[Motor IA] FIN generateCampaignAI');
    return { success: true, id: docRef.id, ...aiResultObject };
  } catch (err) {
    console.error('[Motor IA] Error al guardar en Firestore:', err);
    throw new Error('Error al guardar la campaña en Firestore: ' + err.message);
  }
}

module.exports = { generateCampaignAI };
