/**
 * ===============================================================================
 * ISOURCE CONNECTOR - CONTRATO ESTRICTO PARA SENSORES DE DATOS
 * ===============================================================================
 * 
 * Interfaz que define el contrato obligatorio que todos los conectores de fuentes
 * externas (Twitter, TikTok, YouTube, etc.) deben implementar para garantizar
 * consistencia, mantenibilidad y escalabilidad del sistema RADAR.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

// Importar UniversalSignal desde el frontend (tipos compartidos)
import { UniversalSignal, SourceType, UniversalSignalQuery } from '../../../../src/domain/models/UniversalSignal';

/**
 * Configuración base que todo conector debe manejar.
 * Cada conector puede extender esta interfaz con configuraciones específicas.
 */
export interface ConnectorConfig {
  /** Indica si el conector está habilitado para uso */
  enabled: boolean;
  
  /** API Key o token de autenticación para la fuente externa */
  apiKey?: string;
  
  /** Secret o token adicional si es requerido */
  apiSecret?: string;
  
  /** URL base de la API (para APIs personalizadas) */
  baseUrl?: string;
  
  /** Rate limit en requests por minuto (para gestión de cuotas) */
  rateLimitPerMinute?: number;
  
  /** Timeout en milisegundos para requests HTTP */
  timeoutMs?: number;
  
  /** Configuraciones adicionales específicas del conector */
  customConfig?: Record<string, any>;
}

/**
 * Resultado detallado de una operación de fetch.
 * Incluye metadata importante para monitoreo y debugging.
 */
export interface FetchResult {
  /** Signals obtenidos exitosamente */
  signals: UniversalSignal[];
  
  /** Número total de signals encontrados (puede ser > signals.length si hay paginación) */
  totalFound: number;
  
  /** Número de signals procesados exitosamente */
  processed: number;
  
  /** Número de signals que fallaron al procesar */
  failed: number;
  
  /** Rate limit restante después de esta operación */
  rateLimitRemaining?: number;
  
  /** Timestamp de cuando se resetea el rate limit */
  rateLimitReset?: Date;
  
  /** Duración de la operación en milisegundos */
  durationMs: number;
  
  /** Token para paginación (si la API lo soporta) */
  nextPageToken?: string;
  
  /** Errores encontrados durante el procesamiento */
  errors?: Array<{
    message: string;
    itemId?: string;
    timestamp: Date;
  }>;
}

/**
 * Opciones avanzadas para queries de búsqueda.
 * Permite configurar filtros específicos de cada plataforma.
 */
export interface SearchOptions {
  /** Query principal de búsqueda */
  query: string;
  
  /** Número máximo de resultados a obtener */
  maxResults?: number;
  
  /** Fecha de inicio para búsqueda temporal */
  startDate?: Date;
  
  /** Fecha de fin para búsqueda temporal */
  endDate?: Date;
  
  /** Filtros adicionales específicos de la plataforma */
  platformFilters?: Record<string, any>;
  
  /** Incluir retweets/shares (para plataformas que lo permitan) */
  includeShares?: boolean;
  
  /** Incluir replies/comentarios */
  includeReplies?: boolean;
  
  /** Filtro por idioma (códigos ISO) */
  language?: string;
  
  /** Filtro por geolocalización */
  geoLocation?: {
    latitude: number;
    longitude: number;
    radius: string; // "10km", "50mi", etc.
  };
  
  /** Token de paginación para continuar búsqueda anterior */
  pageToken?: string;
}

/**
 * Información del estado del conector para monitoreo.
 */
export interface ConnectorHealth {
  /** Si el conector está operativo */
  isHealthy: boolean;
  
  /** Status HTTP de la última verificación */
  statusCode?: number;
  
  /** Mensaje descriptivo del estado */
  message: string;
  
  /** Timestamp de la última verificación exitosa */
  lastSuccessfulCheck?: Date;
  
  /** Latencia promedio en milisegundos */
  averageLatencyMs?: number;
  
  /** Rate limit actual disponible */
  rateLimitStatus?: {
    remaining: number;
    total: number;
    resetTime: Date;
  };
  
  /** Errores recientes encontrados */
  recentErrors?: Array<{
    timestamp: Date;
    error: string;
    count: number;
  }>;
}

/**
 * Estadísticas de uso del conector para analytics.
 */
export interface ConnectorStats {
  /** Total de requests realizados */
  totalRequests: number;
  
  /** Requests exitosos */
  successfulRequests: number;
  
  /** Requests fallidos */
  failedRequests: number;
  
  /** Total de signals obtenidos */
  totalSignalsCollected: number;
  
  /** Promedio de signals por request */
  averageSignalsPerRequest: number;
  
  /** Tiempo promedio de respuesta */
  averageResponseTimeMs: number;
  
  /** Último reset de estadísticas */
  statsResetDate: Date;
  
  /** Uso de cuota en porcentaje */
  quotaUsagePercent?: number;
}

/**
 * ===============================================================================
 * INTERFAZ PRINCIPAL: ISourceConnector
 * ===============================================================================
 * 
 * Contrato estricto que TODOS los conectores deben implementar.
 * Esta interfaz garantiza uniformidad, testabilidad y mantenibilidad.
 */
