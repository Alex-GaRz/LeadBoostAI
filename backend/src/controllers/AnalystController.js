/**
 * ===============================================================================
 * ANALYST CONTROLLER - BLOQUE 3: ANALISTA INTELLIGENCE
 * ===============================================================================
 * 
 * Controlador REST API que expone las capacidades de análisis inteligente
 * del Bloque 3, incluyendo búsqueda semántica y análisis de correlaciones.
 * 
 * Endpoints principales:
 * - GET /search - Búsqueda semántica con vectores
 * - GET /correlations - Análisis de correlaciones temporales
 * - GET /similar/:id - Buscar señales similares
 * - GET /batch-search - Búsqueda en lote
 * - GET /stats - Estadísticas del sistema de análisis
 * 
 * @author LeadBoostAI Backend Team
 * @version 1.0.0 - Bloque 3: Analista Intelligence
 */

const { VectorSearchService } = require('../core/analysis/VectorSearchService');
const { CorrelationEngine } = require('../core/analysis/CorrelationEngine');

/**
 * Controlador del Bloque 3: ANALISTA
 * Expone endpoints para búsqueda semántica y correlaciones temporales.
 */
class AnalystController {
  constructor() {
    // Inicialización lazy para evitar errores de Firebase
    this.vectorSearch = null;
    this.correlationEngine = null;
    
    // Estadísticas del controlador
    this.requestStats = {
      totalRequests: 0,
      searchRequests: 0,
      correlationRequests: 0,
      errorCount: 0,
      averageResponseTime: 0
    };
    
    console.log('[AnalystController] 🎯 Controlador del Analista inicializado');
  }

  /**
   * Inicialización lazy de servicios
   */
  initializeServices() {
    if (!this.vectorSearch) {
      const { VectorSearchService } = require('../core/analysis/VectorSearchService');
      this.vectorSearch = new VectorSearchService();
    }
    if (!this.correlationEngine) {
      const { CorrelationEngine } = require('../core/analysis/CorrelationEngine');
      this.correlationEngine = new CorrelationEngine();
    }
  }

