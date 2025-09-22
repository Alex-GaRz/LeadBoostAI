// backend/vertexai.js

const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const { helpers } = require('@google-cloud/aiplatform');

// --- Configuración de Vertex AI ---
// Estos valores deben coincidir con tu configuración en Google Cloud.
const PROJECT_ID = 'leadboost-ai-1966c';
const LOCATION = 'us-central1';
const PUBLISHER = 'google';
const MODEL = 'imagen-3.0-generate-002'; // Revisa la documentación para el modelo más reciente si es necesario

// Inicializa el cliente del servicio de predicción.
// La autenticación se gestiona automáticamente a través de la variable de entorno GOOGLE_APPLICATION_CREDENTIALS.
const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};
const predictionServiceClient = new PredictionServiceClient(clientOptions);

/**
 * Genera una imagen utilizando la API de Vertex AI.
 * @param {string} prompt - El prompt de texto para la generación de la imagen.
 * @returns {Promise<string>} - La imagen generada en formato base64.
 */
async function generateImageWithVertexAI(prompt) {
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/${PUBLISHER}/models/${MODEL}`;

  const instance = {
    prompt: prompt,
  };
  const parameters = {
    sampleCount: 1, // Generar una sola imagen
  };

  const request = {
    endpoint,
    instances: [instance].map(instance => helpers.toValue(instance)),
    parameters: helpers.toValue(parameters),
  };

  try {
    console.log('Enviando solicitud a Vertex AI...');
    const [response] = await predictionServiceClient.predict(request);
    
    if (!response.predictions || response.predictions.length === 0) {
      throw new Error('La respuesta de Vertex AI no contiene predicciones.');
    }

    // Extrae la imagen en formato base64 de la respuesta
    const imageBase64 = response.predictions[0].structValue.fields.bytesBase64Encoded.stringValue;
    console.log('Imagen recibida de Vertex AI.');
    
    return imageBase64;

  } catch (error) {
    console.error('Error al generar la imagen con Vertex AI:', error);
    throw new Error('Fallo en la comunicación con la API de Vertex AI.');
  }
}

module.exports = { generateImageWithVertexAI };
