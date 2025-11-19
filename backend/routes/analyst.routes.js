/**
 * ===============================================================================
 * ANALYST ROUTES - BLOQUE 3: ANALISTA INTELLIGENCE
 * ===============================================================================
 * 
 * Definición de rutas REST API para las capacidades de análisis inteligente
 * del Bloque 3, incluyendo búsqueda semántica y análisis de correlaciones.
 * 
 * Endpoints disponibles:
 * - GET  /api/analyst/search            - Búsqueda semántica
 * - GET  /api/analyst/correlations      - Análisis de correlaciones temporales  
 * - GET  /api/analyst/similar/:id       - Señales similares a una específica
 * - POST /api/analyst/batch-search      - Búsqueda en lote
 * - GET  /api/analyst/stats             - Estadísticas del sistema
 * - GET  /api/analyst/health            - Health check
 * 
 * @author LeadBoostAI Backend Team
 * @version 1.0.0 - Bloque 3: Analista Intelligence
 */

const express = require('express');
const { AnalystController } = require('../src/controllers/AnalystController');

/**
 * Router para endpoints del Bloque 3: ANALISTA
 * Maneja todas las operaciones de análisis inteligente.
 */
const router = express.Router();
const analystController = new AnalystController();

// --- Middleware de logging específico para el analista ---
router.use((req, res, next) => {
  console.log(`[AnalystRoutes] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// --- Middleware de validación de headers ---
router.use((req, res, next) => {
  // Validar Content-Type para requests POST
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(400).json({
      success: false,
      error: 'Content-Type debe ser application/json para requests POST'
    });
  }
  next();
});

/**
 * ===============================================================================
 * BÚSQUEDA SEMÁNTICA ENDPOINTS
 * ===============================================================================
 */

/**
 * GET /search
 * Búsqueda semántica utilizando vectores de embeddings.
 * 
 * Parámetros de query:
 * @param {string} q - Texto de consulta (requerido)
 * @param {number} limit - Límite de resultados (opcional, default: 10)
 * @param {number} threshold - Umbral de similitud 0-1 (opcional, default: 0.4)
 * @param {string} source - Filtrar por fuente específica (opcional)
 * @param {string} sentiment - Filtrar por sentimiento (opcional)
 * @param {string} timeframe - Rango temporal: 24h, 7d, 30d (opcional)
 * 
 * Ejemplo: GET /api/analyst/search?q=inteligencia artificial&limit=5&threshold=0.5
 */
router.get('/search', async (req, res) => {
  await analystController.search(req, res);
});

/**
 * GET /similar/:id
 * Encuentra señales similares a una señal específica por ID.
 * 
 * Parámetros de ruta:
 * @param {string} id - ID de la señal de referencia
 * 
 * Parámetros de query:
 * @param {number} limit - Límite de resultados (opcional, default: 5)
 * @param {number} threshold - Umbral de similitud (opcional, default: 0.5)
 * 
 * Ejemplo: GET /api/analyst/similar/abc123?limit=3&threshold=0.6
 */
router.get('/similar/:id', async (req, res) => {
  await analystController.getSimilar(req, res);
});

/**
 * POST /batch-search
 * Ejecuta múltiples búsquedas semánticas en paralelo.
 * 
 * Body:
 * {
 *   "queries": ["consulta1", "consulta2"],
 *   "limit": 5,     // opcional
 *   "threshold": 0.4 // opcional
 * }
 * 
 * Máximo 10 consultas por lote.
 */
router.post('/batch-search', async (req, res) => {
  await analystController.batchSearch(req, res);
});

/**
 * ===============================================================================
 * CORRELACIÓN TEMPORAL ENDPOINTS
 * ===============================================================================
 */

/**
 * GET /correlations
 * Analiza correlaciones temporales entre dos temas.
 * 
 * Parámetros de query:
 * @param {string} topicA - Primer tópico (requerido)
 * @param {string} topicB - Segundo tópico (requerido)
 * @param {string} timeframe - Marco temporal: 24h, 7d, 30d (opcional, default: 7d)
 * @param {string} granularity - Granularidad temporal: hour, day, week (opcional)
 * @param {number} maxLag - Máximo lag a analizar (opcional, default: 5)
 * @param {string} sources - Fuentes separadas por coma (opcional)
 * 
 * Ejemplo: GET /api/analyst/correlations?topicA=inflación&topicB=ventas&timeframe=30d
 */
router.get('/correlations', async (req, res) => {
  await analystController.getCorrelations(req, res);
});

/**
 * ===============================================================================
 * SISTEMA Y MONITORING ENDPOINTS
 * ===============================================================================
 */

/**
 * GET /stats
 * Obtiene estadísticas completas del sistema de análisis.
 * 
 * Incluye métricas de:
 * - Controlador (requests totales, errores, tiempo promedio)
 * - VectorSearchService (búsquedas, cache hits, etc.)
 * - CorrelationEngine (análisis ejecutados, tiempo promedio)
 */
router.get('/stats', async (req, res) => {
  await analystController.getStats(req, res);
});

/**
 * GET /health
 * Health check del sistema de análisis inteligente.
 * 
 * Verifica estado de:
 * - VectorSearchService
 * - CorrelationEngine  
 * - EmbeddingService
 */
router.get('/health', async (req, res) => {
  await analystController.getHealth(req, res);
});

/**
 * POST /reset-stats
 * Resetea todas las estadísticas del sistema (solo desarrollo).
 * Requiere NODE_ENV !== 'production'
 */
router.post('/reset-stats', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Operación no permitida en producción'
    });
  }

  try {
    analystController.resetStats();
    res.json({
      success: true,
      message: 'Estadísticas del sistema reseteadas exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error reseteando estadísticas'
    });
  }
});

/**
 * ===============================================================================
 * ENDPOINTS DE DOCUMENTACIÓN Y AYUDA
 * ===============================================================================
 */

/**
 * GET /
 * Información general sobre endpoints del Bloque 3: Analista.
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'LeadBoostAI - Bloque 3: Analista Intelligence',
    version: '1.0.0',
    description: 'API de análisis inteligente con búsqueda semántica y correlaciones temporales',
    endpoints: {
      search: {
        method: 'GET',
        path: '/search',
        description: 'Búsqueda semántica con vectores',
        required_params: ['q'],
        optional_params: ['limit', 'threshold', 'source', 'sentiment', 'timeframe']
      },
      correlations: {
        method: 'GET', 
        path: '/correlations',
        description: 'Análisis de correlaciones temporales',
        required_params: ['topicA', 'topicB'],
        optional_params: ['timeframe', 'granularity', 'maxLag', 'sources']
      },
      similar: {
        method: 'GET',
        path: '/similar/:id',
        description: 'Encuentra señales similares',
        required_params: ['id'],
        optional_params: ['limit', 'threshold']
      },
      batch_search: {
        method: 'POST',
        path: '/batch-search', 
        description: 'Búsquedas múltiples en paralelo',
        body: {
          queries: 'array of strings',
          limit: 'number (optional)',
          threshold: 'number (optional)'
        }
      },
      stats: {
        method: 'GET',
        path: '/stats',
        description: 'Estadísticas del sistema'
      },
      health: {
        method: 'GET',
        path: '/health',
        description: 'Estado de salud del sistema'
      }
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * ===============================================================================
 * MANEJO DE ERRORES GLOBALES
 * ===============================================================================
 */

// Middleware de manejo de errores específico para rutas del analista
router.use((error, req, res, next) => {
  console.error('[AnalystRoutes] ❌ Error no manejado:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });

  res.status(500).json({
    success: false,
    error: 'Error interno en el sistema de análisis',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Middleware para rutas no encontradas en el analista
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado en el sistema de análisis',
    available_endpoints: [
      'GET /search',
      'GET /similar/:id', 
      'POST /batch-search',
      'GET /correlations',
      'GET /stats',
      'GET /health'
    ],
    requested_path: req.originalUrl
  });
});

console.log('[AnalystRoutes] 🎯 Rutas del Bloque 3: Analista Intelligence registradas');

module.exports = router;