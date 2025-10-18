// backend/vertexai.js

const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
const { helpers } = require('@google-cloud/aiplatform');
const admin = require('firebase-admin');

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
 * Sube una imagen en base64 a Firebase Storage usando arquitectura atómica.
 * La ruta del archivo usa directamente el campaignId para garantizar consistencia.
 * @param {string} imageBase64 - La imagen en formato base64.
 * @param {string} userId - ID del usuario para la ruta del archivo.
 * @param {string} campaignId - ID de la campaña (debe existir en Firestore).
 * @returns {Promise<string>} - La URL pública de la imagen subida.
 */
async function uploadImageToStorage(imageBase64, userId, campaignId) {
  try {
    // Convertir base64 a buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    // ARQUITECTURA ATÓMICA: Usar directamente el campaignId para nombrar la carpeta
    // Esto garantiza que cada documento de campaña tenga su carpeta única correspondiente
    const fileName = `clients/${userId}/campaigns/${campaignId}/generated_image.png`;
    
    // Obtener referencia al bucket de Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file(fileName);
    
    // Subir el archivo
    console.log('[Storage ATÓMIC] Subiendo imagen usando arquitectura atómica:', fileName);
    console.log('[Storage ATÓMIC] CampaignId:', campaignId);
    
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          userId: userId,
          campaignId: campaignId,
          createdAt: new Date().toISOString(),
          atomicArchitecture: true, // Marcador para identificar la nueva arquitectura
          description: 'Imagen generada usando arquitectura atómica campaignId -> Storage folder'
        }
      }
    });
    
    // Hacer el archivo público y obtener la URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    console.log('[Storage ATÓMIC] ✅ Imagen subida exitosamente con arquitectura atómica. URL:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('[Storage ATÓMIC] ❌ Error subiendo imagen:', error);
    throw new Error('Error al subir imagen a Firebase Storage: ' + error.message);
  }
}

/**
 * Genera una imagen utilizando la API de Vertex AI y la sube a Firebase Storage.
 * @param {string} prompt - El prompt de texto para la generación de la imagen.
 * @param {string} userId - ID del usuario para la ruta del archivo.
 * @param {string} campaignId - ID de la campaña.
 * @returns {Promise<object>} - Objeto con imageUrl y base64.
 */
async function generateImageWithVertexAI(prompt, userId = 'anonymous', campaignId = 'temp', imageBase64String = null, imageMime = 'image/png') {
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/${PUBLISHER}/models/${MODEL}`;

  // Log y validación del prompt
  console.log('[VertexAI] Prompt recibido:', prompt);
  // Diagnóstico para instrucciones de imagen
  if (typeof prompt === 'string' && prompt.includes('[INSTRUCCIONES DE IMAGEN]')) {
    const styleMatch = prompt.match(/Estilo: (.*)/);
    const descMatch = prompt.match(/Descripción: (.*)/);
    console.log('[VertexAI] Instrucciones de imagen detectadas:', {
      imageStyle: styleMatch ? styleMatch[1] : '',
      imageDescription: descMatch ? descMatch[1] : ''
    });
  }
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    console.error('[VertexAI] Error: Prompt vacío o inválido.');
    throw new Error('Prompt vacío o inválido recibido para generación de imagen.');
  }

  let instance;
  if (imageBase64String) {
    // Inpainting/composición: La imagen base64 debe ir dentro de un objeto anidado.
    instance = {
      prompt: prompt,
      image: {
        bytesBase64Encoded: imageBase64String
      }
      // El mimeType no es necesario aquí si ya está implícito en el formato
    };
    console.log('[VertexAI] Enviando instancia con imagen base64 para inpainting/composición.');
  } else {
    // Text-to-image
    instance = {
      prompt: prompt,
    };
  }
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
    
    // Subir la imagen a Firebase Storage
    const imageUrl = await uploadImageToStorage(imageBase64, userId, campaignId);
    
    return {
      imageUrl: imageUrl,
      base64: imageBase64
    };

  } catch (error) {
    console.error('Error al generar la imagen con Vertex AI:', error);
    throw new Error('Fallo en la comunicación con la API de Vertex AI.');
  }
}

module.exports = { generateImageWithVertexAI };
