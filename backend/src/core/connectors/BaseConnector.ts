/**
 * ===============================================================================
 * BASE CONNECTOR - IMPLEMENTACIÓN BASE PARA TODOS LOS CONECTORES
 * ===============================================================================
 * 
 * Clase abstracta que proporciona funcionalidad común a todos los conectores
 * del sistema RADAR. Implementa manejo de errores, logging, métricas y
 * funcionalidades compartidas para evitar duplicación de código.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

import { 
  ISourceConnector, 
  ConnectorConfig, 
  SearchOptions, 
  FetchResult, 
  ConnectorHealth, 
  ConnectorStats 
} from '../interfaces/ISourceConnector';
import { UniversalSignal, SourceType } from '../../../../src/domain/models/UniversalSignal';

/**
 * Tipos de errores categorizados para manejo uniforme.
 */
export enum ConnectorErrorType {
  /** Error de configuración (API keys inválidos, etc.) */
  CONFIG_ERROR = 'CONFIG_ERROR',
  
  /** Error de red/conectividad */
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  /** Límite de API excedido (rate limit) */
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  /** Error de autenticación */
  AUTH_ERROR = 'AUTH_ERROR',
  
  /** Recurso no encontrado */
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  
  /** Error de validación de datos */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  /** Error interno de la API externa */
  API_ERROR = 'API_ERROR',
  
  /** Error de timeout */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  /** Error desconocido */
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Estructura estandardizada de errores del conector.
 */
export interface ConnectorError {
  type: ConnectorErrorType;
  message: string;
  originalError?: any;
  statusCode?: number;
  retryable: boolean;
  retryAfterMs?: number;
  timestamp: Date;
}

/**
 * Configuración de logging para el conector.
 */
interface LoggerConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamp: boolean;
  includeStackTrace: boolean;
}

/**
 * ===============================================================================
 * CLASE BASE ABSTRACTA: BaseConnector
 * ===============================================================================
 * 
 * Proporciona implementación común para todos los conectores, manejando:
 * - Sistema de logging robusto
 * - Manejo estandarizado de errores
 * - Métricas y estadísticas automáticas
 * - Gestión de configuración y lifecycle
 * - Rate limiting básico
 */
export abstract class BaseConnector implements ISourceConnector {
  // ========================================================================
  // PROPIEDADES ABSTRACTAS - Deben ser implementadas por cada conector
  // ========================================================================
  
  public abstract readonly sourceName: SourceType;
  public abstract readonly version: string;
  public abstract readonly description: string;
  
  // ========================================================================
  // PROPIEDADES IMPLEMENTADAS
  // ========================================================================
  
  public readonly config: ConnectorConfig;
  protected stats: ConnectorStats;
  protected lastHealthCheck?: ConnectorHealth;
  protected loggerConfig: LoggerConfig;
  protected isInitialized: boolean = false;
  protected isShuttingDown: boolean = false;
  
  // ========================================================================
  // CONSTRUCTOR
  // ========================================================================
  
  constructor(initialConfig: Partial<ConnectorConfig> = {}) {
    this.config = {
      enabled: false,
      timeoutMs: 30000, // 30 segundos por defecto
      rateLimitPerMinute: 60, // 60 requests por minuto por defecto
      ...initialConfig
    };
    
    this.stats = this.initializeStats();
    this.loggerConfig = {
      enabled: true,
      logLevel: 'info',
      includeTimestamp: true,
      includeStackTrace: false
    };
    
    this.log('debug', `${this.constructor.name} instantiated`);
  }
  
  // ========================================================================
  // MÉTODOS ABSTRACTOS - Cada conector debe implementar
  // ========================================================================
  
  /**
   * MÉTODO PRINCIPAL: Implementación específica de búsqueda de signals.
   * Cada conector debe implementar su lógica específica aquí.
   */
  abstract fetchSignals(options: SearchOptions): Promise<FetchResult>;
  
  /**
   * Validación específica de configuración para cada conector.
   */
  abstract validateConfig(): boolean;
  
