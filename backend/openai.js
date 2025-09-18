// backend/openai.js
const fetch = require('node-fetch');

async function generateCampaignAI(data) {
  const API_KEY = process.env.OPENAI_API_KEY;
  const API_URL = 'https://api.openai.com/v1/chat/completions';
  if (!API_KEY) throw new Error('OPENAI_API_KEY no configurada');

  // Aquí deberías construir el prompt igual que en tu frontend
  // Por ahora, solo lo pasamos directo
  const prompt = data.prompt;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Error OpenAI: ${errorData}`);
  }
  const result = await response.json();
  return result.choices[0]?.message?.content;
}

module.exports = { generateCampaignAI };
