/**
 * ===============================================================================
 * RADAR HEALTH MONITOR - SISTEMA DE MONITOREO INTERNO SRE
 * ===============================================================================
 * 
 * Sistema de monitoreo singleton que mantiene estadísticas vitales del Sistema RADAR
 * en memoria para observabilidad y Site Reliability Engineering (SRE).
 * 
 * Proporciona métricas en tiempo real sobre:
 * - Estado operacional del sistema
 * - Contadores de ejecuciones y errores
 * - Última actividad y fuente activa
 * - Rendimiento y confiabilidad
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 * @pattern Singleton
 */

/**
 * Estados operacionales del sistema RADAR
 */
export type RadarStatus = 'IDLE' | 'RUNNING' | 'ERROR';

/**
 * Estructura de estado vital del sistema
 */
export interface RadarHealthState {
  /** Estado operacional actual */
  status: RadarStatus;
  
  /** Timestamp de la última ejecución iniciada */
  lastRun: Date | null;
  
  /** Timestamp de la última ejecución completada exitosamente */
  lastSuccessfulRun: Date | null;
  
  /** Total acumulado de señales recopiladas desde el inicio */
  totalSignalsCollected: number;
  
  /** Contador total de errores desde el inicio */
  errorsCount: number;
  
  /** Último error registrado (mensaje) */
  lastError: string | null;
  
  /** Timestamp del último error */
  lastErrorTime: Date | null;
  
  /** Fuente actualmente siendo procesada */
  activeSource: string | null;
  
  /** Timestamp de inicio del sistema */
  systemStartTime: Date;
  
  /** Número total de ejecuciones iniciadas */
  totalExecutions: number;
  
  /** Número total de ejecuciones exitosas */
  successfulExecutions: number;
  
  /** Duración promedio de ejecuciones en millisegundos */
  averageExecutionTime: number;
}

/**
 * Métricas detalladas de rendimiento
 */
export interface RadarMetrics {
  /** Uptime del sistema en millisegundos */
  uptime: number;
  
  /** Tasa de éxito (successful/total) */
  successRate: number;
  
  /** Señales por minuto promedio */
  signalsPerMinute: number;
  
  /** Errores por hora promedio */
  errorsPerHour: number;
  
  /** Tiempo desde la última ejecución en millisegundos */
  timeSinceLastRun: number | null;
  
  /** Tiempo desde el último error en millisegundos */
  timeSinceLastError: number | null;
  
  /** Estado de salud general */
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

/**
 * Historial de ejecuciones (ring buffer limitado)
 */
interface ExecutionRecord {
  /** Timestamp de inicio */
  startTime: Date;
  
  /** Timestamp de finalización */
  endTime: Date | null;
  
  /** Fuente procesada */
  source: string;
  
  /** Señales recopiladas */
  signalsCount: number;
  
  /** Duración en millisegundos */
  duration: number | null;
  
  /** Si fue exitosa */
  successful: boolean;
  
  /** Error si lo hubo */
  error: string | null;
}

/**
 * RADAR HEALTH MONITOR - Sistema de Monitoreo Singleton
 * 
 * Mantiene estado vital del sistema RADAR en memoria para observabilidad SRE.
 * Proporciona métricas en tiempo real y historial de operaciones.
 */
export class RadarHealthMonitor {
  private static instance: RadarHealthMonitor | null = null;
  
  /** Estado vital actual del sistema */
  private state: RadarHealthState;
  
  /** Historial limitado de ejecuciones (últimas 100) */
  private executionHistory: ExecutionRecord[] = [];
  
  /** Máximo número de registros en historial */
  private readonly MAX_HISTORY_SIZE = 100;
  
  /** Timestamp de ejecución actual para calcular duración */
  private currentExecutionStart: Date | null = null;