  /**
   * Verificación de salud específica para cada API.
   */
  abstract healthCheck(): Promise<ConnectorHealth>;
  
  // ========================================================================
  // SISTEMA DE LOGGING
  // ========================================================================
  
  /**
   * Sistema de logging robusto con niveles y formato consistente.
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.loggerConfig.enabled) return;
    
    // Verificar nivel de log
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.loggerConfig.logLevel]) return;
    
    // Formatear mensaje
    const timestamp = this.loggerConfig.includeTimestamp 
      ? new Date().toISOString() 
      : '';
    
    const prefix = `[${this.sourceName}${this.loggerConfig.includeTimestamp ? ` - ${timestamp}` : ''}]`;
    const formattedMessage = `${prefix} ${level.toUpperCase()}: ${message}`;
    
    // Log según nivel
    switch (level) {
      case 'debug':
      case 'info':
        console.log(formattedMessage, data ? data : '');
        break;
      case 'warn':
        console.warn(formattedMessage, data ? data : '');
        break;
      case 'error':
        console.error(formattedMessage, data ? data : '');
        if (this.loggerConfig.includeStackTrace && data && data.stack) {
          console.error(data.stack);
        }
        break;
    }
  }
  
  // ========================================================================
  // MANEJO ROBUSTO DE ERRORES
  // ========================================================================
  
  /**
   * Manejador centralizado de errores que categoriza y estandariza errores.
   * Proporciona información consistente para logging, métricas y recuperación.
   */
  protected handleError(error: any, context?: string): ConnectorError {
    this.log('error', `Error in ${context || 'operation'}`, error);
    
    let connectorError: ConnectorError = {
      type: ConnectorErrorType.UNKNOWN_ERROR,
      message: 'An unknown error occurred',
      originalError: error,
      retryable: false,
      timestamp: new Date()
    };
    
    // Categorizar error basándose en diferentes indicadores
    if (typeof error === 'string') {
      connectorError.message = error;
      connectorError.type = ConnectorErrorType.UNKNOWN_ERROR;
    } else if (error instanceof Error) {
      connectorError.message = error.message;
      
      // Detectar tipos de error por mensaje o propiedades
      if (this.isNetworkError(error)) {
        connectorError.type = ConnectorErrorType.NETWORK_ERROR;
        connectorError.retryable = true;
        connectorError.retryAfterMs = 5000; // 5 segundos
      } else if (this.isTimeoutError(error)) {
        connectorError.type = ConnectorErrorType.TIMEOUT_ERROR;
        connectorError.retryable = true;
        connectorError.retryAfterMs = 10000; // 10 segundos
      }
    }
    
    // Manejar errores HTTP
    if (error.response || error.status || error.statusCode) {
      const statusCode = error.response?.status || error.status || error.statusCode;
      connectorError.statusCode = statusCode;
      
      switch (statusCode) {
        case 401:
        case 403:
          connectorError.type = ConnectorErrorType.AUTH_ERROR;
          connectorError.message = 'Authentication failed. Check API credentials.';
          connectorError.retryable = false;
          break;
          
        case 404:
          connectorError.type = ConnectorErrorType.NOT_FOUND_ERROR;
          connectorError.message = 'Requested resource not found.';
          connectorError.retryable = false;
          break;
          
        case 429:
          connectorError.type = ConnectorErrorType.RATE_LIMIT_EXCEEDED;
          connectorError.message = 'API rate limit exceeded.';
          connectorError.retryable = true;
          
          // Extraer tiempo de retry si está disponible
          const retryAfter = error.response?.headers?.['retry-after'] || 
                           error.response?.headers?.['x-rate-limit-reset'];
          if (retryAfter) {
            connectorError.retryAfterMs = parseInt(retryAfter) * 1000;
          } else {
            connectorError.retryAfterMs = 60000; // 1 minuto por defecto
          }
          break;
          
        case 400:
          connectorError.type = ConnectorErrorType.VALIDATION_ERROR;
          connectorError.message = 'Invalid request parameters.';
          connectorError.retryable = false;
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          connectorError.type = ConnectorErrorType.API_ERROR;
          connectorError.message = 'External API error. Service may be temporarily unavailable.';
          connectorError.retryable = true;
          connectorError.retryAfterMs = 30000; // 30 segundos
          break;
          
        default:
          if (statusCode >= 400 && statusCode < 500) {
            connectorError.type = ConnectorErrorType.VALIDATION_ERROR;
            connectorError.retryable = false;
          } else if (statusCode >= 500) {
            connectorError.type = ConnectorErrorType.API_ERROR;
            connectorError.retryable = true;
            connectorError.retryAfterMs = 30000;
          }
      }
    }
    
    // Actualizar estadísticas
    this.updateErrorStats(connectorError);
    
    this.log('error', `Categorized error: ${connectorError.type}`, {
      message: connectorError.message,
      retryable: connectorError.retryable,
      statusCode: connectorError.statusCode
    });
    
    return connectorError;
  }
  
