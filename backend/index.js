// --- DOCUMENTACIÓN DEL MAPEADO DE CAMPOS ---
// Este endpoint traduce el objeto 'opportunity' recibido del front-end al formato 'CampaignData' requerido por el motor de IA.
// Mapeo principal:
//   business_name        <- opportunity.targetProfile.companyName
//   target_audience      <- `${opportunity.targetProfile.jobTitle} en ${opportunity.targetProfile.companyName}`
//   value_proposition    <- opportunity.signalText
//   campaign_goal        <- Valor por defecto: 'Generar oportunidad de venta'
//   channel              <- Valor por defecto: 'LinkedIn'
//   budget               <- Valor por defecto: 100
//   start_date           <- Fecha actual
//   end_date             <- Fecha actual + 7 días
// Otros campos pueden ser añadidos según necesidades futuras.
// --- FIN DOCUMENTACIÓN ---
// backend/index.js


const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Inicializar Firebase Admin con credenciales de servicio
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "leadboost-ai-1966c.firebasestorage.app"
});


const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend funcionando y seguro!');
});



const { generateCampaignAI } = require('./openai');
const { generateImageWithVertexAI } = require('./vertexai');

// Nuevo endpoint traductor: recibe opportunity, traduce y ejecuta generación de campaña
app.post('/api/execute-attack', async (req, res) => {
    console.log('[API] Endpoint /api/execute-attack alcanzado.');
    try {
        // 1. Recibir y validar los datos del front-end (opportunity, strategyId y userId)
        const { opportunity, strategyId } = req.body;
        const userId = opportunity?.userId; // O como sea que obtengas el userId

        if (!opportunity || !strategyId || !userId) {
            console.error('[API] Error: Faltan datos críticos en la petición.');
            return res.status(400).json({ error: "Faltan datos críticos (opportunity, strategyId o userId)." });
        }

        // 2. "Traducir" la Oportunidad al formato CampaignData (tu lógica existente)
        const campaignDataForAI = {
            business_name: opportunity.targetProfile.companyName,
            value_proposition: opportunity.signalText,
            target_audience: `El objetivo es ${opportunity.targetProfile.name}, ${opportunity.targetProfile.jobTitle}`,
            // ... y todos los demás campos por defecto que ya definimos
        };

      // Leer el battle_plan desde Firestore
      const battlePlanRef = db.collection(`clients/${userId}/battle_plans`).doc(strategyId);
      const battlePlanDoc = await battlePlanRef.get();
      if (!battlePlanDoc.exists) {
        return res.status(404).json({ error: 'battle_plan no encontrado' });
      }
      const battlePlan = battlePlanDoc.data();
  // Extraer prompt principal y campos de imagen desde radarConfig
  const campaignPrompt = battlePlan?.prompt || req.body.prompt;
  const imageStyle = battlePlan?.radarConfig?.imageStyle || req.body.imageStyle || '';
  const imageDescription = battlePlan?.radarConfig?.imageDescription || req.body.imageDescription || '';
      // Llamar a la IA para generar la campaña, pasando instrucciones de imagen
      const aiResult = await generateCampaignAI({ prompt: campaignPrompt, strategyId, imageStyle, imageDescription }, userId, strategyId, true);

      // Generar imagen con Vertex AI si hay instrucciones de imagen
      let generatedImageUrl = '';
      if (imageStyle || imageDescription) {
        // Construir prompt técnico para imagen
        const artDirectorPrompt = `Genera una imagen para la campaña. Estilo: ${imageStyle}. Descripción: ${imageDescription}.`;
        try {
          const imageBase64 = await generateImageWithVertexAI(artDirectorPrompt);
          // Subir imagen a Firebase Storage y obtener URL
          const bucket = admin.storage().bucket();
          const fileName = `clients/${userId}/campaign_images/${aiResult.id || Date.now()}.png`;
          const file = bucket.file(fileName);
          await file.save(Buffer.from(imageBase64, 'base64'), {
            contentType: 'image/png',
            public: true
          });
          // Hacer pública la imagen y obtener URL
          await file.makePublic();
          generatedImageUrl = file.publicUrl();
          console.log('[API] Imagen subida a Storage. URL:', generatedImageUrl);
        } catch (imgErr) {
          console.error('[API] Error al generar/subir imagen:', imgErr);
        }
      }

      // Añadir la URL generada al resultado de la campaña y guardar en Firestore
      if (generatedImageUrl) {
        aiResult.generated_image_url = generatedImageUrl;
        // Actualizar el documento de campaña en Firestore
        try {
          const db = admin.firestore();
          const campaignCollectionRef = db.collection(`clients/${userId}/campaigns`);
          await campaignCollectionRef.doc(aiResult.id).update({ generated_image_url: generatedImageUrl });
        } catch (firestoreErr) {
          console.error('[API] Error al actualizar la campaña con la URL de imagen:', firestoreErr);
        }
      }

        // 4. Validar que la IA devolvió un resultado válido
        if (!aiResult || !aiResult.id) {
            throw new Error("La generación de IA no devolvió un resultado con ID válido.");
        }

        // 5. ***** LA CORRECCIÓN CRÍTICA *****
        // Nos aseguramos de devolver el RESULTADO DE LA IA (`aiResult`), 
        // no los datos de entrada (`campaignDataForAI`).
        console.log('[API] Éxito. Enviando resultado de la IA al front-end:', aiResult);
        res.status(201).json({ success: true, campaignResult: aiResult });

    } catch (error) {
        console.error("[API] ERROR CRÍTICO en /api/execute-attack:", error);
        res.status(500).json({ error: "Error interno al ejecutar el ataque." });
    }
}); // <-- Cierre correcto de la función y la ruta

