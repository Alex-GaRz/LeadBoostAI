// src/services/VertexAIService.ts

const API_BASE_URL = 'http://localhost:4000'; // Asegúrate de que coincida con el puerto de tu backend

/**
 * Genera una imagen utilizando el backend que se comunica con Vertex AI.
 * @param prompt - El prompt de texto para la generación de la imagen.
 * @param imageFile - Opcional. El archivo de imagen para los escenarios de image-to-image.
 * @returns La imagen generada en formato base64.
 */
export async function generateImageWithVertex(prompt: string, imageFile?: File): Promise<string> {
  try {
    console.log('Enviando solicitud de imagen a Vertex AI a través del backend...');
    
    const formData = new FormData();
    formData.append('prompt', prompt);
    if (imageFile) {
      formData.append('init_image', imageFile);
    }

    const response = await fetch(`${API_BASE_URL}/api/vertexai/generate-image`, {
      method: 'POST',
      body: formData, // No se necesita 'Content-Type', el navegador lo establece automáticamente para FormData
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