  /**
   * Constructor privado para patrón Singleton
   */
  private constructor() {
    this.state = {
      status: 'IDLE',
      lastRun: null,
      lastSuccessfulRun: null,
      totalSignalsCollected: 0,
      errorsCount: 0,
      lastError: null,
      lastErrorTime: null,
      activeSource: null,
      systemStartTime: new Date(),
      totalExecutions: 0,
      successfulExecutions: 0,
      averageExecutionTime: 0
    };

    console.log('[RadarHealthMonitor] 🏥 Health Monitor initialized');
    console.log(`[RadarHealthMonitor] 📊 System start time: ${this.state.systemStartTime.toISOString()}`);
  }

  /**
   * Obtiene la instancia única del monitor (Singleton)
   * 
   * @returns Instancia única del RadarHealthMonitor
   */
  public static getInstance(): RadarHealthMonitor {
    if (!RadarHealthMonitor.instance) {
      RadarHealthMonitor.instance = new RadarHealthMonitor();
    }
    return RadarHealthMonitor.instance;
  }

  /**
   * Inicia el seguimiento de una nueva ejecución
   * 
   * @param source - Fuente de datos siendo procesada
   */
  public startRun(source: string): void {
    const now = new Date();
    
    console.log(`[RadarHealthMonitor] 🚀 Starting execution for source: ${source}`);
    
    // Actualizar estado
    this.state.status = 'RUNNING';
    this.state.lastRun = now;
    this.state.activeSource = source;
    this.state.totalExecutions++;
    
    // Guardar timestamp para calcular duración
    this.currentExecutionStart = now;
    
    // Crear registro de ejecución
    const executionRecord: ExecutionRecord = {
      startTime: now,
      endTime: null,
      source,
      signalsCount: 0,
      duration: null,
      successful: false,
      error: null
    };
    
    // Agregar al historial
    this.addExecutionRecord(executionRecord);
    
    console.log(`[RadarHealthMonitor] 📊 Total executions: ${this.state.totalExecutions}`);
  }

  /**
   * Finaliza el seguimiento de una ejecución exitosa
   * 
   * @param signalsCount - Número de señales recopiladas
   */
  public endRun(signalsCount: number): void {
    const now = new Date();
    
    console.log(`[RadarHealthMonitor] ✅ Ending successful execution: ${signalsCount} signals collected`);
    
    // Calcular duración
    const duration = this.currentExecutionStart 
      ? now.getTime() - this.currentExecutionStart.getTime()
      : 0;
    
    // Actualizar estado
    this.state.status = 'IDLE';
    this.state.lastSuccessfulRun = now;
    this.state.totalSignalsCollected += signalsCount;
    this.state.successfulExecutions++;
    this.state.activeSource = null;
    
    // Actualizar tiempo promedio de ejecución
    this.updateAverageExecutionTime(duration);
    
    // Actualizar último registro de ejecución
    const lastRecord = this.executionHistory[this.executionHistory.length - 1];
    if (lastRecord && !lastRecord.endTime) {
      lastRecord.endTime = now;
      lastRecord.signalsCount = signalsCount;
      lastRecord.duration = duration;
      lastRecord.successful = true;
    }
    
    // Reset timestamp de ejecución actual
    this.currentExecutionStart = null;
    
    console.log(`[RadarHealthMonitor] 📈 Total signals collected: ${this.state.totalSignalsCollected}`);
    console.log(`[RadarHealthMonitor] ⏱️ Execution duration: ${duration}ms`);
    console.log(`[RadarHealthMonitor] 🎯 Success rate: ${this.calculateSuccessRate().toFixed(2)}%`);
  }

