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
  credential: admin.credential.cert(serviceAccount)
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
  try {
    const opportunity = req.body.opportunity;
    if (!opportunity || !opportunity.targetProfile) {
      return res.status(400).json({ success: false, error: 'Faltan datos de oportunidad.' });
    }
    console.log('[ExecuteAttack] opportunity recibido:', opportunity);

      // Inicialización y mapeo completo de campaignDataForAI
      const campaignDataForAI = {
        business_name: opportunity.targetProfile.companyName || 'Empresa Desconocida',
        industry: opportunity.targetProfile.industry || 'Servicios profesionales',
        product_service: opportunity.product_service || 'Solución personalizada',
        value_proposition: opportunity.signalText || 'Propuesta de valor no especificada',
        campaign_goal: opportunity.campaign_goal || 'Generar oportunidad de venta directa',
        target_audience: `${opportunity.targetProfile.name || ''}${opportunity.targetProfile.jobTitle ? ', ' + opportunity.targetProfile.jobTitle : ''}`.trim(),
        locations: opportunity.locations || ['Ciudad de México'],
        budget_amount: opportunity.budget_amount || 1000,
        budget_currency: opportunity.budget_currency || 'USD',
        duration: opportunity.duration || '7 días',
        ad_style: opportunity.ad_style || 'Directo, personalizado, enfocado en dolor',
        call_to_action: opportunity.call_to_action || 'Agenda una llamada',
        landing_type: opportunity.landing_type || 'Formulario de contacto',
        landing_page: opportunity.landing_page || 'https://ejemplo.com/contacto',
        ad_platform: opportunity.ad_platform || 'LinkedIn',
        recursos: opportunity.recursos || ['Imagen profesional', 'Texto persuasivo'],
        descripcion: opportunity.descripcion || 'Campaña dirigida a un objetivo específico para resolver un dolor puntual.',
      };

      // Llamada a la función principal de IA
      const newCampaignResult = await generateCampaignAI(campaignDataForAI);
      console.log('[ExecuteAttack] Resultado IA:', newCampaignResult);
      // Parsear la respuesta si es string
      let parsedResult = newCampaignResult;
      if (typeof newCampaignResult === 'string') {
        try {
          parsedResult = JSON.parse(newCampaignResult);
        } catch (e) {
          throw new Error('La respuesta de la IA no es un JSON válido.');
        }
      }
      // Validación del resultado
      if (!parsedResult || !parsedResult.id) {
        throw new Error('La IA no devolvió un ID de campaña válido.');
      }
      // Respuesta exitosa con status 201 y el ID de la campaña
      return res.status(201).json({ success: true, newCampaignId: parsedResult.id });
  } catch (err) {
    console.error('[ExecuteAttack] Error:', err);
    // Si el error viene de la IA, mostrar el objeto completo si existe
    if (err.response && err.response.data) {
      console.error('[ExecuteAttack] Error IA:', err.response.data);
    }
    res.status(500).json({ success: false, error: err.message || 'Error interno del servidor.' });
  }
});

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
