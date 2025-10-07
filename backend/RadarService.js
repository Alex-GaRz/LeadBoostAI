// Importar dependencias
const axios = require('axios');
require('dotenv').config();

// Leer el Bearer Token de Twitter desde .env
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

/**
 * Busca señales de intención en Twitter/X v2 usando la API oficial.
 * @param {string} query - Consulta de búsqueda avanzada.
 * @returns {Promise<Array>} - Array de objetos de tuits o array vacío si no hay resultados.
 */
async function searchTwitterSignals(query) {
  console.log(`[RadarService] Iniciando búsqueda en Twitter/X para: ${query}`);
  try {
    const url = 'https://api.twitter.com/2/tweets/search/recent';
    const response = await axios.get(url, {
      params: {
        query,
        max_results: 10, // Puedes ajustar este valor según tus necesidades
        'tweet.fields': 'id,text,author_id,created_at'
      },
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`
      }
    });
    const tweets = response.data.data || [];
    console.log(`[RadarService] Resultados encontrados: ${tweets.length}`);
    return tweets;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error('[RadarService] Error 429: Límite de velocidad de Twitter alcanzado.');
      throw new Error('TWITTER_RATE_LIMIT');
    }
    console.error('[RadarService] Error en la búsqueda:', error.message);
    return [];
  }
}

module.exports = { searchTwitterSignals };
