/**
 * ===============================================================================
 * RADAR HEALTH MONITOR - IMPLEMENTACIÓN REAL
 * ===============================================================================
 * 
 * Monitor de salud real para el sistema RADAR que rastrea métricas de rendimiento,
 * errores y estado general del sistema con persistencia y monitoreo en tiempo real.
 * 
 * @author LeadBoostAI - Radar System
 * @version 2.0.0 - Implementación Real
 */

class RadarHealthMonitor {
  constructor() {
    this.stats = {
      status: 'HEALTHY',
      totalRuns: 0,
      totalSignalsCollected: 0,
      errorsCount: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastUpdated: Date.now(),
      startupTime: Date.now()
    };
    
    this.currentRun = null;
    this.initialized = false;
    this.errorHistory = [];
    this.runHistory = [];
    
    console.log('[RadarHealthMonitor] 📊 Real Health Monitor initialized');
  }

  async initialize() {
    try {
      this.initialized = true;
      this.stats.lastUpdated = Date.now();
      
      console.log('[RadarHealthMonitor] ✅ Health Monitor fully initialized');
      return true;
      
    } catch (error) {
      console.error('[RadarHealthMonitor] ❌ Initialization failed:', error.message);
      this.stats.status = 'UNHEALTHY';
      return false;
    }
  }

  startRun(source) {
    this.currentRun = {
      id: `run_${Date.now()}`,
      source,
      startTime: Date.now(),
      signalsCollected: 0,
      status: 'running'
    };
    
    this.stats.totalRuns++;
    this.stats.lastUpdated = Date.now();
    
    console.log(`[RadarHealthMonitor] 📊 Run started for ${source} (ID: ${this.currentRun.id})`);
  }

  endRun(signalCount) {
    if (this.currentRun) {
      this.currentRun.signalsCollected = signalCount;
      this.currentRun.endTime = Date.now();
      this.currentRun.duration = this.currentRun.endTime - this.currentRun.startTime;
      this.currentRun.status = 'completed';
      
      // Actualizar estadísticas
      this.stats.totalSignalsCollected += signalCount;
      this.stats.successfulRuns++;
      this.stats.lastUpdated = Date.now();
      
      // Agregar al historial (mantener últimas 50 ejecuciones)
      this.runHistory.push({ ...this.currentRun });
      if (this.runHistory.length > 50) {
        this.runHistory.shift();
      }
      
      console.log(`[RadarHealthMonitor] ✅ Run completed: ${signalCount} signals in ${this.currentRun.duration}ms`);
      
      this.currentRun = null;
      this.updateHealthStatus();
    }
  }

  recordError(error) {
    const errorRecord = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      runId: this.currentRun?.id || null
    };
    
    this.stats.errorsCount++;
    this.stats.failedRuns++;
    this.stats.lastUpdated = Date.now();
    
    // Agregar al historial de errores (mantener últimos 20 errores)
    this.errorHistory.push(errorRecord);
    if (this.errorHistory.length > 20) {
      this.errorHistory.shift();
    }
    
    // Si el run actual existe, marcarlo como fallido
    if (this.currentRun) {
      this.currentRun.status = 'failed';
      this.currentRun.error = error.message;
      this.currentRun.endTime = Date.now();
      this.currentRun.duration = this.currentRun.endTime - this.currentRun.startTime;
    }
    
    console.log(`[RadarHealthMonitor] ❌ Error recorded: ${error.message}`);
    
    this.updateHealthStatus();
  }

  updateHealthStatus() {
    const total = this.stats.successfulRuns + this.stats.failedRuns;
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp < 300000 // Últimos 5 minutos
    ).length;
    
    // Determinar estado de salud
    if (recentErrors > 5) {
      this.stats.status = 'CRITICAL';
    } else if (recentErrors > 2 || (total > 0 && this.stats.successfulRuns / total < 0.8)) {
      this.stats.status = 'DEGRADED';
    } else {
      this.stats.status = 'HEALTHY';
    }
  }

  async healthCheck() {
    try {
      if (!this.initialized) {
        return false;
      }

      // Verificar si hay errores recientes críticos
      const recentCriticalErrors = this.errorHistory.filter(
        error => Date.now() - error.timestamp < 60000 // Último minuto
      ).length;

      const isHealthy = recentCriticalErrors < 3 && this.stats.status !== 'CRITICAL';
      
      console.log(`[RadarHealthMonitor] 🏥 Health check: ${isHealthy ? 'PASS' : 'FAIL'}`);
      
      return isHealthy;
      
    } catch (error) {
      console.error('[RadarHealthMonitor] 💔 Health check failed:', error.message);
      return false;
    }
  }

  getStats() {
    return {
      ...this.stats,
      currentRun: this.currentRun ? {
        source: this.currentRun.source,
        duration: Date.now() - this.currentRun.startTime,
        status: this.currentRun.status
      } : null
    };
  }

  getMetrics() {
    const total = this.stats.successfulRuns + this.stats.failedRuns;
    const uptime = Date.now() - this.stats.startupTime;
    
    return {
      successRate: total > 0 ? Number((this.stats.successfulRuns / total * 100).toFixed(2)) : 0,
      averageSignalsPerRun: this.stats.successfulRuns > 0 ? 
        Number((this.stats.totalSignalsCollected / this.stats.successfulRuns).toFixed(2)) : 0,
      healthStatus: this.stats.status,
      uptime: uptime,
      lastRunDuration: this.runHistory.length > 0 ? 
        this.runHistory[this.runHistory.length - 1].duration : 0,
      recentErrorCount: this.errorHistory.filter(
        error => Date.now() - error.timestamp < 300000
      ).length,
      averageRunDuration: this.runHistory.length > 0 ?
        this.runHistory.reduce((sum, run) => sum + (run.duration || 0), 0) / this.runHistory.length : 0
    };
  }

  generateReport() {
    const stats = this.getStats();
    const metrics = this.getMetrics();
    
    return `
=== RADAR HEALTH MONITOR REPORT (REAL MODE) ===
Status: ${stats.status}
Uptime: ${Math.floor(metrics.uptime / 1000 / 60)} minutes
Total Runs: ${stats.totalRuns}
Successful: ${stats.successfulRuns} | Failed: ${stats.failedRuns}
Success Rate: ${metrics.successRate}%
Total Signals: ${stats.totalSignalsCollected}
Average Signals/Run: ${metrics.averageSignalsPerRun}
Recent Errors: ${metrics.recentErrorCount}
Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}
==========================================
`;
  }

  getExecutionHistory(limit = 10) {
    return this.runHistory.slice(-limit).map(run => ({
      id: run.id,
      source: run.source,
      startTime: new Date(run.startTime).toISOString(),
      duration: run.duration,
      signalsCollected: run.signalsCollected,
      status: run.status,
      error: run.error || null
    }));
  }

  getErrorHistory(limit = 10) {
    return this.errorHistory.slice(-limit).map(error => ({
      timestamp: new Date(error.timestamp).toISOString(),
      message: error.message,
      runId: error.runId
    }));
  }

  // Método para limpiar datos antiguos (opcional, para mantenimiento)
  cleanup() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Limpiar errores antiguos (mantener solo última hora)
    this.errorHistory = this.errorHistory.filter(
      error => error.timestamp > oneHourAgo
    );
    
    console.log('[RadarHealthMonitor] 🧹 Cleanup completed');
  }
}

module.exports = { RadarHealthMonitor };