// src/services/StabilityAIService.ts

const API_KEY = import.meta.env.VITE_STABILITY_AI_API_KEY;
const API_HOST = 'https://api.stability.ai';

interface GenerationResponse {
    artifacts: Array<{
        base64: string;
        seed: number;
        finishReason: string;
    }>;
}

export const generateImage = async (prompt: string, initImage?: File): Promise<string> => {
    if (!API_KEY) {
        throw new Error('La API Key de Stability AI no está configurada.');
    }

    const formData = new FormData();
    formData.append('text_prompts[0][text]', prompt);
    formData.append('text_prompts[0][weight]', "1");
    formData.append('cfg_scale', "7");
    formData.append('clip_guidance_preset', 'FAST_BLUE');
    formData.append('samples', "1");
    formData.append('steps', "30");

    let endpoint = '';
    if (initImage) {
        formData.append('init_image', initImage);
        formData.append('init_image_mode', "IMAGE_STRENGTH");
        formData.append('image_strength', "0.35");
        endpoint = `${API_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image`;
    } else {
        endpoint = `${API_HOST}/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image`;
    }

    const response = await fetch(
        endpoint,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${API_KEY}`,
            },
            body: formData,
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error en la API de Stability AI: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = (await response.json()) as GenerationResponse;
    const image = data.artifacts[0];

    if (image.finishReason === 'ERROR' || image.finishReason === 'CONTENT_FILTERED') {
        throw new Error(`La generación de la imagen falló con motivo: ${image.finishReason}`);
    }

    return `data:image/png;base64,${image.base64}`;
};
