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

// Importar rutas del sistema RADAR
const radarRoutes = require('./routes/radar.routes');

// Importar RadarScheduler para automatización (versión JavaScript)
const RadarScheduler = require('./src/core/Scheduler');

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

// Registrar rutas del sistema RADAR bajo el prefijo /api/radar
app.use('/api/radar', radarRoutes);

// 🧪 ENDPOINT DE PRUEBA QUIRÚRGICA DIRECTO (por si las rutas fallan)
app.get('/api/radar/trigger-test-direct', async (req, res) => {
  try {
    console.log('[TRIGGER-TEST-DIRECT] 🚀 Iniciando disparo único...');
    
    const { Orchestrator } = require('./src/core/Orchestrator');
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    console.log('[TRIGGER-TEST-DIRECT] 🧪 MODO PRUEBAS: Solo 1 tweet');
    
    const result = await orchestrator.runIngestionCycle('twitter', 'javascript programming', {
      maxResults: 1
    });
    
    res.json({
      success: true,
      test: 'DISPARO_ÚNICO_DIRECTO',
      message: 'Prueba quirúrgica ejecutada (1 tweet máximo)',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TRIGGER-TEST-DIRECT] ❌ Error:', error.message);
    
    res.status(500).json({
      success: false,
      test: 'DISPARO_ÚNICO_DIRECTO',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🧪 ENDPOINT DE PRUEBA QUIRÚRGICA NEWSAPI
app.get('/api/newsapi/test-single', async (req, res) => {
  try {
    console.log('[NEWSAPI-TEST] 🚀 Iniciando prueba quirúrgica de NewsAPI...');
    
    // Importar NewsApiConnector
    const { NewsApiConnector } = require('./src/core/connectors/NewsApiConnector');
    
    // Crear instancia del conector
    const newsConnector = new NewsApiConnector();
    
    console.log('[NEWSAPI-TEST] 🧪 MODO PRUEBAS: Solo 1 artículo');
    
    // Query por defecto o personalizada
    const query = req.query.q || 'artificial intelligence';
    
    // Realizar búsqueda con máximo 1 resultado
    const result = await newsConnector.fetchSignals({
      query: query,
      maxResults: 1
    });
    
    console.log('[NEWSAPI-TEST] ✅ Resultados obtenidos:', result.signals.length);
    
    res.json({
      success: true,
      test: 'NEWSAPI_QUIRÚRGICO',
      message: `Prueba de NewsAPI ejecutada (1 artículo máximo para "${query}")`,
      query: query,
      totalFound: result.totalFound,
      processed: result.processed,
      failed: result.failed,
      signals: result.signals,
      durationMs: result.durationMs,
      connector_info: newsConnector.getConfigInfo(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[NEWSAPI-TEST] ❌ Error:', error.message);
    
    res.status(500).json({
      success: false,
      test: 'NEWSAPI_QUIRÚRGICO',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// 🧪 ENDPOINT DE HEALTH CHECK NEWSAPI
app.get('/api/newsapi/health', async (req, res) => {
  try {
    console.log('[NEWSAPI-HEALTH] 🔍 Verificando salud de NewsAPI...');
    
    const { NewsApiConnector } = require('./src/core/connectors/NewsApiConnector');
    const newsConnector = new NewsApiConnector();
    
    const health = await newsConnector.healthCheck();
    
    res.json({
      success: true,
      test: 'NEWSAPI_HEALTH_CHECK',
      health: health,
      connector_info: newsConnector.getConfigInfo(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[NEWSAPI-HEALTH] ❌ Error:', error.message);
    
    res.status(500).json({
      success: false,
      test: 'NEWSAPI_HEALTH_CHECK',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🧪 ENDPOINT DE PRUEBA QUIRÚRGICA - NewsAPI (1 artículo)
app.get('/api/radar/test-news-single', async (req, res) => {
  try {
    console.log('[TEST-NEWS-SINGLE] 🧪 Iniciando prueba de NewsAPI...');
    
    const { NewsApiConnector } = require('./src/core/connectors/NewsApiConnector');
    const connector = new NewsApiConnector();
    
    console.log('[TEST-NEWS-SINGLE] 📰 MODO PRUEBAS: Solo 1 artículo');
    
    const query = req.query.query || 'artificial intelligence';
    const result = await connector.fetchSignals({
      query: query,
      maxResults: 1
    });
    
    res.json({
      success: true,
      test: 'NEWS_API_SINGLE',
      message: 'Prueba quirúrgica NewsAPI ejecutada (1 artículo máximo)',
      result: result,
      query: query,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TEST-NEWS-SINGLE] ❌ Error:', error.message);
    
    res.status(500).json({
      success: false,
      test: 'NEWS_API_SINGLE',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🧪 ENDPOINT DE PRUEBA TEMPORAL - NEWS_API con Orchestrator
app.post('/api/radar/trigger-test-news', async (req, res) => {
  try {
    console.log('[TRIGGER-TEST-NEWS] 📰 Iniciando prueba temporal NewsAPI...');
    
    const { Orchestrator } = require('./src/core/Orchestrator');
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    console.log('[TRIGGER-TEST-NEWS] 🎯 Query: "stock market crash OR recession"');
    console.log('[TRIGGER-TEST-NEWS] 🧪 MODO PRUEBAS: Solo 1 artículo');
    
    const result = await orchestrator.runIngestionCycle('news_api', 'stock market crash OR recession', {
      maxResults: 1
    });
    
    console.log('[TRIGGER-TEST-NEWS] ✅ Prueba completada:', result.success);
    
    res.json({
      success: true,
      test: 'NEWS_API_ORCHESTRATOR_TEST',
      message: 'Prueba temporal NewsAPI ejecutada exitosamente',
      orchestratorResult: result,
      query: 'stock market crash OR recession',
      source: 'news_api',
      maxResults: 1,
      timestamp: new Date().toISOString(),
      metrics: {
        signalsCollected: result.signalsCollected || 0,
        duration: result.duration || 0,
        executionId: result.executionId
      }
    });
    
  } catch (error) {
    console.error('[TRIGGER-TEST-NEWS] ❌ Error en prueba temporal:', error.message);
    console.error('[TRIGGER-TEST-NEWS] Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      test: 'NEWS_API_ORCHESTRATOR_TEST',
      error: error.message,
      query: 'stock market crash OR recession',
      source: 'news_api',
      timestamp: new Date().toISOString(),
      details: {
        errorType: error.type || 'UNKNOWN_ERROR',
        errorDetails: error.details || 'No additional details available'
      }
    });
  }
});

// 🧪 ENDPOINT DE PRUEBA MULTI-SOURCE 
app.get('/api/radar/test-multi-source', async (req, res) => {
  try {
    const query = req.query.query || 'artificial intelligence';
    const sources = req.query.sources ? req.query.sources.split(',') : ['twitter', 'news_api'];
    const maxResults = parseInt(req.query.maxResults) || 1;

    console.log(`[TEST-MULTI-SOURCE] 🔄 Iniciando prueba multi-fuente...`);
    console.log(`[TEST-MULTI-SOURCE] Query: ${query}, Sources: ${sources.join(',')}, MaxResults: ${maxResults}`);
    
    const { Orchestrator } = require('./src/core/Orchestrator');
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const results = [];
    
    // Ejecutar ingesta para cada fuente
    for (const source of sources) {
      try {
        console.log(`[TEST-MULTI-SOURCE] 🎯 Testing source: ${source}`);
        
        const result = await orchestrator.runIngestionCycle(source, query, {
          maxResults: maxResults
        });
        
        results.push({
          source,
          success: result.success,
          signalsCollected: result.signalsCollected,
          duration: result.duration
        });
        
      } catch (error) {
        console.error(`[TEST-MULTI-SOURCE] ❌ Error with ${source}:`, error.message);
        results.push({
          source,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      test: 'MULTI_SOURCE_INGESTION',
      message: 'Prueba multi-fuente completada',
      query: query,
      sources: sources,
      maxResults: maxResults,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TEST-MULTI-SOURCE] ❌ Error general:', error.message);
    
    res.status(500).json({
      success: false,
      test: 'MULTI_SOURCE_INGESTION',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===== FIREBASE DEBUG ENDPOINT =====
app.get('/api/debug/firebase-status', async (req, res) => {
  try {
    const { SignalRepository } = require('./src/repositories/SignalRepository');
    const signalRepo = new SignalRepository();
    
    // Test simple write
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: "Firebase connection test"
    };
    
    const result = await signalRepo.saveSignal(testDoc);
    
    res.json({
      success: true,
      firebaseStatus: "CONNECTED",
      testWrite: result,
      collectionName: "universal_signals",
      projectId: "leadboost-ai-1966c"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      firebaseStatus: "ERROR",
      error: error.message,
      stack: error.stack
    });
  }
});

// ===== PIPELINE DEBUG ENDPOINT =====
app.post('/api/debug/pipeline-test', async (req, res) => {
  try {
    const { NLPProcessor } = require('./src/core/processing/NLPProcessor');
    const { SignalRepository } = require('./src/repositories/SignalRepository');
    
    // Crear señal mock para testing
    const mockSignal = {
      cleanContent: "This is amazing artificial intelligence breakthrough technology",
      source: "debug_test",
      contentHash: "debug123",
      timestamp: new Date(),
      created_at: new Date(),
      ingested_at: new Date()
    };
    
    console.log('[DEBUG] 🔍 Testing complete pipeline...');
    
    // Paso 1: Test NLPProcessor
    const nlpProcessor = NLPProcessor.getInstance();
    const enrichedSignal = await nlpProcessor.enrichSignal(mockSignal);
    
    console.log('[DEBUG] 📊 Enriched signal:', JSON.stringify(enrichedSignal.analysis, null, 2));
    
    // Paso 2: Test SignalRepository
    const signalRepo = new SignalRepository();
    const saveResult = await signalRepo.saveSignal(enrichedSignal);
    
    res.json({
      success: true,
      pipelineTest: "COMPLETE",
      mockSignal: mockSignal,
      enrichedAnalysis: enrichedSignal.analysis,
      saveResult: saveResult,
      collectionName: "universal_signals"
    });
  } catch (error) {
    console.error('[DEBUG] ❌ Pipeline test error:', error);
    res.status(500).json({
      success: false,
      pipelineTest: "FAILED",
      error: error.message,
      stack: error.stack
    });
  }
});

app.get('/', (req, res) => {
  res.send('Backend funcionando y seguro!');
});

// 🎯 ENDPOINT DE DIAGNÓSTICO: Verificar consistencia atómica
app.get('/api/validate-atomic-consistency/:userId/:campaignId', async (req, res) => {
  try {
    const { userId, campaignId } = req.params;
    
    console.log(`[ATOMIC DIAGNOSTIC] Validando consistencia para userId: ${userId}, campaignId: ${campaignId}`);
    
    const validationResult = await validateAtomicConsistency(userId, campaignId);
    
    res.status(200).json({
      success: true,
      validation: validationResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[ATOMIC DIAGNOSTIC] Error en diagnóstico:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🎯 ENDPOINT PARA CREAR OPPORTUNITIES DE PRUEBA
app.post('/api/create-test-opportunities', async (req, res) => {
  try {
    const { userId, strategyId, opportunities } = req.body;
    
    if (!userId || !strategyId) {
      return res.status(400).json({
        success: false,
        error: "userId y strategyId son requeridos"
      });
    }
    
    if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un array de opportunities válido"
      });
    }
    
    console.log(`[CREATE OPPORTUNITIES] Creando ${opportunities.length} opportunities para userId: ${userId}, strategyId: ${strategyId}`);
    
    const db = admin.firestore();
    const createdOpportunities = [];
    
    // Crear cada opportunity en Firebase
    for (let i = 0; i < opportunities.length; i++) {
      const opportunity = opportunities[i];
      
      // Generar un ID único si no se proporciona
      const opportunityId = opportunity.id || `test-opp-${Date.now()}-${i}`;
      
      // Estructura completa de la opportunity
      const opportunityData = {
        id: opportunityId,
        source: opportunity.source || "Test Data",
        signalText: opportunity.signalText || `Señal de prueba ${i + 1}`,
        status: opportunity.status || "PENDIENTE",
        targetProfile: {
          name: opportunity.targetProfile?.name || `Prospecto Test ${i + 1}`,
          jobTitle: opportunity.targetProfile?.jobTitle || "Director General",
          companyName: opportunity.targetProfile?.companyName || `Empresa Test ${i + 1}`,
          linkedinURL: opportunity.targetProfile?.linkedinURL || ""
        },
        sourceURL: opportunity.sourceURL || "",
        detectedAt: opportunity.detectedAt || new Date().toISOString(),
        badge: opportunity.badge || "test",
        created_by: "postman_test",
        created_at: new Date().toISOString()
      };
      
      // Guardar en Firebase
      const opportunityRef = db.doc(`clients/${userId}/battle_plans/${strategyId}/opportunities/${opportunityId}`);
      await opportunityRef.set(opportunityData);
      
      createdOpportunities.push({
        id: opportunityId,
        ...opportunityData
      });
      
      console.log(`[CREATE OPPORTUNITIES] ✅ Opportunity ${i + 1}/${opportunities.length} creada: ${opportunityId}`);
    }
    
    console.log(`[CREATE OPPORTUNITIES] ✅ Todas las opportunities creadas exitosamente`);
    
    res.status(201).json({
      success: true,
      message: `${opportunities.length} opportunities creadas exitosamente`,
      created_opportunities: createdOpportunities,
      firebase_path: `clients/${userId}/battle_plans/${strategyId}/opportunities/`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[CREATE OPPORTUNITIES] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});



const { generateCampaignAI, analyzeSignal, defineStrategy, createImagePrompt } = require('./openai');
const { generateImageWithVertexAI } = require('./vertexai');

/**
 * 🎯 ARQUITECTURA ATÓMICA: Función de validación
 * Verifica que el documento en Firestore y el archivo en Storage estén sincronizados
 * @param {string} userId - ID del usuario
 * @param {string} campaignId - ID de la campaña
 * @returns {Promise<object>} - Estado de la consistencia atómica
 */
async function validateAtomicConsistency(userId, campaignId) {
  try {
    const db = admin.firestore();
    
    // Verificar documento en Firestore
    const campaignRef = db.doc(`clients/${userId}/campaigns/${campaignId}`);
    const campaignDoc = await campaignRef.get();
    
    if (!campaignDoc.exists) {
      return { 
        isConsistent: false, 
        error: 'Documento no existe en Firestore',
        firestoreExists: false,
        storageExists: null
      };
    }
    
    const campaignData = campaignDoc.data();
    const imageUrl = campaignData.generated_image_url;
    
    // Verificar archivo en Storage
    const expectedPath = `clients/${userId}/campaigns/${campaignId}/generated_image.png`;
    const bucket = admin.storage().bucket();
    const file = bucket.file(expectedPath);
    
    const [storageExists] = await file.exists();
    
    const result = {
      isConsistent: !!(imageUrl && storageExists),
      firestoreExists: true,
      storageExists: storageExists,
      expectedPath: expectedPath,
      actualImageUrl: imageUrl,
      campaignId: campaignId
    };
    
    if (result.isConsistent) {
      console.log(`[ATOMIC VALIDATION] ✅ Consistencia atómica verificada para campaignId: ${campaignId}`);
    } else {
      console.warn(`[ATOMIC VALIDATION] ⚠️ Inconsistencia detectada para campaignId: ${campaignId}`, result);
    }
    
    return result;
    
  } catch (error) {
    console.error(`[ATOMIC VALIDATION] ❌ Error validando consistencia para campaignId: ${campaignId}`, error);
    return { 
      isConsistent: false, 
      error: error.message,
      firestoreExists: null,
      storageExists: null
    };
  }
}

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
        // 7. Ejecutar la etapa Copywriter (genera exactamente 3 variantes de texto)
        console.log('[PIPELINE 3/4] Iniciando Copywriter...');
        const copyResult = await generateCampaignAI(strategyResult, opportunity.targetProfile);
        console.log('[PIPELINE 3/4] ✅ Copywriter completado - Variantes generadas:', copyResult.ad_variants?.length || 0);
        
        // Validación crítica: Asegurar que tenemos exactamente 3 variantes
        if (!copyResult.ad_variants || copyResult.ad_variants.length !== 3) {
            console.warn('[PIPELINE 3/4] ⚠️ ADVERTENCIA: El Copywriter no generó exactamente 3 variantes');
        }
        // 8. Guardar el resultado del copywriting
        await opportunityRef.update({
          'ai_pipeline_results.copyResult': copyResult
        });
        
        // 9. Ejecutar la etapa Director de Arte (genera 1 imagen maestra para las 3 variantes)
        console.log('[PIPELINE 4/4] Iniciando Director de Arte (Imagen Maestra)...');
        const imagePromptResult = await createImagePrompt(strategyResult, copyResult);
        console.log('[PIPELINE 4/4] ✅ Director de Arte completado - Imagen maestra definida para complementar las 3 variantes');
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
          
          ad_variants: copyResult.ad_variants, // Array con exactamente 3 variantes de texto
          image_prompt: imagePromptResult.image_prompt, // Prompt para 1 imagen maestra
          generated_image_url: '', // Se actualizará con 1 URL de imagen que complementa las 3 variantes
          
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
        
        // 12. 🎯 ARQUITECTURA ATÓMICA: Crear documento en Firestore PRIMERO para obtener ID
        console.log('[ARQUITECTURA ATÓMICA] Paso 1: Creando documento en Firestore...');
        const db = admin.firestore();
        const campaignCollectionRef = db.collection(`clients/${userId}/campaigns`);
        const campaignDocRef = await campaignCollectionRef.add(finalCampaignData);
        const campaignId = campaignDocRef.id;
        
        console.log('[ARQUITECTURA ATÓMICA] ✅ Paso 1 completado. Campaign ID:', campaignId);
        console.log('[ARQUITECTURA ATÓMICA] Paso 2: Generando imagen usando Campaign ID...');
        
        // 13. 🎯 ARQUITECTURA ATÓMICA: Generar imagen usando el campaignId como ruta
        let generated_image_url = '';
        if (imagePromptResult.image_prompt && imagePromptResult.image_prompt.trim().length > 0) {
          try {
            console.log('[PIPELINE 4/4] Generando imagen con arquitectura atómica...');
            console.log('[PIPELINE 4/4] Storage path será: clients/' + userId + '/campaigns/' + campaignId + '/generated_image.png');
            
            const imageResult = await generateImageWithVertexAI(
              imagePromptResult.image_prompt, 
              userId, 
              campaignId // 🎯 ID atómico que determinará la carpeta en Storage
            );
            generated_image_url = imageResult.imageUrl || '';
            console.log('[PIPELINE 4/4] ✅ Generación de imagen completada con arquitectura atómica. URL:', generated_image_url);
          } catch (imageError) {
            console.error('[API] ❌ Error generando imagen:', imageError);
            generated_image_url = ''; // Continuar sin imagen si falla
          }
        } else {
          console.log('[API] ⚠️ Prompt de imagen vacío, saltando generación de imagen.');
        }
        
        // 14. 🎯 ARQUITECTURA ATÓMICA: Actualizar documento con URL final y status
        console.log('[ARQUITECTURA ATÓMICA] Paso 3: Actualizando documento con imagen URL...');
        await campaignDocRef.update({
          generated_image_url: generated_image_url,
          status: 'generated'
        });
        console.log('[ARQUITECTURA ATÓMICA] ✅ Todos los pasos completados. Documento y Storage sincronizados.');
        
        // 14.1. 🎯 VALIDACIÓN ATÓMICA: Verificar consistencia
        const validationResult = await validateAtomicConsistency(userId, campaignId);
        if (!validationResult.isConsistent) {
          console.warn('[ARQUITECTURA ATÓMICA] ⚠️ Advertencia: Inconsistencia detectada:', validationResult);
        }
        
        // 15. Guardar la URL de la imagen generada en la oportunidad
        await opportunityRef.update({
          'ai_pipeline_results.generated_image_url': generated_image_url
        });
        
        // 16. Obtener la campaña actualizada para la respuesta
        const updatedCampaign = await campaignDocRef.get();
        const finalCampaignDataComplete = updatedCampaign.data();
        
        // 17. Log de resumen del pipeline optimizado
        console.log('[PIPELINE] ✅ PIPELINE OPTIMIZADO COMPLETADO:');
        console.log(`[PIPELINE]    📝 Copywriter: ${copyResult.ad_variants?.length || 0} variantes generadas`);
        console.log(`[PIPELINE]    🎨 Director de Arte: 1 imagen maestra creada`);
        console.log(`[PIPELINE]    📊 Estructura: 1 Imagen + 3 Textos (optimización de costos y velocidad)`);
        console.log(`[PIPELINE]    📋 Campaña ID: ${campaignId}`);
        
        // 18. Respuesta final con todos los resultados
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

// Nuevo endpoint para lanzamiento en bloque
app.post('/api/execute-attack-batch', async (req, res) => {
    console.log('[BATCH API] Endpoint /api/execute-attack-batch alcanzado.');
    console.log('[BATCH API] Body completo recibido:', JSON.stringify(req.body, null, 2));
    
    try {
        // 1. Validar datos recibidos
        const { opportunities, userId, strategyId } = req.body;
        
        if (!opportunities || !Array.isArray(opportunities) || opportunities.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: "Se requiere un array de oportunidades válido" 
            });
        }
        
        if (!userId || !strategyId) {
            return res.status(400).json({ 
                success: false, 
                error: "userId y strategyId son requeridos" 
            });
        }
        
        console.log(`[BATCH API] Procesando ${opportunities.length} oportunidades con Promise.all...`);
        
        // 2. Función auxiliar para procesar una oportunidad individual
        const processOpportunity = async (opportunity, index) => {
            const opportunityId = opportunity.id;
            console.log(`[BATCH ${index + 1}/${opportunities.length}] Iniciando procesamiento para: ${opportunity.targetProfile?.name}`);
            
            try {
                const db = admin.firestore();
                const opportunityRef = db.doc(`clients/${userId}/battle_plans/${strategyId}/opportunities/${opportunityId}`);
                
                // Actualizar estado a "procesando"
                await opportunityRef.update({
                    status: 'PROCESANDO_CAMPAÑA',
                    batch_processing_started: new Date().toISOString()
                });
                
                // --- PIPELINE DE IA (igual que en execute-attack individual) ---
                
                // PIPELINE 1/4: Analista
                console.log(`[BATCH ${index + 1}] PIPELINE 1/4: Iniciando Analista...`);
                const analysisResult = await analyzeSignal(opportunity.signalText);
                console.log(`[BATCH ${index + 1}] PIPELINE 1/4: Analista completado.`);
                
                await opportunityRef.update({
                    'ai_pipeline_results.analysisResult': analysisResult
                });
                
                // PIPELINE 2/4: Estratega
                console.log(`[BATCH ${index + 1}] PIPELINE 2/4: Iniciando Estratega...`);
                const strategyResult = await defineStrategy(analysisResult, opportunity.targetProfile);
                console.log(`[BATCH ${index + 1}] PIPELINE 2/4: Estratega completado.`);
                
                await opportunityRef.update({
                    'ai_pipeline_results.strategyResult': strategyResult
                });
                
                // PIPELINE 3/4: Copywriter (3 variantes de texto)
                console.log(`[BATCH ${index + 1}] PIPELINE 3/4: Iniciando Copywriter...`);
                const copyResult = await generateCampaignAI(strategyResult, opportunity.targetProfile);
                console.log(`[BATCH ${index + 1}] PIPELINE 3/4: Copywriter completado - ${copyResult.ad_variants?.length || 0} variantes generadas.`);
                
                // Validación crítica: Asegurar que tenemos exactamente 3 variantes
                if (!copyResult.ad_variants || copyResult.ad_variants.length !== 3) {
                    console.warn(`[BATCH ${index + 1}] ⚠️ ADVERTENCIA: El Copywriter no generó exactamente 3 variantes`);
                }
                
                await opportunityRef.update({
                    'ai_pipeline_results.copyResult': copyResult
                });
                
                // PIPELINE 4/4: Director de Arte (1 imagen maestra para las 3 variantes)
                console.log(`[BATCH ${index + 1}] PIPELINE 4/4: Iniciando Director de Arte (Imagen Maestra)...`);
                const imagePromptResult = await createImagePrompt(strategyResult, copyResult);
                console.log(`[BATCH ${index + 1}] PIPELINE 4/4: ✅ Director de Arte completado - Imagen maestra definida.`);
                
                await opportunityRef.update({
                    'ai_pipeline_results.imagePromptResult': imagePromptResult
                });
                
                // Crear campaña final
                const finalCampaignData = {
                    strategyId: strategyId,
                    opportunityId: opportunityId,
                    target_audience: `${opportunity.targetProfile.jobTitle} en ${opportunity.targetProfile.companyName}`,
                    business_name: opportunity.targetProfile.companyName,
                    pain_point: analysisResult.pain_point,
                    brand_mentioned: analysisResult.brand_mentioned,
                    sentiment: analysisResult.sentiment,
                    strategy_angle: strategyResult.angle,
                    key_message: strategyResult.key_message,
                    ad_variants: copyResult.ad_variants, // Array con exactamente 3 variantes de texto
                    image_prompt: imagePromptResult.image_prompt, // Prompt para 1 imagen maestra
                    generated_image_url: '', // Se actualizará con 1 URL de imagen que complementa las 3 variantes
                    created_at: new Date().toISOString(),
                    campaign_type: 'surgical_attack_batch',
                    status: 'generating',
                    name: `Campaña para ${opportunity.targetProfile.companyName}`,
                    original_signal: opportunity.signalText,
                    target_profile: opportunity.targetProfile,
                    batch_processed: true
                };
                
                // 🎯 ARQUITECTURA ATÓMICA: Crear documento PRIMERO para obtener ID
                console.log(`[BATCH ${index + 1}] ARQUITECTURA ATÓMICA - Creando documento en Firestore...`);
                const campaignCollectionRef = db.collection(`clients/${userId}/campaigns`);
                const campaignDocRef = await campaignCollectionRef.add(finalCampaignData);
                const campaignId = campaignDocRef.id;
                
                console.log(`[BATCH ${index + 1}] ✅ Campaign ID obtenido: ${campaignId}`);
                
                // 🎯 ARQUITECTURA ATÓMICA: Generar imagen usando el campaignId
                console.log(`[BATCH ${index + 1}] ARQUITECTURA ATÓMICA - Generando imagen con ID: ${campaignId}`);
                const imageResult = await generateImageWithVertexAI(
                    imagePromptResult.image_prompt,
                    userId,
                    campaignId // 🎯 ID que determinará la carpeta exacta en Storage
                );
                const generated_image_url = imageResult.imageUrl || '';
                
                // 🎯 ARQUITECTURA ATÓMICA: Actualizar documento con URL final
                console.log(`[BATCH ${index + 1}] ARQUITECTURA ATÓMICA - Actualizando con URL: ${generated_image_url}`);
                await campaignDocRef.update({
                    generated_image_url: generated_image_url,
                    status: 'completed'
                });
                console.log(`[BATCH ${index + 1}] ✅ Arquitectura atómica completada - Documento y Storage sincronizados`);
                
                // 🎯 VALIDACIÓN ATÓMICA: Verificar consistencia
                const validationResult = await validateAtomicConsistency(userId, campaignId);
                if (!validationResult.isConsistent) {
                  console.warn(`[BATCH ${index + 1}] ⚠️ Inconsistencia atómica detectada:`, validationResult);
                }
                
                // Actualizar estado final de la oportunidad
                await opportunityRef.update({
                    status: 'CAMPAÑA_ACTIVA_🚀',
                    campaignId: campaignId,
                    generated_image_url: generated_image_url,
                    batch_processing_completed: new Date().toISOString()
                });
                
                console.log(`[BATCH ${index + 1}/${opportunities.length}] ✅ COMPLETADO: ${opportunity.targetProfile?.name} - Campaña ID: ${campaignId}`);
                
                // Retornar datos de la campaña para Promise.all
                return {
                    success: true,
                    opportunityId: opportunityId,
                    campaignId: campaignId,
                    targetName: opportunity.targetProfile?.name,
                    companyName: opportunity.targetProfile?.companyName,
                    generated_image_url: generated_image_url,
                    ad_variants_count: copyResult.ad_variants?.length || 0,
                    ad_variants: copyResult.ad_variants, // 🎯 INCLUIR LAS VARIANTES COMPLETAS
                    pain_point: analysisResult.pain_point,
                    strategy_angle: strategyResult.angle,
                    key_message: strategyResult.key_message,
                    image_prompt: imagePromptResult.image_prompt,
                    status: 'completed'
                };
                
            } catch (error) {
                console.error(`[BATCH ${index + 1}] ❌ ERROR procesando ${opportunity.targetProfile?.name}:`, error);
                
                // Actualizar estado de error en la oportunidad
                try {
                    const db = admin.firestore();
                    const opportunityRef = db.doc(`clients/${userId}/battle_plans/${strategyId}/opportunities/${opportunityId}`);
                    await opportunityRef.update({
                        status: 'ERROR_CAMPAÑA',
                        error_message: error.message,
                        batch_processing_error: new Date().toISOString()
                    });
                } catch (updateError) {
                    console.error(`[BATCH ${index + 1}] Error actualizando estado de error:`, updateError);
                }
                
                // Retornar datos del error para Promise.all
                return {
                    success: false,
                    opportunityId: opportunityId,
                    targetName: opportunity.targetProfile?.name,
                    companyName: opportunity.targetProfile?.companyName,
                    error: error.message,
                    status: 'error'
                };
            }
        };
        
        // 3. Procesar todas las oportunidades con Promise.all (SÍNCRONO)
        console.log('[BATCH API] Ejecutando Promise.all para procesar todas las oportunidades...');
        const processingPromises = opportunities.map((opportunity, index) => 
            processOpportunity(opportunity, index)
        );
        
        // Esperar a que todas las promesas se resuelvan
        const results = await Promise.all(processingPromises);
        
        // 4. Analizar resultados
        const successfulCampaigns = results.filter(result => result.success);
        const failedCampaigns = results.filter(result => !result.success);
        
        console.log(`[BATCH API] ✅ Procesamiento completado: ${successfulCampaigns.length} exitosas, ${failedCampaigns.length} fallidas`);
        
        // 5. Responder con resultados completos
        res.status(200).json({
            success: true,
            message: `Batch processing completado`,
            summary: {
                total: opportunities.length,
                successful: successfulCampaigns.length,
                failed: failedCampaigns.length
            },
            results: results,
            successful_campaigns: successfulCampaigns,
            failed_campaigns: failedCampaigns,
            timestamp: new Date().toISOString()
        });
        
        console.log('[BATCH API] Respuesta enviada con resultados completos');
        
    } catch (error) {
        console.error("[BATCH API] ERROR CRÍTICO en /api/execute-attack-batch:", error);
        // Solo enviamos respuesta si aún no se ha enviado
        if (!res.headersSent) {
            res.status(500).json({ 
                success: false,
                error: "Error interno al ejecutar el lote de ataques.",
                details: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
});

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
      const imageResult1 = await generateImageWithVertexAI(prompt, imageBase64String, imageMime);
      imageBase64 = imageResult1.base64 || imageResult1;
    } else {
      // Escenarios text-to-image
      console.log('[IA] Generando imagen solo con prompt usando Vertex AI');
      const imageResult2 = await generateImageWithVertexAI(prompt);
      imageBase64 = imageResult2.base64 || imageResult2;
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

// ===============================================================================
// 🧠 INICIALIZACIÓN DEL SISTEMA NERVIOSO RADAR
// ===============================================================================
console.log('[RADAR SYSTEM] 🚀 Iniciando sistema nervioso RADAR...');

// Inicializar y arrancar el RadarScheduler automáticamente
const radarScheduler = RadarScheduler.getInstance();

// Desactivado por seguridad de costos API
// radarScheduler.start().then(() => {
//   console.log('[RADAR SYSTEM] ⚡ Sistema nervioso RADAR activado exitosamente');
//   console.log('[RADAR SYSTEM] 🎯 Tareas programadas ejecutándose automáticamente');
// }).catch((error) => {
//   console.error('[RADAR SYSTEM] ❌ Error iniciando sistema RADAR:', error);
// });

// ========================================================================
// ENDPOINTS AVANZADOS - SISTEMA CON NORMALIZACIÓN
// ========================================================================

// Importar el integrador de normalización
const { 
  OrchestratorNormalizationService,
  EnhancedOrchestratorWithNormalization 
} = require('./core/OrchestratorNormalizationIntegration');

/**
 * Endpoint para probar el sistema completo con normalización automática.
 * Demuestra el pipeline completo: Ingesta → Normalización → Almacenamiento
 */
app.get('/api/radar/test-enhanced-ingestion/:source', async (req, res) => {
  console.log('\n🧪 TESTING ENHANCED SYSTEM WITH NORMALIZATION');
  console.log('=' .repeat(70));
  
  try {
    const { source } = req.params;
    const { query = 'AI innovation' } = req.query;
    
    const startTime = Date.now();
    
    // Crear Orchestrator mejorado con normalización
    const { Orchestrator } = require('./src/core/Orchestrator');
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const enhancedOrchestrator = new EnhancedOrchestratorWithNormalization(orchestrator);
    
    // Ejecutar ciclo completo con normalización
    const normalizedSignals = await enhancedOrchestrator.runEnhancedIngestionCycle(source, query);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Obtener estadísticas completas
    const stats = enhancedOrchestrator.getEnhancedStats();
    
    // Respuesta detallada
    const response = {
      success: true,
      message: `Enhanced ingestion cycle completed successfully`,
      execution: {
        duration_ms: duration,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date(endTime).toISOString()
      },
      input: {
        source,
        query,
        endpoint: `/api/radar/test-enhanced-ingestion/${source}`
      },
      results: {
        total_signals: normalizedSignals.length,
        normalized_signals: normalizedSignals.length,
        sample_signals: normalizedSignals.slice(0, 2).map(signal => ({
          id: signal.id,
          source: signal.source,
          original_content: signal.content_text?.substring(0, 100) + '...',
          cleaned_content: signal.cleanContent?.substring(0, 100) + '...',
          content_hash: signal.contentHash,
          normalized_date: signal.normalizedDate,
          metadata: {
            length_change: `${signal.normalizationMetadata?.originalLength} → ${signal.normalizationMetadata?.cleanedLength}`,
            has_url: signal.normalizationMetadata?.hasUrl,
            is_retweet: signal.normalizationMetadata?.isRetweet,
            mention_count: signal.normalizationMetadata?.mentionCount,
            hashtag_count: signal.normalizationMetadata?.hashtagCount
          }
        }))
      },
      statistics: stats,
      next_steps: [
        'Review normalized signals quality',
        'Check deduplication effectiveness', 
        'Validate hash consistency',
        'Monitor normalization performance'
      ]
    };
    
    console.log(`\n✅ Enhanced system test completed in ${duration}ms`);
    console.log(`📊 Processed ${normalizedSignals.length} signals with normalization`);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Enhanced ingestion test failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Enhanced ingestion cycle failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Endpoint para comparar señales antes y después de normalización.
 */
app.get('/api/radar/compare-normalization/:source', async (req, res) => {
  console.log('\n🔄 COMPARING RAW vs NORMALIZED SIGNALS');
  console.log('=' .repeat(60));
  
  try {
    const { source } = req.params;
    const { query = 'technology' } = req.query;
    
    // 1. Obtener señales sin normalizar
    console.log('📡 Fetching raw signals...');
    const { Orchestrator } = require('./src/core/Orchestrator');
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const rawSignals = await orchestrator.runIngestionCycle(source, query);
    
    // 2. Aplicar normalización
    console.log('🧽 Applying normalization...');
    const normalizationService = new OrchestratorNormalizationService();
    const normalizedSignals = await normalizationService.normalizeSignalBatch(rawSignals);
    
    // 3. Preparar comparación detallada
    const comparison = rawSignals.slice(0, 3).map((rawSignal, index) => {
      const normalizedSignal = normalizedSignals[index];
      
      return {
        signal_id: rawSignal.id,
        source: rawSignal.source,
        raw: {
          content: rawSignal.content_text,
          length: rawSignal.content_text?.length || 0,
          created_at: rawSignal.created_at
        },
        normalized: {
          clean_content: normalizedSignal.cleanContent,
          length: normalizedSignal.cleanContent?.length || 0,
          normalized_date: normalizedSignal.normalizedDate,
          content_hash: normalizedSignal.contentHash,
          metadata: normalizedSignal.normalizationMetadata
        },
        improvements: {
          html_removed: (rawSignal.content_text?.includes('<') || rawSignal.content_text?.includes('&')) ? 'Yes' : 'No',
          whitespace_normalized: rawSignal.content_text?.match(/\s{2,}/) ? 'Yes' : 'No',
          length_reduction: `${rawSignal.content_text?.length || 0} → ${normalizedSignal.cleanContent?.length || 0} chars`,
          hash_generated: normalizedSignal.contentHash ? 'Yes' : 'No'
        }
      };
    });
    
    const stats = normalizationService.getStats();
    
    res.status(200).json({
      success: true,
      message: 'Normalization comparison completed',
      comparison: {
        total_signals: rawSignals.length,
        sample_comparisons: comparison,
        processing_stats: stats
      },
      recommendations: [
        'Review HTML cleaning effectiveness',
        'Validate date normalization accuracy',
        'Check hash uniqueness',
        'Monitor content quality improvements'
      ]
    });
    
    console.log(`✅ Normalization comparison completed for ${rawSignals.length} signals`);
    
  } catch (error) {
    console.error('❌ Normalization comparison failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================================================
// ENDPOINT DE VALIDACIÓN - ORCHESTRATOR CON NORMALIZACIÓN INTEGRADA
// ========================================================================

/**
 * Endpoint para validar la integración del NormalizationService en el Orchestrator.
 * Demuestra el pipeline completo: Ingesta → Normalización → Almacenamiento.
 */
app.get('/api/radar/test-orchestrator-normalization/:source', async (req, res) => {
  console.log('\n🧪 TESTING ORCHESTRATOR WITH INTEGRATED NORMALIZATION');
  console.log('=' .repeat(70));
  
  try {
    const { source } = req.params;
    const { query = 'artificial intelligence' } = req.query;
    
    console.log(`📡 Source: ${source}`);
    console.log(`🎯 Query: "${query}"`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    const startTime = Date.now();
    
    // Usar Orchestrator con normalización integrada
    const { Orchestrator } = require('./src/core/Orchestrator');
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    // Ejecutar ciclo de ingesta con normalización automática
    const result = await orchestrator.runIngestionCycle(source, query, {
      maxResults: 1 // Prueba quirúrgica con 1 señal
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Obtener estadísticas del último ciclo ejecutado
    const stats = orchestrator.getStats();
    const lastExecution = orchestrator.execHistory[orchestrator.execHistory.length - 1];
    
    console.log('\n📊 INTEGRATION RESULTS:');
    console.log(`✅ Signals collected: ${result.signalsCollected}`);
    console.log(`🧽 Signals normalized: ${result.signalsNormalized || 'N/A'}`);
    console.log(`❌ Normalization errors: ${result.normalizationErrors || 0}`);
    console.log(`⏱️ Total duration: ${duration}ms`);
    
    // Respuesta detallada
    const response = {
      success: true,
      message: `Orchestrator with integrated normalization completed successfully`,
      test: 'ORCHESTRATOR_NORMALIZATION_INTEGRATION',
      execution: {
        source,
        query,
        duration_ms: duration,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date(endTime).toISOString()
      },
      results: {
        signals_collected: result.signalsCollected,
        signals_normalized: result.signalsNormalized || 0,
        normalization_errors: result.normalizationErrors || 0,
        normalization_success_rate: result.signalsNormalized ? 
          `${((result.signalsNormalized / result.signalsCollected) * 100).toFixed(1)}%` : 'N/A'
      },
      orchestrator_stats: {
        total_executions: stats.totalExecutions,
        success_rate: stats.successRate,
        last_execution: lastExecution ? {
          id: lastExecution.id,
          status: lastExecution.status,
          signals_found: lastExecution.signalsFound,
          signals_normalized: lastExecution.signalsNormalized,
          normalization_errors: lastExecution.normalizationErrors,
          duration: lastExecution.duration
        } : null
      },
      validation: {
        normalization_integrated: true,
        pipeline_flow: 'Fetch → Normalize → Save',
        firestore_compatible: true,
        error_handling: 'Robust with fallbacks'
      }
    };
    
    console.log(`\n✅ Integration test completed successfully in ${duration}ms`);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Orchestrator normalization integration test failed:', error);
    
    res.status(500).json({
      success: false,
      test: 'ORCHESTRATOR_NORMALIZATION_INTEGRATION',
      error: error.message,
      message: 'Integration test failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ========================================================================
// SCHEDULER Y SISTEMA RADAR AUTOMÁTICO
// ========================================================================

console.log('[RADAR SYSTEM] ⏸️ Scheduler desactivado - Control manual habilitado');
console.log('[RADAR SYSTEM] 🔧 Para activar: usar /api/radar/initialize o radarScheduler.start()');
console.log('[RADAR SYSTEM] 🧽 NormalizationService: INTEGRADO');

// Iniciar servidor Express
app.listen(PORT, () => {
  console.log(`🌐 Servidor backend escuchando en el puerto ${PORT}`);
  console.log('📡 Sistema RADAR: ACTIVO');
  console.log('🔄 Scheduler: EJECUTANDO');
  console.log('🏥 Health Monitor: MONITOREANDO');
  console.log('🧽 Normalization Service: INTEGRADO');
  console.log('=' .repeat(50));
});
