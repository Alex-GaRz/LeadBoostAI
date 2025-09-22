// src/services/VertexAIService.ts

const API_BASE_URL = 'http://localhost:4000'; // Asegúrate de que coincida con el puerto de tu backend

/**
 * Genera una imagen utilizando el backend que se comunica con Vertex AI.
 * @param prompt - El prompt de texto para la generación de la imagen.
 * @returns La imagen generada en formato base64.
 */
export async function generateImageWithVertex(prompt: string): Promise<string> {
  try {
    console.log('Enviando solicitud de imagen a Vertex AI a través del backend...');
    const response = await fetch(`${API_BASE_URL}/api/vertexai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success || !data.image) {
      throw new Error('La respuesta del backend no fue exitosa o no contenía una imagen.');
    }

    console.log('Imagen base64 recibida del backend.');
    return data.image;

  } catch (error) {
    console.error('Error al generar imagen con Vertex AI:', error);
    throw error;
  }
}