// Multer para manejo de archivos
const multer = require('multer');
const upload = multer();

app.post('/api/openai/generate-campaign', async (req, res) => {
  try {
    // Permitir que el frontend indique si espera JSON o texto plano
    const expectJson = req.body.expectJson !== false; // por defecto true
    const result = await generateCampaignAI(req.body, expectJson);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[OpenAI] Error completo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Soporta ambos: text-to-image (solo prompt) y image-to-image (prompt + archivo)
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const db = getFirestore();

app.post('/api/battle-plans', async (req, res) => {
  try {
    const {
      planName,
      playbookType,
      userId,
      radarConfig
    } = req.body;

    // Validación básica
    if (!planName || !playbookType || !userId || !radarConfig) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    // Construir el objeto del plan de batalla
    const battlePlanData = {
      planName,
      playbookType,
      status: 'ACTIVE',
      createdAt: Timestamp.now(),
      userId,
      radarConfig,
      automationMode: 'MANUAL'
    };

    // Crear el documento en Firestore
    const docRef = await db
      .collection('clients')
      .doc(userId)
      .collection('battle_plans')
      .add(battlePlanData);

    res.status(201).json({ success: true, planId: docRef.id });
  } catch (error) {
    console.error('[BattlePlan] Error al crear el plan:', error.message);
    res.status(500).json({ error: 'Error al crear el plan de batalla.' });
  }
});

app.post('/api/vertexai/generate-image', upload.single('init_image'), async (req, res) => {
  try {
    const prompt = req.body.prompt;

    // --- CÓDIGO A AÑADIR ---
    console.log('--- PROMPT FINAL RECIBIDO POR EL BACKEND ---');
    console.log(prompt);
    console.log('--------------------------------------------');
    // --- FIN DEL CÓDIGO A AÑADIR ---
    let imageBase64;
    if (req.file) {
      // Escenario 1: inpainting/composición
      console.log('[IA] Se recibió una imagen de referencia. Procediendo a generar imagen con prompt + imagen (inpainting/composición).');
      // Convertir buffer a base64
      const imageBuffer = req.file.buffer;
      const imageMime = req.file.mimetype || 'image/png';
      const imageBase64String = imageBuffer.toString('base64');
      // Llamar a Vertex AI con prompt + imagen
      imageBase64 = await generateImageWithVertexAI(prompt, imageBase64String, imageMime);
    } else {
      // Escenarios text-to-image
      console.log('[IA] Generando imagen solo con prompt usando Vertex AI');
      imageBase64 = await generateImageWithVertexAI(prompt);
    }
    if (!imageBase64) {
      console.error('[IA] No se recibió imagen de Vertex AI');
      return res.status(500).json({ success: false, error: 'No se recibió imagen de la IA' });
    }
    // Devolvemos la imagen en base64
    return res.json({ success: true, image: imageBase64 });

  } catch (err) {
    console.error('[IA] Error al generar imagen con Vertex AI:', err);
    res.status(500).json({ success: false, error: err.message || 'Error desconocido en el backend' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en el puerto ${PORT}`);
});