  /**
   * Registra un error en el sistema
   * 
   * @param error - Error ocurrido
   */
  public recordError(error: Error): void {
    const now = new Date();
    const errorMessage = error.message || 'Unknown error';
    
    console.error(`[RadarHealthMonitor] ❌ Error recorded: ${errorMessage}`);
    
    // Actualizar estado
    this.state.status = 'ERROR';
    this.state.errorsCount++;
    this.state.lastError = errorMessage;
    this.state.lastErrorTime = now;
    this.state.activeSource = null; // Limpiar fuente activa en error
    
    // Actualizar último registro de ejecución con error
    const lastRecord = this.executionHistory[this.executionHistory.length - 1];
    if (lastRecord && !lastRecord.endTime) {
      lastRecord.endTime = now;
      lastRecord.successful = false;
      lastRecord.error = errorMessage;
      
      // Calcular duración hasta el error
      if (this.currentExecutionStart) {
        lastRecord.duration = now.getTime() - this.currentExecutionStart.getTime();
      }
    }
    
    // Reset timestamp de ejecución actual
    this.currentExecutionStart = null;
    
    console.error(`[RadarHealthMonitor] 🔥 Total errors: ${this.state.errorsCount}`);
    console.error(`[RadarHealthMonitor] 📉 Success rate: ${this.calculateSuccessRate().toFixed(2)}%`);
  }

  /**
   * Obtiene el estado vital actual del sistema
   * 
   * @returns Estado completo del sistema
   */
  public getStats(): RadarHealthState {
    // Retornar copia inmutable del estado
    return {
      ...this.state,
      lastRun: this.state.lastRun ? new Date(this.state.lastRun) : null,
      lastSuccessfulRun: this.state.lastSuccessfulRun ? new Date(this.state.lastSuccessfulRun) : null,
      systemStartTime: new Date(this.state.systemStartTime),
      lastErrorTime: this.state.lastErrorTime ? new Date(this.state.lastErrorTime) : null
    };
  }

  /**
   * Obtiene métricas calculadas de rendimiento
   * 
   * @returns Métricas de rendimiento del sistema
   */
  public getMetrics(): RadarMetrics {
    const now = new Date();
    const uptime = now.getTime() - this.state.systemStartTime.getTime();
    const successRate = this.calculateSuccessRate();
    const signalsPerMinute = this.calculateSignalsPerMinute();
    const errorsPerHour = this.calculateErrorsPerHour();
    
    const timeSinceLastRun = this.state.lastRun 
      ? now.getTime() - this.state.lastRun.getTime()
      : null;
      
    const timeSinceLastError = this.state.lastErrorTime
      ? now.getTime() - this.state.lastErrorTime.getTime()
      : null;

    const healthStatus = this.calculateHealthStatus(successRate, timeSinceLastRun, timeSinceLastError);

    return {
      uptime,
      successRate,
      signalsPerMinute,
      errorsPerHour,
      timeSinceLastRun,
      timeSinceLastError,
      healthStatus
    };
  }

  /**
   * Obtiene historial limitado de ejecuciones
   * 
   * @param limit - Número máximo de registros (default: 20)
   * @returns Array de registros de ejecución
   */
  public getExecutionHistory(limit: number = 20): ExecutionRecord[] {
    return this.executionHistory
      .slice(-limit)
      .map(record => ({
        ...record,
        startTime: new Date(record.startTime),
        endTime: record.endTime ? new Date(record.endTime) : null
      }));
  }

  /**
   * Resetea las estadísticas del sistema
   */
  public resetStats(): void {
    console.log('[RadarHealthMonitor] 🔄 Resetting system statistics');
    
    const systemStartTime = new Date();
    
    this.state = {
      status: 'IDLE',
      lastRun: null,
      lastSuccessfulRun: null,
      totalSignalsCollected: 0,
      errorsCount: 0,
      lastError: null,
      lastErrorTime: null,
      activeSource: null,
      systemStartTime,
      totalExecutions: 0,
      successfulExecutions: 0,
      averageExecutionTime: 0
    };

    this.executionHistory = [];
    this.currentExecutionStart = null;

    console.log('[RadarHealthMonitor] ✅ Statistics reset completed');
  }

