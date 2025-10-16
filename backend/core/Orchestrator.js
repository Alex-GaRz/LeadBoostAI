/**
 * Nueva estructura para el campo ai_pipeline_results en un documento opportunity:
 *
 * ai_pipeline_results: {
 *   analysisResult: { ... },
 *   strategyResult: { ... },
 *   copyResult: { ... },
 *   artDirectionResult: { ... }
 * }
 *
 * Cada subcampo es un map anidado con los resultados de cada etapa del pipeline de IA.
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const { searchTwitterSignals } = require('../RadarService');
const db = admin.firestore();

/**
 * Ejecuta un escaneo radar usando los datos de un plan de batalla.
 * @param {string} userId - ID del usuario propietario.
 * @param {string} planId - ID del plan de batalla.
 */
async function executeRadarScan(userId, planId) {
  try {
    // Leer el documento del plan de batalla
    const planRef = db.collection('clients').doc(userId).collection('battle_plans').doc(planId);
    const planSnap = await planRef.get();
    if (!planSnap.exists) {
      console.error(`[Orchestrator] No existe el planId: ${planId} para el usuario: ${userId}`);
      return;
    }

  const planData = planSnap.data();
  const radarConfig = planData.radarConfig || {};
  const signals = radarConfig.signals || {};
  const competitors = signals.competitors || [];
  const frustrationKeywords = signals.frustrationKeywords || [];

  // Construir la query dinámica para Twitter
  const competitorsQuery = competitors.length > 0 ? `(${competitors.join(' OR ')})` : '';
  const keywordsQuery = frustrationKeywords.length > 0 ? `(${frustrationKeywords.join(' OR ')})` : '';
  let query = [competitorsQuery, keywordsQuery].filter(Boolean).join(' ');
  query = query ? `${query} -is:retweet` : '-is:retweet';

    console.log(`[Orchestrator] Query generada para Twitter: ${query}`);

    // Ejecutar la búsqueda en Twitter
    const tweets = await searchTwitterSignals(query);
    if (tweets && Array.isArray(tweets)) {
      for (const tweet of tweets) {
        const opportunityData = {
          source: 'TWITTER',
          sourceURL: `https://twitter.com/i/web/status/${tweet.id}`,
          signalText: tweet.text,
          detectedAt: admin.firestore.Timestamp.now(),
          status: 'PENDING_REVIEW',
          targetProfile: {}
        };
        await db.collection('clients')
          .doc(userId)
          .collection('battle_plans')
          .doc(planId)
          .collection('opportunities')
          .add(opportunityData);
        console.log(`Oportunidad guardada: ${tweet.id}`);
      }
    }
    console.log('[Orchestrator] Resultados encontrados:', tweets);
  } catch (error) {
    if (error.message === 'TWITTER_RATE_LIMIT') {
      console.error('Error: Límite de velocidad de Twitter alcanzado. Intenta más tarde.');
    } else {
      console.error('[Orchestrator] Error en executeRadarScan:', error.message);
    }
  }
}

module.exports = { executeRadarScan };
