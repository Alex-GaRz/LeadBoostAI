/**
 * ===============================================================================
 * SIGNAL CONTROLLER - JAVASCRIPT INTEGRATION VERSION
 * ===============================================================================
 * 
 * Controlador REST API para exposición de inteligencia de mercado.
 * Versión JavaScript compatible para integración con el sistema existente.
 * 
 * @author LeadBoostAI - Radar System  
 * @version 1.0.0 - JavaScript Integration
 */

const { SignalRepository } = require('../repositories/SignalRepository');

/**
 * Controlador para gestión de señales enriquecidas con inteligencia artificial.
 * Expone la capa de inteligencia de mercado a través de endpoints REST.
 */
class SignalController {
  constructor() {
    this.signalRepository = new SignalRepository();
    console.log('[SignalController] 🎯 API Controller initialized for Market Intelligence');
  }

  /**
   * Obtiene señales enriquecidas con filtrado avanzado y paginación.
   */
  async getSignals(req, res) {
    try {
      console.log('[SignalController] 🔍 GET /signals request:', req.query);

      // Extraer y validar parámetros
      const {
        limit: limitStr = '20',
        lastId,
        source,
        sentiment,
        intent,
        startDate,
        endDate
      } = req.query;

      // Validar limit
      const limit = Math.min(parseInt(limitStr, 10) || 20, 100); // Máximo 100 por request
      
      // Validar y parsear fechas si están presentes
      let startDateObj;
      let endDateObj;

      if (startDate) {
        startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid startDate format. Use ISO string format.'
          });
        }
      }

      if (endDate) {
        endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid endDate format. Use ISO string format.'
          });
        }
      }

      // Validar valores de enum
      if (sentiment && !['positive', 'negative', 'neutral'].includes(sentiment)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid sentiment. Must be: positive, negative, or neutral'
        });
      }

      if (intent && !['commercial', 'informational', 'complaint', 'support', 'spam'].includes(intent)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid intent. Must be: commercial, informational, complaint, support, or spam'
        });
      }

      // Construir opciones de consulta
      const queryOptions = {
        limit: limit + 1, // +1 para detectar si hay más páginas
        lastId,
        source,
        sentiment,
        intent,
        startDate: startDateObj,
        endDate: endDateObj
      };

      console.log('[SignalController] 📊 Query options:', { 
        ...queryOptions, 
        startDate: startDateObj?.toISOString(),
        endDate: endDateObj?.toISOString() 
      });

      // Ejecutar consulta
      const result = await this.signalRepository.querySignals(queryOptions);

      // Manejar error en el repository
      if (!result.signals) {
        throw new Error(result.error || 'Unknown error in signal query');
      }

      // Detectar si hay más páginas
      const hasMore = result.signals.length > limit;
      const signals = hasMore ? result.signals.slice(0, -1) : result.signals;
      const newLastId = hasMore ? result.signals[limit - 1]?.id || result.lastId : null;

      const response = {
        success: true,
        data: signals,
        pagination: {
          lastId: newLastId,
          limit,
          hasMore
        }
      };

      console.log(`[SignalController] ✅ Returning ${signals.length} signals, hasMore: ${hasMore}`);

      res.json(response);

    } catch (error) {
      console.error('[SignalController] ❌ Error in getSignals:', error);
      
      const response = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Obtiene métricas del dashboard para "El Pulso del Imperio".
   */
  async getDashboardMetrics(req, res) {
    try {
      console.log('[SignalController] 📊 GET /dashboard-metrics request');

      // Calcular métricas usando el repository
      const metrics = await this.signalRepository.getDashboardMetrics();

      const response = {
        success: true,
        data: {
          empire_pulse: {
            totalProcessed: metrics.totalProcessed,
            period: metrics.period,
            timestamp: metrics.timestamp
          },
          sentiment_intelligence: {
            breakdown: metrics.sentimentBreakdown,
            dominant_sentiment: this.getDominantSentiment(metrics.sentimentBreakdown)
          },
          intention_analysis: {
            top_intents: metrics.topIntents,
            most_common: this.getMostCommonIntent(metrics.topIntents)
          },
          source_distribution: metrics.sources,
          system_health: {
            active_sources: Object.keys(metrics.sources).length,
            processing_status: 'operational',
            last_update: new Date().toISOString()
          }
        }
      };

      console.log(`[SignalController] ✅ Dashboard metrics calculated: ${metrics.totalProcessed} signals analyzed`);

      res.json(response);

    } catch (error) {
      console.error('[SignalController] ❌ Error in getDashboardMetrics:', error);
      
      const response = {
        success: false,
        error: error instanceof Error ? error.message : 'Error calculating dashboard metrics'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Determina el sentimiento dominante del período analizado.
   */
  getDominantSentiment(sentimentBreakdown) {
    const { positive, negative, neutral } = sentimentBreakdown;
    
    if (positive >= negative && positive >= neutral) return 'positive';
    if (negative >= neutral) return 'negative';
    return 'neutral';
  }

  /**
   * Determina la intención más común del período analizado.
   */
  getMostCommonIntent(topIntents) {
    if (Object.keys(topIntents).length === 0) return 'unknown';
    
    return Object.entries(topIntents)
      .reduce((a, b) => topIntents[a[0]] > topIntents[b[0]] ? a : b)[0];
  }

  /**
   * Obtiene estadísticas del controlador para monitoreo.
   */
  getControllerStats() {
    return {
      initialized: !!this.signalRepository,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { SignalController };