export interface ISourceConnector {
  // ========================================================================
  // PROPIEDADES OBLIGATORIAS
  // ========================================================================
  
  /**
   * Nombre único del conector que debe coincidir con SourceType enum.
   * Ejemplos: 'TWITTER', 'TIKTOK', 'YOUTUBE', 'NEWS_API'
   * 
   * OBLIGATORIO: Debe ser único en el sistema.
   */
  readonly sourceName: SourceType;
  
  /**
   * Versión del conector para compatibilidad y debugging.
   * Formato semver recomendado: "1.0.0"
   */
  readonly version: string;
  
  /**
   * Descripción del conector para documentación automática.
   */
  readonly description: string;
  
  /**
   * Configuración actual del conector.
   * Debe ser gestionada internamente pero accesible para debugging.
   */
  readonly config: ConnectorConfig;
  
  // ========================================================================
  // MÉTODOS CORE OBLIGATORIOS
  // ========================================================================
  
  /**
   * MÉTODO PRINCIPAL: Busca y retorna signals convertidos al formato universal.
   * 
   * Este es el método más importante del conector. Debe:
   * 1. Conectarse a la API externa
   * 2. Realizar la búsqueda con los parámetros dados
   * 3. Convertir TODOS los resultados a UniversalSignal
   * 4. Manejar errores y rate limiting apropiadamente
   * 
   * @param options - Opciones de búsqueda con query y filtros
   * @returns Resultado detallado con signals y metadata
   * 
   * @throws {Error} Si la configuración es inválida
   * @throws {Error} Si la API externa está no disponible
   * @throws {Error} Si se excede el rate limit
   */
  fetchSignals(options: SearchOptions): Promise<FetchResult>;
  
  // ========================================================================
  // MÉTODOS DE VALIDACIÓN Y SALUD
  // ========================================================================
  
  /**
   * Valida que la configuración del conector sea correcta.
   * 
   * Debe verificar:
   * - API keys están presentes y no están vacías
   * - URLs base son válidas (si aplica)
   * - Configuraciones requeridas están establecidas
   * 
   * @returns true si la configuración es válida, false en caso contrario
   */
  validateConfig(): boolean;
  
  /**
   * Verifica el estado de salud de la conexión con la API externa.
   * 
   * Debe realizar:
   * - Ping o request mínimo a la API
   * - Verificar autenticación
   * - Comprobar rate limits disponibles
   * - Medir latencia
   * 
   * @returns Información detallada del estado del conector
   */
  healthCheck(): Promise<ConnectorHealth>;
  
  // ========================================================================
  // MÉTODOS DE GESTIÓN Y MONITOREO
  // ========================================================================
  
  /**
   * Actualiza la configuración del conector en tiempo de ejecución.
   * 
   * Permite cambiar API keys, rate limits, etc. sin reiniciar el sistema.
   * Debe validar la nueva configuración antes de aplicarla.
   * 
   * @param newConfig - Nueva configuración a aplicar
   * @returns true si la actualización fue exitosa
   */
  updateConfig(newConfig: Partial<ConnectorConfig>): Promise<boolean>;
  
  /**
   * Obtiene estadísticas de uso del conector.
   * 
   * Esencial para:
   * - Monitoreo de performance
   * - Gestión de cuotas
   * - Optimización de parámetros
   * - Troubleshooting
   * 
   * @returns Estadísticas detalladas de uso
   */
  getStats(): Promise<ConnectorStats>;
  
  /**
   * Reinicia las estadísticas del conector.
   * Útil para limpiar métricas después de cambios importantes.
   */
  resetStats(): Promise<void>;
  
  // ========================================================================
  // MÉTODOS DE LIFECYCLE
  // ========================================================================
  
  /**
   * Inicializa el conector con configuración específica.
   * 
   * Debe:
   * - Validar configuración inicial
   * - Establecer conexiones necesarias
   * - Preparar rate limiting
   * - Inicializar métricas
   * 
   * @param config - Configuración inicial del conector
   */
  initialize(config: ConnectorConfig): Promise<void>;
  
  /**
   * Cierra conexiones y limpia recursos del conector.
   * 
   * Debe:
   * - Cerrar conexiones HTTP
   * - Limpiar timers/intervals
   * - Guardar estadísticas finales
   * - Liberar memoria
   */
  shutdown(): Promise<void>;
  
  // ========================================================================
  // MÉTODOS OPCIONALES PERO RECOMENDADOS
  // ========================================================================
  
  /**
   * Testa la conectividad con una query mínima.
   * 
   * Útil para:
   * - Verificar que las credenciales funcionan
   * - Probar rate limits
   * - Validar formato de respuesta
   * 
   * @param testQuery - Query simple para testing
   * @returns true si la conexión y query funcionan correctamente
   */
  testConnection?(testQuery?: string): Promise<boolean>;
  
