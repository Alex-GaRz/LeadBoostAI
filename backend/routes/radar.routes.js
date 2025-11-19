/**
 * ===============================================================================
 * RADAR SYSTEM API ROUTES - RUTAS DEL SISTEMA RADAR
 * ===============================================================================
 * 
 * Rutas API para el sistema RADAR (Reconnaissance, Analysis, Data, Action, Response)
 * Proporciona endpoints para:
 * - Ejecutar ciclos de ingesta de datos
 * - Monitorear salud del sistema 
 * - Obtener métricas de performance
 * - Gestionar configuraciones del radar
 * - Dashboard de observabilidad
 * 
 * @author LeadBoostAI - Radar System
 * @version 2.0.0 - Con monitoreo SRE integrado
 */

const express = require('express');
const router = express.Router();

// Importar el Orchestrator con monitoreo integrado (versión JavaScript)
const { Orchestrator } = require('../src/core/Orchestrator');
const RadarHealthMonitor = require('../src/core/monitoring/RadarHealthMonitor');

/**
 * ===============================================================================
 * 🏥 ENDPOINTS DE SALUD Y MONITOREO
 * ===============================================================================
 */

/**
 * GET /api/radar/health
 * Obtiene el estado de salud completo del sistema RADAR
 */
router.get('/health', async (req, res) => {
  try {
    const orchestrator = Orchestrator.getInstance();
    const healthCheck = await orchestrator.healthCheck();
    
    res.status(200).json({
      success: true,
      health: healthCheck,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error en health check:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/radar/metrics
 * Obtiene métricas de performance en tiempo real
 */
router.get('/metrics', async (req, res) => {
  try {
    const orchestrator = Orchestrator.getInstance();
    const stats = orchestrator.getHealthStats();
    const metrics = orchestrator.getHealthMetrics();
    
    res.status(200).json({
      success: true,
      data: {
        stats,
        metrics
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error obteniendo métricas:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/radar/report
 * Genera reporte completo del sistema
 */
router.get('/report', async (req, res) => {
  try {
    const orchestrator = Orchestrator.getInstance();
    const report = orchestrator.generateSystemReport();
    
    res.status(200).json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error generando reporte:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/radar/history
 * Obtiene historial de ejecuciones
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const orchestrator = Orchestrator.getInstance();
    const history = orchestrator.getExecutionHistory(parseInt(limit));
    
    res.status(200).json({
      success: true,
      history,
      total: history.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * ===============================================================================
 * 🚀 ENDPOINTS DE EJECUCIÓN
 * ===============================================================================
 */

/**
 * POST /api/radar/run
 * Ejecuta un ciclo de ingesta simple
 */
router.post('/run', async (req, res) => {
  try {
    const { source, query, maxResults = 50, continueOnError = true } = req.body;
    
    if (!source || !query) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren los campos: source, query',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[RADAR API] Ejecutando ciclo: ${source} - "${query}"`);
    
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const result = await orchestrator.runIngestionCycle(source, query, {
      maxResults,
      continueOnError
    });
    
    res.status(200).json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error ejecutando ciclo:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/radar/batch-run
 * Ejecuta múltiples ciclos de ingesta en paralelo
 */
router.post('/batch-run', async (req, res) => {
  try {
    const { configs } = req.body;
    
    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de configuraciones en el campo: configs',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[RADAR API] Ejecutando batch de ${configs.length} ciclos`);
    
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const result = await orchestrator.runBatchIngestion(configs);
    
    res.status(200).json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error ejecutando batch:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * ===============================================================================
 * 🔧 ENDPOINTS DE CONFIGURACIÓN Y CONTROL
 * ===============================================================================
 */

/**
 * POST /api/radar/initialize
 * Inicializa manualmente el sistema RADAR
 */
router.post('/initialize', async (req, res) => {
  try {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    res.status(200).json({
      success: true,
      message: 'Sistema RADAR inicializado correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error inicializando:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/radar/shutdown
 * Apaga el sistema RADAR de forma segura
 */
router.post('/shutdown', async (req, res) => {
  try {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.shutdown();
    
    res.status(200).json({
      success: true,
      message: 'Sistema RADAR apagado correctamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error en shutdown:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * ===============================================================================
 * 📊 ENDPOINTS DE DASHBOARD Y OBSERVABILIDAD
 * ===============================================================================
 */

/**
 * GET /api/radar/dashboard
 * Obtiene datos completos para dashboard en tiempo real
 */
router.get('/dashboard', async (req, res) => {
  try {
    const orchestrator = Orchestrator.getInstance();
    const healthMonitor = RadarHealthMonitor.getInstance();
    
    // Recopilar todas las métricas para el dashboard
    const [healthCheck, stats, metrics, history] = await Promise.all([
      orchestrator.healthCheck(),
      orchestrator.getHealthStats(),
      orchestrator.getHealthMetrics(),
      orchestrator.getExecutionHistory(10)
    ]);
    
    res.status(200).json({
      success: true,
      dashboard: {
        health: healthCheck,
        stats,
        metrics,
        recentHistory: history,
        systemStatus: metrics.healthStatus,
        uptime: metrics.uptime
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error generando dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/radar/status
 * Endpoint ligero para verificación rápida de estado
 */
router.get('/status', async (req, res) => {
  try {
    const healthMonitor = RadarHealthMonitor.getInstance();
    const stats = healthMonitor.getStats();
    const metrics = healthMonitor.getMetrics();
    
    res.status(200).json({
      success: true,
      status: {
        health: metrics.healthStatus,
        uptime: Math.round(metrics.uptime / 1000), // en segundos
        totalSignals: stats.totalSignalsCollected,
        successRate: metrics.successRate,
        lastUpdate: stats.lastUpdated
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error obteniendo status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * ===============================================================================
 * 🧪 ENDPOINTS DE TESTING Y DESARROLLO
 * ===============================================================================
 */

/**
 * POST /api/radar/test
 * Ejecuta pruebas del sistema RADAR
 */
router.post('/test', async (req, res) => {
  try {
    const { testType = 'basic' } = req.body;
    
    console.log(`[RADAR API] Ejecutando test: ${testType}`);
    
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    let testResult;
    
    switch (testType) {
      case 'basic':
        testResult = await orchestrator.runIngestionCycle(
          'TWITTER',
          'test query',
          { maxResults: 5 }
        );
        break;
        
      case 'batch':
        testResult = await orchestrator.runBatchIngestion([
          { source: 'TWITTER', query: 'test 1', maxResults: 3 },
          { source: 'TIKTOK', query: 'test 2', maxResults: 3 }
        ]);
        break;
        
      default:
        throw new Error(`Test type '${testType}' no soportado`);
    }
    
    res.status(200).json({
      success: true,
      testType,
      result: testResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[RADAR API] Error en test:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 🧪 ENDPOINT DE PRUEBA QUIRÚRGICA - DISPARO ÚNICO (1 TWEET)
 * Ejecuta una prueba controlada con exactamente 1 tweet para verificar
 * que todo el pipeline funciona sin gastar cuota de API.
 */
router.get('/trigger-test', async (req, res) => {
  try {
    console.log('[TRIGGER-TEST] 🚀 Iniciando disparo único de prueba...');
    
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    console.log('[TRIGGER-TEST] 🧪 MODO PRUEBAS: Solo 1 tweet será procesado');
    
    const result = await orchestrator.runIngestionCycle('twitter', 'javascript programming', {
      maxResults: 1 // GARANTIZAR 1 TWEET
    });
    
    console.log('[TRIGGER-TEST] ✅ Prueba completada');
    
    res.json({
      success: true,
      test: 'DISPARO_ÚNICO',
      message: 'Prueba quirúrgica ejecutada (1 tweet máximo)',
      result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[TRIGGER-TEST] ❌ Error en prueba:', error.message);
    
    res.status(500).json({
      success: false,
      test: 'DISPARO_ÚNICO',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;