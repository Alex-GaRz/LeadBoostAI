// backend/openai.js
const fetch = require('node-fetch');


/**
 * Llama a OpenAI para generar campaña o prompt de imagen.
 * @param data - Debe incluir 'prompt'.
 * @param expectJson - Si true, fuerza response_format: json_object. Si false, no lo incluye.
 */
async function generateCampaignAI(data, expectJson = true) {
  const API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  if (!API_KEY) throw new Error('OPENAI_API_KEY no configurada');

  let prompt = data.prompt;
  // Instrucción especial para campañas quirúrgicas
  const SPECIAL_INSTRUCTION = "INSTRUCCIÓN ESPECIAL: Esta campaña es un 'ataque quirúrgico' dirigido a UNA SOLA PERSONA o empresa. El campo 'target_audience' describe a ese objetivo específico. El campo 'value_proposition' es el dolor exacto que han expresado. Usa un tono directo y personal, y enfoca el 100% del copy en resolver ese dolor puntual. Incluye SIEMPRE un campo 'id' único para la campaña generada, por ejemplo: 'id': 'campaña-123'.";
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
    throw new Error(`Error OpenAI: ${errorData}`);
  }
  const result = await response.json();
  return result.choices[0]?.message?.content;
}

module.exports = { generateCampaignAI };
