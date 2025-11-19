/**
 * ===============================================================================
 * TWITTER API RATE LIMITS CONFIGURATION
 * ===============================================================================
 * 
 * Configuración de límites oficiales de Twitter API v2 para diferentes endpoints.
 * Basado en la documentación oficial de Twitter Developer Platform.
 * 
 * @see https://developer.twitter.com/en/docs/twitter-api/rate-limits
 */

const TWITTER_RATE_LIMITS = {
  // Search endpoints (Tweet search)
  search: {
    // /2/tweets/search/recent
    recent: {
      app: { requests: 300, window: 900 }, // 300 requests per 15 minutes
      user: { requests: 180, window: 900 } // 180 requests per 15 minutes
    },
    
    // /2/tweets/search/all (Academic Research only)
    all: {
      app: { requests: 300, window: 900 },
      user: { requests: 1, window: 1 } // 1 request per second
    }
  },
  
  // Lookup endpoints
  lookup: {
    // /2/tweets (by IDs)
    tweets: {
      app: { requests: 300, window: 900 },
      user: { requests: 75, window: 900 }
    },
    
    // /2/users (by IDs)
    users: {
      app: { requests: 300, window: 900 },
      user: { requests: 75, window: 900 }
    }
  }
};

/**
 * Configuración conservadora para LeadBoostAI
 * Reduce los límites oficiales en 20% para evitar errores
 */
const LEADBOOST_RATE_LIMITS = {
  twitter: {
    // Para search/recent (nuestro endpoint principal)
    requestsPerWindow: 240, // 80% de 300 (oficial)
    windowSeconds: 900,     // 15 minutos
    requestsPerMinute: 16,  // 240 / 15 = 16 per minute
    minInterval: 4000,      // 4 segundos entre requests (conservador)
    
    // Para batch operations
    batchDelay: 5000,       // 5 segundos entre requests en batch
    maxConcurrent: 1,       // Solo 1 request concurrent
    
    // Retry configuration
    maxRetries: 3,
    baseRetryDelay: 2000,   // 2 segundos inicial
    maxRetryDelay: 30000,   // 30 segundos máximo
    
    // Error handling
    timeoutMs: 15000,       // 15 segundos timeout
    retryOnErrors: ['TWITTER_RATE_LIMIT', 'TWITTER_TIMEOUT', 'TWITTER_NETWORK_ERROR']
  }
};

/**
 * Calcula el tiempo de espera recomendado basado en rate limits
 */
function calculateWaitTime(requestCount, windowSeconds = 900) {
  const maxRequestsPerSecond = LEADBOOST_RATE_LIMITS.twitter.requestsPerWindow / windowSeconds;
  const currentRate = requestCount / windowSeconds;
  
  if (currentRate >= maxRequestsPerSecond * 0.9) { // 90% del límite
    return LEADBOOST_RATE_LIMITS.twitter.minInterval * 2; // Doble delay
  }
  
  return LEADBOOST_RATE_LIMITS.twitter.minInterval;
}

/**
 * Verifica si estamos cerca del rate limit
 */
function isNearRateLimit(requestHistory, nowMs = Date.now()) {
  const windowMs = LEADBOOST_RATE_LIMITS.twitter.windowSeconds * 1000;
  const recentRequests = requestHistory.filter(
    timestamp => nowMs - timestamp < windowMs
  );
  
  const utilizationPercentage = (recentRequests.length / LEADBOOST_RATE_LIMITS.twitter.requestsPerWindow) * 100;
  
  return {
    isNear: utilizationPercentage > 80,
    utilization: utilizationPercentage.toFixed(1),
    remaining: LEADBOOST_RATE_LIMITS.twitter.requestsPerWindow - recentRequests.length,
    resetTime: nowMs + windowMs - (nowMs - Math.min(...recentRequests))
  };
}

module.exports = {
  TWITTER_RATE_LIMITS,
  LEADBOOST_RATE_LIMITS,
  calculateWaitTime,
  isNearRateLimit
};