  /**
   * Obtiene información sobre los límites de la API externa.
   * 
   * Información como:
   * - Rate limits por hora/día
   * - Máximo de resultados por query
   * - Ventanas de tiempo disponibles
   * 
   * @returns Información detallada de límites y capacidades
   */
  getApiLimits?(): Promise<{
    rateLimitPerHour?: number;
    rateLimitPerDay?: number;
    maxResultsPerQuery?: number;
    maxQueryLength?: number;
    supportedTimeRanges?: string[];
  }>;
  
  /**
   * Convierte query universal a formato específico de la plataforma.
   * 
   * Permite usar un formato de query estándar que cada conector
   * puede traducir a su sintaxis específica.
   * 
   * @param universalQuery - Query en formato universal
   * @returns Query en formato específico de la plataforma
   */
  translateQuery?(universalQuery: UniversalSignalQuery): SearchOptions;
}

/**
 * ===============================================================================
 * CLASE BASE ABSTRACTA (OPCIONAL)
 * ===============================================================================
 * 
 * Implementación base que los conectores pueden extender para reducir código duplicado.
 * Proporciona funcionalidad común como rate limiting, métricas, y logging.
 */
export abstract class BaseSourceConnector implements ISourceConnector {
  public readonly sourceName: SourceType;
  public readonly version: string;
  public readonly description: string;
  public readonly config: ConnectorConfig;
  
  protected stats: ConnectorStats;
  protected lastHealthCheck?: ConnectorHealth;
  
  constructor(sourceName: SourceType, version: string, description: string) {
    this.sourceName = sourceName;
    this.version = version;
    this.description = description;
    this.config = { enabled: false };
    this.stats = this.initializeStats();
  }
  
  // Métodos abstractos que cada conector debe implementar
  abstract fetchSignals(options: SearchOptions): Promise<FetchResult>;
  abstract validateConfig(): boolean;
  abstract healthCheck(): Promise<ConnectorHealth>;
  
  // Implementaciones base que pueden ser sobrescritas
  async initialize(config: ConnectorConfig): Promise<void> {
    Object.assign(this.config, config);
    this.stats = this.initializeStats();
    
    if (!this.validateConfig()) {
      throw new Error(`Invalid configuration for ${this.sourceName} connector`);
    }
  }
  
  async shutdown(): Promise<void> {
    // Implementación base - puede ser sobrescrita
    console.log(`[${this.sourceName}] Connector shutting down...`);
  }
  
  async updateConfig(newConfig: Partial<ConnectorConfig>): Promise<boolean> {
    const oldConfig = { ...this.config };
    Object.assign(this.config, newConfig);
    
    if (!this.validateConfig()) {
      // Revertir si la nueva configuración es inválida
      Object.assign(this.config, oldConfig);
      return false;
    }
    
    return true;
  }
  
  async getStats(): Promise<ConnectorStats> {
    return { ...this.stats };
  }
  
  async resetStats(): Promise<void> {
    this.stats = this.initializeStats();
  }
  
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
  
  protected updateStats(success: boolean, signalsCount: number, durationMs: number): void {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      this.stats.totalSignalsCollected += signalsCount;
    } else {
      this.stats.failedRequests++;
    }
    
    // Actualizar promedios
    this.stats.averageSignalsPerRequest = 
      this.stats.totalSignalsCollected / this.stats.successfulRequests || 0;
    
    this.stats.averageResponseTimeMs = 
      (this.stats.averageResponseTimeMs + durationMs) / 2;
  }
}

/**
 * ===============================================================================
 * UTILIDADES Y HELPERS
 * ===============================================================================
 */

/**
 * Factory para registrar y obtener conectores.
 * Implementa patrón registry para gestión centralizada.
 */
export class ConnectorRegistry {
  private static connectors = new Map<SourceType, ISourceConnector>();
  
  /**
   * Registra un conector en el sistema.
   */
  static register(connector: ISourceConnector): void {
    if (this.connectors.has(connector.sourceName)) {
      throw new Error(`Connector ${connector.sourceName} already registered`);
    }
    
    this.connectors.set(connector.sourceName, connector);
    console.log(`[ConnectorRegistry] Registered ${connector.sourceName} v${connector.version}`);
  }
  
  /**
   * Obtiene un conector por su nombre.
   */
  static get(sourceName: SourceType): ISourceConnector | undefined {
    return this.connectors.get(sourceName);
  }
  
  /**
   * Lista todos los conectores registrados.
   */
  static listAll(): ISourceConnector[] {
    return Array.from(this.connectors.values());
  }
  
  /**
   * Lista solo los conectores habilitados.
   */
  static listEnabled(): ISourceConnector[] {
    return Array.from(this.connectors.values()).filter(c => c.config.enabled);
  }
  
  /**
   * Verifica el estado de salud de todos los conectores.
   */
  static async healthCheckAll(): Promise<Record<SourceType, ConnectorHealth>> {
    const results: Record<string, ConnectorHealth> = {};
    
    for (const connector of this.connectors.values()) {
      if (connector.config.enabled) {
        try {
          results[connector.sourceName] = await connector.healthCheck();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results[connector.sourceName] = {
            isHealthy: false,
            message: `Health check failed: ${errorMessage}`,
            statusCode: 500
          };
        }
      }
    }
    
    return results as Record<SourceType, ConnectorHealth>;
  }
}

export default ISourceConnector;