// Importar dependencias
const axios = require('axios');
require('dotenv').config();

// Leer el Bearer Token de Twitter desde .env
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

/**
 * Busca señales de intención en Twitter/X v2 usando la API oficial.
 * @param {Object} options - Opciones de búsqueda.
 * @param {string} options.query - Consulta de búsqueda avanzada.
 * @param {number} [options.maxResults=10] - Número máximo de resultados.
 * @returns {Promise<Array>} - Array de objetos de tuits o array vacío si no hay resultados.
 */
async function searchTwitterSignals(options) {
  const { query, maxResults = 1 } = options; // DEFAULT 1 PARA PRUEBAS
  
  console.log(`[RadarService] 🔍 Buscando en Twitter: "${query}" (max: ${maxResults})`);
  console.log(`[RadarService] 🧪 MODO PRUEBAS: Limitado a 1 tweet máximo`);
  
  if (!BEARER_TOKEN) {
    console.error('[RadarService] ❌ TWITTER_BEARER_TOKEN no configurado en .env');
    throw new Error('Twitter Bearer Token no configurado');
  }
  
  try {
    const url = 'https://api.twitter.com/2/tweets/search/recent';
    
    const response = await axios.get(url, {
      params: {
        query: `${query} -is:retweet`,
        max_results: Math.min(maxResults, 1), // FORZAR MÁXIMO 1
        'tweet.fields': 'id,text,author_id,created_at,public_metrics'
      },
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`
      },
      timeout: 10000
    });
    
    const tweets = response.data.data || [];
    
    console.log(`[RadarService] ✅ Encontrados ${tweets.length} tweets`);
    
    return tweets.map(tweet => ({
      id: tweet.id,
      text: tweet.text,
      author_id: tweet.author_id,
      created_at: tweet.created_at,
      public_metrics: tweet.public_metrics,
      source: 'twitter',
      fetched_at: new Date().toISOString()
    }));
    
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error('[RadarService] ⏳ Rate limit alcanzado');
      throw new Error('TWITTER_RATE_LIMIT');
    }
    
    console.error('[RadarService] ❌ Error:', error.message);
    throw new Error(`TWITTER_ERROR: ${error.message}`);
  }
}

module.exports = { searchTwitterSignals };