  /**
   * Detecta si un error es de red/conectividad.
   */
  private isNetworkError(error: Error): boolean {
    const networkKeywords = [
      'network', 'connection', 'timeout', 'dns', 'econnrefused', 
      'enotfound', 'econnreset', 'socket', 'getaddrinfo'
    ];
    
    return networkKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }
  
  /**
   * Detecta si un error es de timeout.
   */
  private isTimeoutError(error: Error): boolean {
    const timeoutKeywords = ['timeout', 'etimedout', 'aborted'];
    
    return timeoutKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
  }
  
  // ========================================================================
  // WRAPPER PARA fetchSignals CON LOGGING Y MÉTRICAS
  // ========================================================================
  
  /**
   * Wrapper público que agrega logging, métricas y manejo de errores
   * al método fetchSignals implementado por cada conector.
   */
  async fetchSignalsWithLogging(options: SearchOptions): Promise<FetchResult> {
    const startTime = Date.now();
    const operationId = `fetch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    this.log('info', `🚀 Starting signal fetch operation [${operationId}]`, {
      query: options.query,
      maxResults: options.maxResults,
      source: this.sourceName
    });
    
    try {
      // Validar estado antes de ejecutar
      if (!this.isInitialized) {
        throw new Error('Connector not initialized');
      }
      
      if (this.isShuttingDown) {
        throw new Error('Connector is shutting down');
      }
      
      if (!this.config.enabled) {
        throw new Error('Connector is disabled');
      }
      
      // Ejecutar implementación específica
      const result = await this.fetchSignals(options);
      
      const duration = Date.now() - startTime;
      
      // Log resultado exitoso
      this.log('info', `✅ Signal fetch completed successfully [${operationId}]`, {
        signalsFound: result.signals.length,
        processed: result.processed,
        failed: result.failed,
        durationMs: duration
      });
      
      // Actualizar estadísticas
      this.updateStats(true, result.signals.length, duration);
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const connectorError = this.handleError(error, `fetchSignals [${operationId}]`);
      
      this.log('error', `❌ Signal fetch failed [${operationId}]`, {
        errorType: connectorError.type,
        retryable: connectorError.retryable,
        durationMs: duration
      });
      
      // Actualizar estadísticas de fallo
      this.updateStats(false, 0, duration);
      
      // Re-lanzar error para que el caller pueda manejar
      throw connectorError;
    }
  }
  
  // ========================================================================
  // IMPLEMENTACIONES COMUNES DE ISourceConnector
  // ========================================================================
  
  async initialize(config: ConnectorConfig): Promise<void> {
    this.log('info', '🔄 Initializing connector...');
    
    try {
      // Actualizar configuración
      Object.assign(this.config, config);
      
      // Validar configuración
      if (!this.validateConfig()) {
        throw new Error('Invalid connector configuration');
      }
      
      // Reinicializar estadísticas
      this.stats = this.initializeStats();
      
      // Marcar como inicializado
      this.isInitialized = true;
      
      this.log('info', '✅ Connector initialized successfully', {
        version: this.version,
        enabled: this.config.enabled
      });
      
    } catch (error) {
      this.handleError(error, 'initialize');
      throw error;
    }
  }
  
  async shutdown(): Promise<void> {
    this.log('info', '🛑 Shutting down connector...');
    
    this.isShuttingDown = true;
    
    try {
      // Log estadísticas finales
      this.log('info', '📊 Final connector statistics', this.stats);
      
      // Limpiar recursos si es necesario (implementado en subclases)
      await this.cleanup();
      
      this.isInitialized = false;
      
      this.log('info', '✅ Connector shutdown completed');
      
    } catch (error) {
      this.handleError(error, 'shutdown');
    }
  }
  
  async updateConfig(newConfig: Partial<ConnectorConfig>): Promise<boolean> {
    this.log('info', '🔄 Updating connector configuration...');
    
    try {
      const oldConfig = { ...this.config };
      
      // Aplicar nueva configuración
      Object.assign(this.config, newConfig);
      
      // Validar nueva configuración
      if (!this.validateConfig()) {
        // Revertir si es inválida
        Object.assign(this.config, oldConfig);
        this.log('warn', '❌ Configuration update failed: invalid configuration');
        return false;
      }
      
      this.log('info', '✅ Configuration updated successfully');
      return true;
      
    } catch (error) {
      this.handleError(error, 'updateConfig');
      return false;
    }
  }
  
  async getStats(): Promise<ConnectorStats> {
    return { ...this.stats };
  }
  
  async resetStats(): Promise<void> {
    this.log('info', '🔄 Resetting connector statistics...');
    this.stats = this.initializeStats();
    this.log('info', '✅ Statistics reset completed');
  }
  
  // ========================================================================
  // MÉTODOS AUXILIARES PROTEGIDOS
  // ========================================================================
  
  /**
   * Inicializa las estadísticas del conector.
   */
  protected initializeStats(): ConnectorStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalSignalsCollected: 0,
      averageSignalsPerRequest: 0,
      averageResponseTimeMs: 0,
      statsResetDate: new Date()
    };
  }
  
  /**
   * Actualiza las estadísticas después de una operación.
   */
  protected updateStats(success: boolean, signalsCount: number, durationMs: number): void {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      this.stats.totalSignalsCollected += signalsCount;
      
      // Calcular nuevos promedios
      this.stats.averageSignalsPerRequest = 
        this.stats.totalSignalsCollected / this.stats.successfulRequests;
    } else {
      this.stats.failedRequests++;
    }
    
    // Actualizar promedio de tiempo de respuesta (moving average)
    if (this.stats.totalRequests === 1) {
      this.stats.averageResponseTimeMs = durationMs;
    } else {
      this.stats.averageResponseTimeMs = 
        (this.stats.averageResponseTimeMs * (this.stats.totalRequests - 1) + durationMs) / 
        this.stats.totalRequests;
    }
  }
  
  /**
   * Actualiza estadísticas específicas de errores.
   */
  protected updateErrorStats(error: ConnectorError): void {
    // Se puede extender para trackear tipos específicos de errores
    this.log('debug', 'Error statistics updated', {
      errorType: error.type,
      retryable: error.retryable
    });
  }
  
  /**
   * Método para cleanup de recursos específicos.
   * Puede ser sobrescrito por subclases.
   */
  protected async cleanup(): Promise<void> {
    // Implementación base vacía
    // Las subclases pueden sobrescribir para limpiar recursos específicos
  }
  
  /**
   * Método helper para validar que el conector esté listo para operar.
   */
  protected validateOperationalState(): void {
    if (!this.isInitialized) {
      throw new Error('Connector not initialized');
    }
    
    if (this.isShuttingDown) {
      throw new Error('Connector is shutting down');
    }
    
    if (!this.config.enabled) {
      throw new Error('Connector is disabled');
    }
  }
  
  /**
   * Método helper para sleep/delay.
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BaseConnector;