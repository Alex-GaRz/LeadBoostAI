/**
 * ===============================================================================
 * ORCHESTRATOR - IMPLEMENTACIÓN REAL CON APIS REALES
 * ===============================================================================
 * 
 * Orchestrator real que integra TwitterConnector y SignalRepository reales
 * para operaciones de producción del sistema RADAR.
 * 
 * @author LeadBoostAI - Radar System
 * @version 2.0.0 - Implementación Real con APIs
 */

const { SignalRepository } = require('../repositories/SignalRepository');
const { RadarHealthMonitor } = require('./RadarHealthMonitor');
const { LEADBOOST_RATE_LIMITS, isNearRateLimit } = require('../../config/twitter-rate-limits');

// Importar implementación JavaScript del NormalizationService desde el archivo de integración
const { OrchestratorNormalizationService } = require('../../core/OrchestratorNormalizationIntegration');

// Importar AnalystServiceBridge para conexión con el Bloque 4
const analystBridge = require('./analysis/AnalystServiceBridge');

// Importar NLPProcessor para enriquecimiento de señales con IA
let NLPProcessor = null;
try {
  // Usar la versión JavaScript del NLPProcessor
  const NLPProcessorClass = require('./processing/NLPProcessor');
  NLPProcessor = NLPProcessorClass;
  console.log('[Orchestrator] 🤖 NLPProcessor importado exitosamente');
} catch (error) {
  console.warn('[Orchestrator] ⚠️ NLPProcessor no disponible:', error.message);
}

class Orchestrator {
  static instance = null;

  constructor() {
    this.isInitialized = false;
    this.signalRepository = new SignalRepository();
    this.healthMonitor = new RadarHealthMonitor();
    this.execHistory = [];
    
    // Rate limiting configuration (PRODUCCIÓN)
    this.rateLimiting = {
      twitter: {
        lastRequest: 0,
        minInterval: 5000, // 5 segundos entre requests
        requestsPerWindow: 50, // 50 requests por ventana
        windowSeconds: 900, // 15 minutos
        requestHistory: []
      }
    };
    
    console.log('[Orchestrator] 🧠 Real Orchestrator initialized with Firebase & APIs');
  }

  static getInstance() {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        console.log('[Orchestrator] ℹ️ Already initialized');
        return;
      }

      console.log('[Orchestrator] 🚀 Initializing real systems...');
      
      // Inicializar SignalRepository (Firebase)
      await this.signalRepository.initialize();
      
      // Inicializar health monitor
      await this.healthMonitor.initialize();
      
