// backend/stabilityai.js
const fetch = require('node-fetch');

async function generateImage(prompt) {
  const API_KEY = process.env.STABILITY_AI_API_KEY;
  const API_HOST = 'https://api.stability.ai';
  if (!API_KEY) throw new Error('STABILITY_AI_API_KEY no configurada');



  const endpoint = `${API_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`;
  const body = {
    text_prompts: [{ text: prompt, weight: 1 }],
    cfg_scale: 7,
    clip_guidance_preset: 'FAST_BLUE',
    samples: 1,
    steps: 30,
    width: 1024,
    height: 1024
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error Stability AI: ${errorText}`);
  }
  const data = await response.json();
  const image = data.artifacts[0];
  if (image.finishReason === 'ERROR' || image.finishReason === 'CONTENT_FILTERED') {
    throw new Error(`La generación de la imagen falló: ${image.finishReason}`);
  }
  return `data:image/png;base64,${image.base64}`;
}

// image-to-image
async function generateImageToImage(prompt, imageBuffer) {
  const API_KEY = process.env.STABILITY_AI_API_KEY;
  const API_HOST = 'https://api.stability.ai';
  if (!API_KEY) throw new Error('STABILITY_AI_API_KEY no configurada');

  const endpoint = `${API_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image`;
  const formData = new FormData();
  formData.append('init_image', new Blob([imageBuffer]), 'init_image.png');
  formData.append('init_image_mode', 'IMAGE_STRENGTH');
  formData.append('image_strength', '0.35');
  formData.append('text_prompts[0][text]', prompt);
  formData.append('text_prompts[0][weight]', '1');
  formData.append('cfg_scale', '7');
  formData.append('clip_guidance_preset', 'FAST_BLUE');
  formData.append('samples', '1');
  formData.append('steps', '30');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: formData,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error Stability AI (image-to-image): ${errorText}`);
  }
  const data = await response.json();
  const image = data.artifacts[0];
  if (image.finishReason === 'ERROR' || image.finishReason === 'CONTENT_FILTERED') {
    throw new Error(`La generación de la imagen falló: ${image.finishReason}`);
  }
  return `data:image/png;base64,${image.base64}`;
}

module.exports = { generateImage, generateImageToImage };
module.exports = { generateImage, generateImageToImage };
