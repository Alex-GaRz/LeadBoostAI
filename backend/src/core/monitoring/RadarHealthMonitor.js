/**
 * ===============================================================================
 * RADAR HEALTH MONITOR - JAVASCRIPT BRIDGE
 * ===============================================================================
 * 
 * Bridge JavaScript para el sistema de monitoreo de salud RADAR
 */

class RadarHealthMonitor {
  static instance = null;

  constructor() {
    this.stats = {
      status: 'MOCK_MODE',
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalSignalsCollected: 0,
      errorsCount: 0,
      lastUpdated: Date.now(),
      startTime: Date.now()
    };

    this.executionHistory = [];
    console.log('[RadarHealthMonitor] 🏥 Mock Health Monitor initialized');
  }

  static getInstance() {
    if (!RadarHealthMonitor.instance) {
      RadarHealthMonitor.instance = new RadarHealthMonitor();
    }
    return RadarHealthMonitor.instance;
  }

  startRun(source) {
    console.log(`[RadarHealthMonitor] 📊 Mock: Starting monitoring for ${source}`);
    this.currentRun = {
      source,
      startTime: Date.now(),
      status: 'RUNNING'
    };
  }

  endRun(signalsCollected) {
    if (this.currentRun) {
      const duration = Date.now() - this.currentRun.startTime;
      
      this.stats.totalRuns++;
      this.stats.successfulRuns++;
      this.stats.totalSignalsCollected += signalsCollected;
      this.stats.lastUpdated = Date.now();

      this.executionHistory.unshift({
        source: this.currentRun.source,
        timestamp: this.currentRun.startTime,
        duration,
        signalsCollected,
        successful: true,
        status: 'COMPLETED'
      });

      // Mantener solo los últimos 50 registros
      if (this.executionHistory.length > 50) {
        this.executionHistory = this.executionHistory.slice(0, 50);
      }

      console.log(`[RadarHealthMonitor] ✅ Mock: Run completed - ${signalsCollected} signals in ${duration}ms`);
      this.currentRun = null;
    }
  }

  recordError(error) {
    this.stats.errorsCount++;
    this.stats.failedRuns++;
    this.stats.lastUpdated = Date.now();

    if (this.currentRun) {
      const duration = Date.now() - this.currentRun.startTime;
      
      this.executionHistory.unshift({
        source: this.currentRun.source,
        timestamp: this.currentRun.startTime,
        duration,
        signalsCollected: 0,
        successful: false,
        error: error.message,
        status: 'FAILED'
      });

      this.currentRun = null;
    }

    console.log(`[RadarHealthMonitor] ❌ Mock: Error recorded: ${error.message}`);
  }

  getStats() {
    return { ...this.stats };
  }

  getMetrics() {
    const totalRuns = this.stats.totalRuns || 1;
    const uptime = Date.now() - this.stats.startTime;
    
    return {
      successRate: totalRuns > 0 ? Math.round((this.stats.successfulRuns / totalRuns) * 100) : 0,
      averageSignalsPerRun: totalRuns > 0 ? Math.round(this.stats.totalSignalsCollected / totalRuns) : 0,
      healthStatus: this.stats.errorsCount === 0 ? 'MOCK_HEALTHY' : 'MOCK_WARNING',
      uptime,
      lastRunDuration: this.executionHistory[0]?.duration || 0,
      errorRate: totalRuns > 0 ? Math.round((this.stats.failedRuns / totalRuns) * 100) : 0
    };
  }

  generateReport() {
    const metrics = this.getMetrics();
    const stats = this.getStats();
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                        🎯 RADAR HEALTH MONITOR REPORT                        ║
║                              (DEVELOPMENT MOCK)                             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ 📊 ESTADÍSTICAS GENERALES                                                   ║
║   • Estado: ${stats.status.padEnd(20)} • Uptime: ${Math.round(metrics.uptime/1000)}s               ║
║   • Total Ejecuciones: ${stats.totalRuns.toString().padEnd(12)} • Señales: ${stats.totalSignalsCollected.toString().padEnd(10)}        ║
║   • Exitosas: ${stats.successfulRuns.toString().padEnd(17)} • Fallidas: ${stats.failedRuns.toString().padEnd(8)}        ║
║                                                                              ║
║ 📈 MÉTRICAS DE PERFORMANCE                                                   ║
║   • Tasa de Éxito: ${metrics.successRate}%${' '.repeat(15)} • Promedio/Run: ${metrics.averageSignalsPerRun}      ║
║   • Estado de Salud: ${metrics.healthStatus.padEnd(13)} • Errores: ${stats.errorsCount}%            ║
║                                                                              ║
║ 🔄 ÚLTIMA ACTIVIDAD                                                         ║
║   • Última Actualización: ${new Date(stats.lastUpdated).toLocaleString().padEnd(25)}║
║   • Duración Última Run: ${metrics.lastRunDuration}ms${' '.repeat(20)}                    ║
║                                                                              ║
║ ⚠️  NOTA: Este es un sistema MOCK para desarrollo                            ║
║    No se realizan llamadas API reales                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
  }

  getExecutionHistory(limit = 20) {
    return this.executionHistory.slice(0, limit);
  }

  reset() {
    this.stats = {
      status: 'MOCK_MODE',
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalSignalsCollected: 0,
      errorsCount: 0,
      lastUpdated: Date.now(),
      startTime: Date.now()
    };
    this.executionHistory = [];
    console.log('[RadarHealthMonitor] 🔄 Mock: Stats reset');
  }
}

module.exports = RadarHealthMonitor;