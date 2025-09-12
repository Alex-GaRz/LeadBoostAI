// src/services/StabilityAIService.ts


export const generateImage = async (prompt: string): Promise<string> => {
    const response = await fetch('/api/stabilityai/generate-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error || 'Error al generar la imagen');
    }
    return data.image;
};