  /**
   * Genera reporte detallado del estado del sistema
   */
  public generateReport(): string {
    const stats = this.getStats();
    const metrics = this.getMetrics();
    
    const report = `
🏥 ===== RADAR HEALTH MONITOR REPORT =====

📊 SYSTEM STATUS:
   Status: ${stats.status}
   Active Source: ${stats.activeSource || 'None'}
   Uptime: ${this.formatDuration(metrics.uptime)}
   Health: ${metrics.healthStatus}

📈 EXECUTION METRICS:
   Total Executions: ${stats.totalExecutions}
   Successful: ${stats.successfulExecutions}
   Success Rate: ${metrics.successRate.toFixed(2)}%
   Avg Duration: ${stats.averageExecutionTime.toFixed(0)}ms

📊 DATA COLLECTION:
   Total Signals: ${stats.totalSignalsCollected}
   Signals/Minute: ${metrics.signalsPerMinute.toFixed(2)}

❌ ERROR TRACKING:
   Total Errors: ${stats.errorsCount}
   Errors/Hour: ${metrics.errorsPerHour.toFixed(2)}
   Last Error: ${stats.lastError || 'None'}

⏰ TIMING:
   System Start: ${stats.systemStartTime.toISOString()}
   Last Run: ${stats.lastRun?.toISOString() || 'Never'}
   Last Success: ${stats.lastSuccessfulRun?.toISOString() || 'Never'}
   Time Since Last Run: ${metrics.timeSinceLastRun ? this.formatDuration(metrics.timeSinceLastRun) : 'N/A'}

========================================
    `;
    
    return report.trim();
  }

  // ========================================================================
  // MÉTODOS PRIVADOS AUXILIARES
  // ========================================================================

  /**
   * Agrega registro de ejecución al historial
   */
  private addExecutionRecord(record: ExecutionRecord): void {
    this.executionHistory.push(record);
    
    // Mantener tamaño limitado (ring buffer)
    if (this.executionHistory.length > this.MAX_HISTORY_SIZE) {
      this.executionHistory.shift();
    }
  }

  /**
   * Actualiza el tiempo promedio de ejecución
   */
  private updateAverageExecutionTime(newDuration: number): void {
    if (this.state.successfulExecutions === 0) {
      this.state.averageExecutionTime = newDuration;
    } else {
      // Promedio móvil
      this.state.averageExecutionTime = 
        ((this.state.averageExecutionTime * (this.state.successfulExecutions - 1)) + newDuration) 
        / this.state.successfulExecutions;
    }
  }

  /**
   * Calcula tasa de éxito
   */
  private calculateSuccessRate(): number {
    if (this.state.totalExecutions === 0) return 100;
    return (this.state.successfulExecutions / this.state.totalExecutions) * 100;
  }

  /**
   * Calcula señales por minuto
   */
  private calculateSignalsPerMinute(): number {
    const uptime = new Date().getTime() - this.state.systemStartTime.getTime();
    const uptimeMinutes = uptime / (1000 * 60);
    return uptimeMinutes > 0 ? this.state.totalSignalsCollected / uptimeMinutes : 0;
  }

  /**
   * Calcula errores por hora
   */
  private calculateErrorsPerHour(): number {
    const uptime = new Date().getTime() - this.state.systemStartTime.getTime();
    const uptimeHours = uptime / (1000 * 60 * 60);
    return uptimeHours > 0 ? this.state.errorsCount / uptimeHours : 0;
  }

  /**
   * Calcula estado de salud general
   */
  private calculateHealthStatus(
    successRate: number, 
    timeSinceLastRun: number | null, 
    timeSinceLastError: number | null
  ): 'HEALTHY' | 'DEGRADED' | 'CRITICAL' {
    // Crítico si tasa de éxito < 70%
    if (successRate < 70) return 'CRITICAL';
    
    // Crítico si hay error reciente (< 10 minutos)
    if (timeSinceLastError && timeSinceLastError < 10 * 60 * 1000) return 'CRITICAL';
    
    // Degradado si tasa de éxito < 90%
    if (successRate < 90) return 'DEGRADED';
    
    // Degradado si no ha corrido en más de 2 horas
    if (timeSinceLastRun && timeSinceLastRun > 2 * 60 * 60 * 1000) return 'DEGRADED';
    
    return 'HEALTHY';
  }

  /**
   * Formatea duración en texto legible
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

export default RadarHealthMonitor;