      this.isInitialized = true;
      console.log('[Orchestrator] ✅ Real Orchestrator fully initialized');
      
    } catch (error) {
      console.error('[Orchestrator] ❌ Initialization failed:', error.message);
      throw error;
    }
  }

  async healthCheck() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Verificar Firebase
      const firebaseHealth = await this.signalRepository.healthCheck();
      
      // Verificar health monitor
      const monitorHealth = await this.healthMonitor.healthCheck();

      const overall = firebaseHealth && monitorHealth ? 'HEALTHY' : 'UNHEALTHY';
      
      console.log(`[Orchestrator] 🏥 System health: ${overall}`);
      
      return {
        status: overall,
        components: {
          firebase: firebaseHealth ? 'HEALTHY' : 'UNHEALTHY',
          monitor: monitorHealth ? 'HEALTHY' : 'UNHEALTHY'
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[Orchestrator] 💔 Health check failed:', error.message);
      return {
        status: 'UNHEALTHY',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Rate limiting inteligente para producción
   */
  async checkTwitterRateLimit() {
    const now = Date.now();
    const twitter = this.rateLimiting.twitter;
    
    // Limpiar requests antiguos (ventana de 15 minutos)
    const windowMs = twitter.windowSeconds * 1000;
    twitter.requestHistory = twitter.requestHistory.filter(
      timestamp => now - timestamp < windowMs
    );
    
    // Verificar si estamos cerca del límite (80%)
    const utilizationPercentage = (twitter.requestHistory.length / twitter.requestsPerWindow) * 100;
    
    if (utilizationPercentage > 80) {
      console.log(`[Orchestrator] ⚠️ Rate limit usage: ${utilizationPercentage.toFixed(1)}%`);
    }
    
    // Si alcanzamos el límite, esperar
    if (twitter.requestHistory.length >= twitter.requestsPerWindow) {
      const oldestRequest = Math.min(...twitter.requestHistory);
      const waitTime = windowMs - (now - oldestRequest) + 1000;
      
      console.log(`[Orchestrator] ⏳ Rate limit alcanzado, esperando ${Math.round(waitTime/1000)}s`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Intervalo mínimo entre requests
    const timeSinceLastRequest = now - twitter.lastRequest;
    if (timeSinceLastRequest < twitter.minInterval) {
      const waitTime = twitter.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Registrar request
    twitter.lastRequest = Date.now();
    twitter.requestHistory.push(twitter.lastRequest);
  }

  /**
   * Maneja errores de rate limiting con retry exponencial
   */
  async handleRateLimitError(error, attempt = 1, maxAttempts = 3) {
    if (error.message.includes('RATE_LIMIT') && attempt < maxAttempts) {
      const waitTime = Math.pow(2, attempt) * 1000; // Backoff exponencial
      
      console.log(`[Orchestrator] 🔄 Rate limit error, retrying in ${waitTime}ms (attempt ${attempt + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return true; // Indica que se debe reintentar
    }
    
    return false; // No reintentar
  }

  getHealthStats() {
    return this.healthMonitor.getStats();
  }

  getHealthMetrics() {
    return this.healthMonitor.getMetrics();
  }

  /**
   * Obtiene estadísticas completas del Orchestrator incluyendo normalización.
   */
  getStats() {
    const healthStats = this.healthMonitor.getStats();
    const healthMetrics = this.healthMonitor.getMetrics();
    
    // Calcular estadísticas de normalización del historial
    const completedExecutions = this.execHistory.filter(exec => exec.status === 'completed');
    const totalSignalsNormalized = completedExecutions.reduce((sum, exec) => 
      sum + (exec.signalsNormalized || 0), 0
    );
    const totalNormalizationErrors = completedExecutions.reduce((sum, exec) => 
      sum + (exec.normalizationErrors || 0), 0
    );
    
    return {
      // Estadísticas generales
      totalExecutions: this.execHistory.length,
      completedExecutions: completedExecutions.length,
      successRate: healthMetrics.successRate,
      
      // Estadísticas de normalización
      totalSignalsProcessed: completedExecutions.reduce((sum, exec) => 
        sum + (exec.signalsFound || 0), 0
      ),
      totalSignalsNormalized,
      totalNormalizationErrors,
      normalizationSuccessRate: totalSignalsNormalized > 0 ? 
        ((totalSignalsNormalized / (totalSignalsNormalized + totalNormalizationErrors)) * 100).toFixed(1) + '%' : 'N/A',
      
      // Estadísticas de salud del sistema
      systemHealth: healthStats.status,
      lastUpdated: healthStats.lastUpdated,
      
      // Historial reciente
      recentExecutions: this.execHistory.slice(-5)
    };
  }

  generateSystemReport() {
    const stats = this.getHealthStats();
    const metrics = this.getHealthMetrics();
    
    return `
=== RADAR SYSTEM REPORT (REAL MODE) ===
Status: ${stats.status}
Firebase: Connected
Health Monitor: Active
Total Runs: ${stats.totalRuns}
Success Rate: ${metrics.successRate}%
Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}
=================================
`;
  }

  getExecutionHistory(limit = 10) {
    return this.execHistory.slice(-limit);
  }

  async runIngestionCycle(source, query, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`[Orchestrator] 🔄 Starting real ingestion cycle for: ${source}`);
      
      this.healthMonitor.startRun(source);
      
      const startTime = Date.now();
      const execution = {
        id: `exec_${Date.now()}`,
        source,
        query,
        startTime: new Date(),
        status: 'running'
      };
      
      this.execHistory.push(execution);

      // Para Twitter, usar RadarService real (case-insensitive)
      if (source.toLowerCase() === 'twitter') {
        // Verificar rate limits antes de la llamada
        await this.checkTwitterRateLimit();
        
        const { searchTwitterSignals } = require('../../RadarService');
        
        console.log('[Orchestrator] 🐦 Ejecutando búsqueda en Twitter API');
        
        // Búsqueda normal con manejo de errores
        try {
          twitterResults = await searchTwitterSignals({
            query,
            maxResults: options.maxResults || 1 // FORZAR 1 TWEET PARA PRUEBAS
          });
        } catch (error) {
          console.log(`[Orchestrator] ❌ Error de Twitter:`, error.message);
          
          // Si es rate limit, intentar una vez más después de un delay
          if (error.message.includes('RATE_LIMIT')) {
            console.log(`[Orchestrator] 🔄 Reintentando después de rate limit...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            try {
              twitterResults = await searchTwitterSignals({
                query,
                maxResults: options.maxResults || 1 // SOLO 1 TWEET EN RETRY TAMBIÉN
              });
            } catch (retryError) {
              throw retryError;
            }
          } else {
            throw error;
          }
        }

        console.log(`[Orchestrator] 🐦 Twitter returned ${twitterResults.length} raw signals`);
        
        // === PASO DE NORMALIZACIÓN ===
        console.log('[Orchestrator] 🧽 Starting normalization process...');
        const normalizationService = new OrchestratorNormalizationService();
        
        let normalizedSignals = [];
        let normalizationErrors = 0;
        
        for (const rawSignal of twitterResults) {
          try {
            const normalizedSignal = await normalizationService.normalizeSignal(rawSignal);
            normalizedSignals.push(normalizedSignal);
          } catch (normError) {
            console.error(`[Orchestrator] ❌ Normalization error for signal ${rawSignal.id}:`, normError.message);
            normalizationErrors++;
            // Mantener señal original en caso de error de normalización
            normalizedSignals.push(rawSignal);
          }
        }
        
        console.log(`[Orchestrator] ✅ Normalized ${normalizedSignals.length - normalizationErrors}/${twitterResults.length} signals successfully`);
        if (normalizationErrors > 0) {
          console.log(`[Orchestrator] ⚠️ ${normalizationErrors} signals failed normalization, kept original format`);
        }

        // === PASO DE ENRIQUECIMIENTO CON IA ===
        console.log('[Orchestrator] 🤖 Starting NLP enrichment process...');
        let enrichedSignals = [];
        let enrichmentErrors = 0;
        
        if (NLPProcessor) {
          try {
            const nlpProcessor = NLPProcessor.getInstance();
            
            // Procesar señales en lotes para evitar rate limits de OpenAI
            for (const normalizedSignal of normalizedSignals) {
              try {
                const enrichedSignal = await nlpProcessor.enrichSignal(normalizedSignal);
                if (enrichedSignal) {
                  enrichedSignals.push(enrichedSignal);
                } else {
                  console.warn(`[Orchestrator] ⚠️ Enrichment returned null for signal ${normalizedSignal.contentHash?.slice(0, 8)}`);
                  enrichedSignals.push(normalizedSignal); // Mantener señal normalizada
                }
              } catch (enrichError) {
                console.error(`[Orchestrator] ❌ Enrichment error for signal ${normalizedSignal.contentHash?.slice(0, 8)}:`, enrichError.message);
                enrichmentErrors++;
                enrichedSignals.push(normalizedSignal); // Mantener señal normalizada
              }
            }
            
            console.log(`[Orchestrator] ✅ Enriched ${enrichedSignals.length - enrichmentErrors}/${normalizedSignals.length} signals successfully`);
            if (enrichmentErrors > 0) {
              console.log(`[Orchestrator] ⚠️ ${enrichmentErrors} signals failed enrichment, kept normalized format`);
            }
          } catch (error) {
            console.error(`[Orchestrator] ❌ NLPProcessor error:`, error.message);
            enrichedSignals = normalizedSignals; // Fallback a señales normalizadas
            enrichmentErrors = normalizedSignals.length;
          }
        } else {
          console.warn(`[Orchestrator] ⚠️ NLPProcessor not available, skipping enrichment`);
          enrichedSignals = normalizedSignals; // Usar señales normalizadas sin enriquecimiento
        }

        // === INTEGRACIÓN BLOQUE 4 - ANÁLISIS PREDICTIVO ===
        console.log('[Orchestrator] 📊 Starting predictive analysis (Bloque 4)...');
        let criticalAlerts = [];
        
        for (const enrichedSignal of enrichedSignals) {
          try {
            const alert = await analystBridge.analyzeSignal(enrichedSignal);
            if (alert) {
              criticalAlerts.push(alert);
            }
          } catch (analysisError) {
            console.warn(`[Orchestrator] ⚠️ Analysis error for signal ${enrichedSignal.contentHash?.slice(0, 8)}:`, analysisError.message);
          }
        }
        
        if (criticalAlerts.length > 0) {
          console.log(`[Orchestrator] 🚨 ${criticalAlerts.length} critical alerts generated by Bloque 4`);
        } else {
          console.log(`[Orchestrator] ✅ Predictive analysis completed - no critical anomalies detected`);
        }
        // === FIN INTEGRACIÓN BLOQUE 4 ===

        // Guardar señales enriquecidas en Firebase
        const savePromises = enrichedSignals.map(signal => 
          this.signalRepository.saveSignal(signal)
        );
        
        await Promise.all(savePromises);
        
        execution.status = 'completed';
        execution.endTime = new Date();
        execution.signalsFound = twitterResults.length;
        execution.signalsNormalized = normalizedSignals.length - normalizationErrors;
        execution.normalizationErrors = normalizationErrors;
        execution.signalsEnriched = enrichedSignals.length - enrichmentErrors;
        execution.enrichmentErrors = enrichmentErrors;
        execution.duration = Date.now() - startTime;
        
        this.healthMonitor.endRun(enrichedSignals.length);
        
        console.log(`[Orchestrator] ✅ Real ingestion completed: ${enrichedSignals.length} signals processed (${enrichedSignals.length - enrichmentErrors} enriched)`);
        
        return {
          success: true,
          source,
          signalsCollected: enrichedSignals.length,
          signalsNormalized: normalizedSignals.length - normalizationErrors,
          normalizationErrors,
          signalsEnriched: enrichedSignals.length - enrichmentErrors,
          enrichmentErrors,
          executionId: execution.id,
          duration: execution.duration,
          timestamp: new Date().toISOString()
        };

      // Para NewsAPI, usar ConnectorFactory y NewsApiConnector
      } else if (source.toLowerCase() === 'news_api' || source.toLowerCase() === 'news') {
        console.log('[Orchestrator] 📰 Ejecutando búsqueda en NewsAPI');
        
        const { NewsApiConnector } = require('./connectors/NewsApiConnector');
        const connector = new NewsApiConnector();
        
        let newsResults;
        try {
          const fetchResult = await connector.fetchSignals({
            query,
            maxResults: options.maxResults || 1 // FORZAR 1 ARTÍCULO PARA PRUEBAS
          });
          
          newsResults = fetchResult.signals;
          console.log(`[Orchestrator] 📰 NewsAPI returned ${newsResults.length} raw signals`);
          
        } catch (error) {
          console.log(`[Orchestrator] ❌ Error de NewsAPI:`, error.message);
          throw error;
        }

        // === PASO DE NORMALIZACIÓN ===
        console.log('[Orchestrator] 🧽 Starting NewsAPI normalization process...');
        const normalizationService = new OrchestratorNormalizationService();
        
        let normalizedNewsSignals = [];
        let newsNormalizationErrors = 0;
        
        for (const rawSignal of newsResults) {
          try {
            const normalizedSignal = await normalizationService.normalizeSignal(rawSignal);
            normalizedNewsSignals.push(normalizedSignal);
          } catch (normError) {
            console.error(`[Orchestrator] ❌ NewsAPI normalization error for signal ${rawSignal.id}:`, normError.message);
            newsNormalizationErrors++;
            // Mantener señal original en caso de error de normalización
            normalizedNewsSignals.push(rawSignal);
          }
        }
        
        console.log(`[Orchestrator] ✅ Normalized ${normalizedNewsSignals.length - newsNormalizationErrors}/${newsResults.length} NewsAPI signals successfully`);
        if (newsNormalizationErrors > 0) {
          console.log(`[Orchestrator] ⚠️ ${newsNormalizationErrors} NewsAPI signals failed normalization, kept original format`);
        }

        // === PASO DE ENRIQUECIMIENTO CON IA ===
        console.log('[Orchestrator] 🤖 Starting NewsAPI NLP enrichment process...');
        let enrichedNewsSignals = [];
        let newsEnrichmentErrors = 0;
        
        if (NLPProcessor) {
          try {
            const nlpProcessor = NLPProcessor.getInstance();
            
            // Procesar señales en lotes para evitar rate limits de OpenAI
            for (const normalizedSignal of normalizedNewsSignals) {
              try {
                const enrichedSignal = await nlpProcessor.enrichSignal(normalizedSignal);
                if (enrichedSignal) {
                  enrichedNewsSignals.push(enrichedSignal);
                } else {
                  console.warn(`[Orchestrator] ⚠️ NewsAPI enrichment returned null for signal ${normalizedSignal.contentHash?.slice(0, 8)}`);
                  enrichedNewsSignals.push(normalizedSignal); // Mantener señal normalizada
                }
              } catch (enrichError) {
                console.error(`[Orchestrator] ❌ NewsAPI enrichment error for signal ${normalizedSignal.contentHash?.slice(0, 8)}:`, enrichError.message);
                newsEnrichmentErrors++;
                enrichedNewsSignals.push(normalizedSignal); // Mantener señal normalizada
              }
            }
            
            console.log(`[Orchestrator] ✅ Enriched ${enrichedNewsSignals.length - newsEnrichmentErrors}/${normalizedNewsSignals.length} NewsAPI signals successfully`);
            if (newsEnrichmentErrors > 0) {
              console.log(`[Orchestrator] ⚠️ ${newsEnrichmentErrors} NewsAPI signals failed enrichment, kept normalized format`);
            }
          } catch (error) {
            console.error(`[Orchestrator] ❌ NewsAPI NLPProcessor error:`, error.message);
            enrichedNewsSignals = normalizedNewsSignals; // Fallback a señales normalizadas
            newsEnrichmentErrors = normalizedNewsSignals.length;
          }
        } else {
          console.warn(`[Orchestrator] ⚠️ NLPProcessor not available for NewsAPI, skipping enrichment`);
          enrichedNewsSignals = normalizedNewsSignals; // Usar señales normalizadas sin enriquecimiento
        }

        // Guardar señales enriquecidas en Firebase
        const savePromises = enrichedNewsSignals.map(signal => 
          this.signalRepository.saveSignal(signal)
        );
        
        await Promise.all(savePromises);
        
        execution.status = 'completed';
        execution.endTime = new Date();
        execution.signalsFound = newsResults.length;
        execution.signalsNormalized = normalizedNewsSignals.length - newsNormalizationErrors;
        execution.normalizationErrors = newsNormalizationErrors;
        execution.signalsEnriched = enrichedNewsSignals.length - newsEnrichmentErrors;
        execution.enrichmentErrors = newsEnrichmentErrors;
        execution.duration = Date.now() - startTime;
        
        this.healthMonitor.endRun(enrichedNewsSignals.length);
        
        console.log(`[Orchestrator] ✅ News ingestion completed: ${enrichedNewsSignals.length} signals processed (${enrichedNewsSignals.length - newsEnrichmentErrors} enriched)`);
        
        return {
          success: true,
          source: 'news_api',
          signalsCollected: enrichedNewsSignals.length,
          signalsNormalized: normalizedNewsSignals.length - newsNormalizationErrors,
          normalizationErrors: newsNormalizationErrors,
          signalsEnriched: enrichedNewsSignals.length - newsEnrichmentErrors,
          enrichmentErrors: newsEnrichmentErrors,
          executionId: execution.id,
          duration: execution.duration,
          timestamp: new Date().toISOString()
        };

      } else {
        // Otras fuentes pueden ser implementadas aquí
        execution.status = 'skipped';
        execution.endTime = new Date();
        execution.signalsFound = 0;
        
        console.log(`[Orchestrator] ⚠️ Source ${source} not yet implemented for real API`);
        
        return {
          success: false,
          source,
          error: `Source ${source} not implemented`,
          timestamp: new Date().toISOString()
        };
      }
      
    } catch (error) {
      console.error('[Orchestrator] ❌ Real ingestion cycle failed:', error.message);
      
      this.healthMonitor.recordError(error);
      
      const execution = this.execHistory[this.execHistory.length - 1];
      if (execution) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.endTime = new Date();
      }
      
      throw error;
    }
  }

  async runBatchIngestion(configs) {
    try {
      console.log('[Orchestrator] 📦 Starting real batch ingestion...');
      
      const results = [];
      
      for (const config of configs) {
        try {
          const result = await this.runIngestionCycle(
            config.source, 
            config.query, 
            config.options
          );
          results.push(result);
          
          // Delay normal entre requests en batch
          if (configs.length > 1 && results.length < configs.length) {
            console.log(`[Orchestrator] ⏳ Delay entre requests de batch: 3s`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
        } catch (error) {
          results.push({
            success: false,
            source: config.source,
            error: error.message
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const total = results.length;
      
      console.log(`[Orchestrator] 📊 Real batch completed: ${successful}/${total} successful`);
      
      return {
        success: successful > 0,
        totalConfigs: total,
        successfulRuns: successful,
        failedRuns: total - successful,
        results,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[Orchestrator] ❌ Real batch ingestion failed:', error.message);
      throw error;
    }
  }
}

module.exports = { Orchestrator };