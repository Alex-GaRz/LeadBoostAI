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

        // Guardar señales en Firebase
        const savePromises = twitterResults.map(signal => 
          this.signalRepository.saveSignal(signal)
        );
        
        await Promise.all(savePromises);
        
        execution.status = 'completed';
        execution.endTime = new Date();
        execution.signalsFound = twitterResults.length;
        execution.duration = Date.now() - startTime;
        
        this.healthMonitor.endRun(twitterResults.length);
        
        console.log(`[Orchestrator] ✅ Real ingestion completed: ${twitterResults.length} signals processed`);
        
        return {
          success: true,
          source,
          signalsCollected: twitterResults.length,
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
          console.log(`[Orchestrator] 📰 NewsAPI returned ${newsResults.length} signals`);
          
        } catch (error) {
          console.log(`[Orchestrator] ❌ Error de NewsAPI:`, error.message);
          throw error;
        }

        // Guardar señales en Firebase
        const savePromises = newsResults.map(signal => 
          this.signalRepository.saveSignal(signal)
        );
        
        await Promise.all(savePromises);
        
        execution.status = 'completed';
        execution.endTime = new Date();
        execution.signalsFound = newsResults.length;
        execution.duration = Date.now() - startTime;
        
        this.healthMonitor.endRun(newsResults.length);
        
        console.log(`[Orchestrator] ✅ News ingestion completed: ${newsResults.length} signals processed`);
        
        return {
          success: true,
          source: 'news_api',
          signalsCollected: newsResults.length,
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