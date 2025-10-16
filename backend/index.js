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



const { generateCampaignAI, analyzeSignal, defineStrategy, createImagePrompt } = require('./openai');
const { generateImageWithVertexAI } = require('./vertexai');

// Nuevo endpoint traductor: recibe opportunity, traduce y ejecuta generación de campaña
app.post('/api/execute-attack', async (req, res) => {
    console.log('[API] Endpoint /api/execute-attack alcanzado.');
    console.log('[API] Headers recibidos:', req.headers);
    console.log('[API] Body completo recibido:', JSON.stringify(req.body, null, 2));
    
    try {
        // 1. Recibir y validar los datos del front-end (opportunity, strategyId y userId)
        const { opportunity, strategyId } = req.body;
        const userId = opportunity?.userId;
        const opportunityId = opportunity?.id;
        const planId = strategyId;

        if (!opportunity || !strategyId || !userId || !opportunityId) {
            console.error('[API] Error: Faltan datos críticos en la petición.');
            return res.status(400).json({ error: "Faltan datos críticos (opportunity, strategyId, opportunityId o userId)." });
        }

        // 2. Crear o verificar que existe el documento de oportunidad
        const dbRef = admin.firestore();
        const opportunityRef = dbRef.doc(`clients/${userId}/battle_plans/${planId}/opportunities/${opportunityId}`);
        
        // Verificar si el documento existe, si no, crearlo
        const opportunityDoc = await opportunityRef.get();
        if (!opportunityDoc.exists) {
            console.log('[API] Documento de oportunidad no existe, creándolo...');
            await opportunityRef.set({
                ...opportunity,
                ai_pipeline_results: {}
            });
        }
        // 3. Analizar la señal usando IA
        console.log('[PIPELINE 1/4] Iniciando Analista...');
        const analysisResult = await analyzeSignal(opportunity.signalText);
        console.log('[PIPELINE 1/4] Analista completado. Resultado:', analysisResult);
        // 4. Guardar el resultado del análisis
        await opportunityRef.update({
          'ai_pipeline_results.analysisResult': analysisResult
        });
        // 5. Ejecutar la etapa Estratega
        console.log('[PIPELINE 2/4] Iniciando Estratega...');
        const strategyResult = await defineStrategy(analysisResult, opportunity.targetProfile);
        console.log('[PIPELINE 2/4] Estratega completado. Resultado:', strategyResult);
        // 6. Guardar el resultado de la estrategia
        await opportunityRef.update({
          'ai_pipeline_results.strategyResult': strategyResult
        });
        // 7. Ejecutar la etapa Copywriter
        console.log('[PIPELINE 3/4] Iniciando Copywriter...');
        const copyResult = await generateCampaignAI(strategyResult, opportunity.targetProfile);
        console.log('[PIPELINE 3/4] Copywriter completado. Resultado:', copyResult);
        // 8. Guardar el resultado del copywriting
        await opportunityRef.update({
          'ai_pipeline_results.copyResult': copyResult
        });
        
        // 9. Ejecutar la etapa Director de Arte
        console.log('[PIPELINE 4/4] Iniciando Director de Arte (Prompt)...');
        const imagePromptResult = await createImagePrompt(strategyResult, copyResult);
        console.log('[PIPELINE 4/4] Director de Arte (Prompt) completado. Resultado:', imagePromptResult);
        console.log('[API] Resultado del Director de Arte:', imagePromptResult);
        
        // 10. Guardar el prompt de imagen
        await opportunityRef.update({
          'ai_pipeline_results.imagePromptResult': imagePromptResult
        });
        
        // 11. Recopilar todos los resultados en un objeto final (SIN imagen aún)
        const finalCampaignData = {
          // Identificadores
          strategyId: strategyId,
          opportunityId: opportunityId,
          
          // Información del prospecto
          target_audience: `${opportunity.targetProfile.jobTitle} en ${opportunity.targetProfile.companyName}`,
          business_name: opportunity.targetProfile.companyName,
          
          // Resultados del pipeline de IA
          pain_point: analysisResult.pain_point,
          brand_mentioned: analysisResult.brand_mentioned,
          sentiment: analysisResult.sentiment,
          
          strategy_angle: strategyResult.angle,
          key_message: strategyResult.key_message,
          
          ad_variants: copyResult.ad_variants,
          image_prompt: imagePromptResult.image_prompt,
          generated_image_url: '', // Se actualizará después
          
          // Metadatos
          created_at: new Date().toISOString(),
          campaign_type: 'surgical_attack',
          status: 'generating',
          
          // Campo name requerido para compatibilidad
          name: `Campaña para ${opportunity.targetProfile.companyName}`,
          
          // Datos originales de la oportunidad para referencia
          original_signal: opportunity.signalText,
          target_profile: opportunity.targetProfile
        };
        
        // 12. Guardar la campaña para obtener el ID
        const db = admin.firestore();
        const campaignCollectionRef = db.collection(`clients/${userId}/campaigns`);
        const campaignDocRef = await campaignCollectionRef.add(finalCampaignData);
        const campaignId = campaignDocRef.id;
        
        console.log('[API] Campaña inicial guardada con ID:', campaignId);
        
        // 13. Generar la imagen usando el campaignId
        let generated_image_url = '';
        if (imagePromptResult.image_prompt && imagePromptResult.image_prompt.trim().length > 0) {
          try {
            console.log('[PIPELINE 4/4] Generando imagen...');
            const imageResult = await generateImageWithVertexAI(
              imagePromptResult.image_prompt, 
              userId, 
              campaignId
            );
            generated_image_url = imageResult.imageUrl || '';
            console.log('[PIPELINE 4/4] Generación de imagen completada. URL:', generated_image_url);
          } catch (imageError) {
            console.error('[API] Error generando imagen:', imageError);
            generated_image_url = ''; // Continuar sin imagen si falla
          }
        } else {
          console.log('[API] Prompt de imagen vacío, saltando generación de imagen.');
        }
        
        // 14. Actualizar la campaña con la URL de la imagen y cambiar status
        await campaignDocRef.update({
          generated_image_url: generated_image_url,
          status: 'generated'
        });
        
        // 15. Guardar la URL de la imagen generada en la oportunidad
        await opportunityRef.update({
          'ai_pipeline_results.generated_image_url': generated_image_url
        });
        
        // 16. Obtener la campaña actualizada para la respuesta
        const updatedCampaign = await campaignDocRef.get();
        const finalCampaignDataComplete = updatedCampaign.data();
        
        console.log('[PIPELINE] Todas las etapas completadas con éxito. Creando documento final en "campaigns".');
        
        // 17. Respuesta final con todos los resultados
        console.log('[API] Preparando respuesta final para el frontend...');
        const responseData = {
          success: true,
          message: "Pipeline completo ejecutado: Análisis, estrategia, copy, imagen y campaña guardada.",
          campaignId: campaignId,
          campaignResult: {
            // Primero los datos de Firestore
            ...finalCampaignDataComplete,
            // Luego sobrescribimos con los datos específicos que necesitamos
            id: campaignId,
            name: finalCampaignDataComplete.name,
            business_name: finalCampaignDataComplete.business_name,
            generated_image_url: generated_image_url,
            ad_platform: finalCampaignDataComplete.ad_platform,
            ai_ad_variants: copyResult.ad_variants || finalCampaignDataComplete.ad_variants || [],
            meta_ai_ad_variants: copyResult.ad_variants || finalCampaignDataComplete.ad_variants || [],
            analysisResult,
            strategyResult,
            copyResult,
            imagePromptResult
          }
        };
        console.log('[API] Enviando respuesta exitosa al frontend:', JSON.stringify(responseData, null, 2));
        return res.status(200).json(responseData);
        
    } catch (error) {
        console.error("[API] ERROR CRÍTICO en /api/execute-attack:", error);
        console.error("[API] Stack trace completo:", error.stack);
        const errorResponse = { 
          success: false,
          error: "Error interno al ejecutar el ataque.",
          details: error.message,
          timestamp: new Date().toISOString()
        };
        console.log('[API] Enviando respuesta de error al frontend:', JSON.stringify(errorResponse, null, 2));
        res.status(500).json(errorResponse);
    }
}); // <-- Cierre correcto de la función y la ruta

// Multer para manejo de archivos
const multer = require('multer');
const upload = multer();

// NOTA: Endpoint temporalmente deshabilitado - requiere refactorización para nueva firma de generateCampaignAI
/*
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
*/

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
    // Validar estructura de radarConfig
    const validRadarConfig = radarConfig && typeof radarConfig === 'object'
      && radarConfig.profile && typeof radarConfig.profile === 'object'
      && radarConfig.signals && typeof radarConfig.signals === 'object'
      && radarConfig.triggers && typeof radarConfig.triggers === 'object';
    if (!validRadarConfig) {
      return res.status(400).json({ error: 'Estructura de radarConfig inválida. Debe contener profile, signals y triggers.' });
    }
    // Validar que los campos multi-valor sean arrays
    const multiArrayFields = [
      'industries', 'companySizes', 'locations', 'jobTitles',
      'competitors', 'frustrationKeywords', 'searchKeywords', 'excludeKeywords'
    ];
    for (const field of multiArrayFields) {
      let section = field in radarConfig.profile ? radarConfig.profile : radarConfig.signals;
      if (section[field] && !Array.isArray(section[field])) {
        return res.status(400).json({ error: `El campo ${field} debe ser un array.` });
      }
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