  /**
   * GET /search
   * Busca señales por significado semántico utilizando vectores.
   * 
   * Query params:
   * - q: Texto de consulta (requerido)
   * - limit: Límite de resultados (default: 10)
   * - threshold: Umbral de similitud 0-1 (default: 0.4)
   * - source: Filtrar por fuente específica
   * - sentiment: Filtrar por sentimiento
   * - timeframe: Rango temporal (24h, 7d, 30d)
   */
  async search(req, res) {
    const requestStart = Date.now();
    this.requestStats.totalRequests++;
    this.requestStats.searchRequests++;

    console.log(`[AnalystController] 🔍 Nueva búsqueda semántica desde ${req.ip}`);

    try {
      // 0. Inicializar servicios si no están disponibles
      this.initializeServices();
      
      // 1. Validar parámetros
      const { q, limit, threshold, source, sentiment, timeframe } = req.query;

      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Parámetro 'q' (query) requerido y no puede estar vacío",
          example: "/search?q=inteligencia artificial"
        });
      }

      // 2. Preparar filtros
      const filters = {};
      if (source) filters.source = source;
      if (sentiment) filters.sentiment = sentiment;
      
      if (timeframe) {
        const { startDate, endDate } = this.parseTimeframe(timeframe);
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      // 3. Ejecutar búsqueda semántica
      console.log(`[AnalystController] 🧠 Ejecutando búsqueda: "${q}"`);
      
      const results = await this.vectorSearch.searchByMeaning(
        q.trim(), 
        parseInt(limit) || 10, 
        parseFloat(threshold) || 0.4,
        filters
      );

      // 4. Preparar respuesta
      const responseTime = Date.now() - requestStart;
      this.updateRequestStats(responseTime);

      const response = {
        success: true,
        search: {
          query: q.trim(),
          type: 'semantic',
          timestamp: new Date().toISOString(),
          response_time_ms: responseTime
        },
        filters: filters,
        results: {
          count: results.length,
          threshold_used: parseFloat(threshold) || 0.4,
          data: results.map(this.formatSearchResult)
        },
        pagination: {
          limit: parseInt(limit) || 10,
          has_more: false // TODO: Implementar paginación real
        }
      };

      console.log(`[AnalystController] ✅ Búsqueda completada: ${results.length} resultados en ${responseTime}ms`);
      
      res.json(response);

    } catch (error) {
      console.error('[AnalystController] ❌ Error en búsqueda semántica:', error);
      this.requestStats.errorCount++;
      
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor en búsqueda semántica',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /correlations
   * Analiza relaciones temporales entre dos temas.
   * 
   * Query params:
   * - topicA: Primer tópico (requerido)
   * - topicB: Segundo tópico (requerido) 
   * - timeframe: Marco temporal (default: 7d)
   * - granularity: Granularidad temporal (hour, day, week)
   * - maxLag: Máximo lag a analizar (default: 5)
   */
  async getCorrelations(req, res) {
    const requestStart = Date.now();
    this.requestStats.totalRequests++;
    this.requestStats.correlationRequests++;

    console.log(`[AnalystController] 📊 Nueva análisis de correlación desde ${req.ip}`);

    try {
      // 0. Inicializar servicios si no están disponibles
      this.initializeServices();
      
      // 1. Validar parámetros
      const { topicA, topicB, timeframe, granularity, maxLag, sources } = req.query;

      if (!topicA || !topicB) {
        return res.status(400).json({ 
          success: false, 
          error: "Se requieren ambos parámetros: 'topicA' y 'topicB'",
          example: "/correlations?topicA=inflación&topicB=ventas"
        });
      }

      if (topicA.toLowerCase().trim() === topicB.toLowerCase().trim()) {
        return res.status(400).json({ 
          success: false, 
          error: "Los tópicos deben ser diferentes"
        });
      }

      // 2. Preparar opciones de análisis
      const analysisOptions = {};
      if (granularity) analysisOptions.granularity = granularity;
      if (maxLag) analysisOptions.maxLag = parseInt(maxLag);
      if (sources) analysisOptions.sources = sources.split(',');

      console.log(`[AnalystController] 📈 Analizando correlación: "${topicA}" vs "${topicB}"`);

      // 3. Ejecutar análisis de correlación
      const analysis = await this.correlationEngine.analyzeCorrelations(
        topicA.trim(), 
        topicB.trim(), 
        timeframe || '7d',
        analysisOptions
      );

      // 4. Preparar respuesta
      const responseTime = Date.now() - requestStart;
      this.updateRequestStats(responseTime);

      const response = {
        success: true,
        correlation_analysis: analysis,
        request_info: {
          timestamp: new Date().toISOString(),
          response_time_ms: responseTime,
          analysis_id: analysis.analysis_id
        }
      };

      console.log(`[AnalystController] ✅ Análisis completado en ${responseTime}ms`);
      
      res.json(response);

    } catch (error) {
      console.error('[AnalystController] ❌ Error en análisis de correlación:', error);
      this.requestStats.errorCount++;
      
      res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor en análisis de correlación',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * GET /similar/:id
   * Busca señales similares a una señal específica.
   * 
   * Params:
   * - id: ID de la señal de referencia
   * 
   * Query params:
   * - limit: Límite de resultados (default: 5)
   * - threshold: Umbral de similitud (default: 0.5)
   */
  async getSimilar(req, res) {
    const requestStart = Date.now();
    this.requestStats.totalRequests++;

    try {
      const { id } = req.params;
      const { limit, threshold } = req.query;

      if (!id) {
        return res.status(400).json({ 
          success: false, 
          error: "ID de señal requerido"
        });
      }

      console.log(`[AnalystController] 🔗 Buscando similares a señal: ${id}`);

      const results = await this.vectorSearch.findSimilar(
        id,
        parseInt(limit) || 5,
        parseFloat(threshold) || 0.5
      );

      const responseTime = Date.now() - requestStart;
      this.updateRequestStats(responseTime);

      res.json({
        success: true,
        reference_signal_id: id,
        similar_signals: {
          count: results.length,
          threshold_used: parseFloat(threshold) || 0.5,
          data: results.map(this.formatSearchResult)
        },
        request_info: {
          response_time_ms: responseTime,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[AnalystController] ❌ Error buscando similares:', error);
      this.requestStats.errorCount++;
      
      res.status(500).json({ 
        success: false, 
        error: 'Error buscando señales similares'
      });
    }
  }

  /**
   * POST /batch-search
   * Ejecuta múltiples búsquedas semánticas en paralelo.
   * 
   * Body:
   * - queries: Array de strings de consulta
   * - limit: Límite por consulta (default: 5)
   * - threshold: Umbral de similitud (default: 0.4)
   */
  async batchSearch(req, res) {
    const requestStart = Date.now();
    this.requestStats.totalRequests++;

    try {
      const { queries, limit, threshold } = req.body;

      if (!Array.isArray(queries) || queries.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "Se requiere un array de queries no vacío",
          example: { queries: ["inteligencia artificial", "machine learning"] }
        });
      }

      if (queries.length > 10) {
        return res.status(400).json({ 
          success: false, 
          error: "Máximo 10 consultas por lote"
        });
      }

      console.log(`[AnalystController] 📦 Búsqueda en lote: ${queries.length} consultas`);

      const results = await this.vectorSearch.batchSearch(
        queries,
        parseInt(limit) || 5,
        parseFloat(threshold) || 0.4
      );

      const responseTime = Date.now() - requestStart;
      this.updateRequestStats(responseTime);

      res.json({
        success: true,
        batch_search: results,
        request_info: {
          response_time_ms: responseTime,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('[AnalystController] ❌ Error en búsqueda en lote:', error);
      this.requestStats.errorCount++;
      
      res.status(500).json({ 
        success: false, 
        error: 'Error en búsqueda en lote'
      });
    }
  }

  /**
   * GET /stats
   * Obtiene estadísticas del sistema de análisis.
   */
  async getStats(req, res) {
    try {
      const vectorStats = this.vectorSearch.getStats();
      const correlationStats = this.correlationEngine.getStats();

      res.json({
        success: true,
        system_stats: {
          controller: this.requestStats,
          vector_search: vectorStats,
          correlation_engine: correlationStats
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[AnalystController] ❌ Error obteniendo estadísticas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error obteniendo estadísticas del sistema'
      });
    }
  }

  /**
   * GET /health
   * Health check del sistema de análisis.
   */
  async getHealth(req, res) {
    try {
      const health = {
        status: 'healthy',
        services: {
          vector_search: 'operational',
          correlation_engine: 'operational',
          embedding_service: this.vectorSearch.embeddingService?.isReady() ? 'ready' : 'not_ready'
        },
        uptime_hours: process.uptime() / 3600,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        health
      });

    } catch (error) {
      console.error('[AnalystController] ❌ Error en health check:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Error en verificación de salud del sistema'
      });
    }
  }

  // --- Métodos auxiliares ---

  /**
   * Parsea timeframe a fechas de inicio y fin.
   * @param {string} timeframe - Timeframe string (24h, 7d, 30d)
   */
  parseTimeframe(timeframe) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    return { startDate, endDate };
  }

  /**
   * Formatea resultado de búsqueda para respuesta API.
   * @param {Object} result - Resultado de búsqueda
   */
  formatSearchResult(result) {
    return {
      id: result.id,
      content: {
        text: result.cleanContent || result.content,
        source: result.source,
        created_at: result.created_at || result.timestamp
      },
      analysis: result.analysis ? {
        sentiment: result.analysis.sentimentLabel,
        intent: result.analysis.intent,
        keywords: result.analysis.keywords,
        summary: result.analysis.summary
      } : null,
      search_metadata: {
        similarity_score: result.search_score,
        rank: result.search_rank,
        percentile: result.search_percentile
      }
    };
  }

  /**
   * Actualiza estadísticas de requests.
   * @param {number} responseTime - Tiempo de respuesta en ms
   */
  updateRequestStats(responseTime) {
    // Promedio móvil del tiempo de respuesta
    this.requestStats.averageResponseTime = this.requestStats.totalRequests === 1
      ? responseTime
      : (this.requestStats.averageResponseTime + responseTime) / 2;
  }

  /**
   * Resetea estadísticas del controlador.
   */
  resetStats() {
    this.requestStats = {
      totalRequests: 0,
      searchRequests: 0,
      correlationRequests: 0,
      errorCount: 0,
      averageResponseTime: 0
    };

    // Resetear estadísticas de servicios
    this.vectorSearch.resetStats();
    this.correlationEngine.resetStats();

    console.log('[AnalystController] 📊 Estadísticas del controlador reseteadas');
  }
}

module.exports = { AnalystController };