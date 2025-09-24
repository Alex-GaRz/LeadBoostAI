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

  const prompt = data.prompt;
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1,
  };
  if (expectJson) {
    body.response_format = { type: 'json_object' };
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
