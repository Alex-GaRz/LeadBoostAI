/**
 * ===============================================================================
 * CONNECTOR FACTORY - JEFE DE CONECTORES
 * ===============================================================================
 * 
 * Factory centralizado para instanciar y gestionar todos los conectores del
 * sistema RADAR. Proporciona una interfaz unificada para crear conectores
 * específicos y realizar operaciones masivas en múltiples fuentes.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

import { ISourceConnector, ConnectorConfig, SearchOptions, FetchResult, ConnectorHealth } from '../interfaces/ISourceConnector';
import { SourceType, UniversalSignal } from '../../../../src/domain/models/UniversalSignal';
import TwitterConnector from './TwitterConnector';
const { NewsApiConnector } = require('./NewsApiConnector');

/**
 * Configuración para operaciones batch en múltiples conectores
 */
interface BatchSearchOptions extends SearchOptions {
  /** Fuentes específicas a usar (si no se especifica, usa todas las disponibles) */
  sources?: SourceType[];
  
  /** Si continuar con otros conectores cuando uno falla */
  continueOnError?: boolean;
  
  /** Tiempo máximo de espera por conector en milisegundos */
  timeoutPerConnector?: number;
  
  /** Si ejecutar búsquedas en paralelo (true) o secuencial (false) */
  parallel?: boolean;
}

/**
 * Resultado de operaciones batch en múltiples conectores
 */
interface BatchFetchResult {
  /** Resultados exitosos por fuente */
  results: Map<SourceType, FetchResult>;
  
  /** Errores encontrados por fuente */
  errors: Map<SourceType, Error>;
  
  /** Todos los signals combinados de todas las fuentes */
  allSignals: UniversalSignal[];
  
  /** Estadísticas agregadas */
  totalSignals: number;
  totalProcessed: number;
  totalFailed: number;
  totalDurationMs: number;
  
  /** Fuentes que completaron exitosamente */
  successfulSources: SourceType[];
  
  /** Fuentes que fallaron */
  failedSources: SourceType[];
}

/**
 * Información de registro de un conector
 */
interface ConnectorRegistration {
  sourceType: SourceType;
  connectorClass: new () => ISourceConnector;
  description: string;
  version: string;
  enabled: boolean;
  defaultConfig?: Partial<ConnectorConfig>;
}

/**
 * ===============================================================================
 * CONNECTOR FACTORY - CLASE PRINCIPAL
 * ===============================================================================
 */
export class ConnectorFactory {
  private static connectorRegistry = new Map<SourceType, ConnectorRegistration>();
  private static instances = new Map<SourceType, ISourceConnector>();
  private static initialized = false;

  // ========================================================================
  // INICIALIZACIÓN Y REGISTRO DE CONECTORES
  // ========================================================================

  /**
   * Inicializa la factory y registra todos los conectores disponibles.
   * Este método debe ser llamado una vez al iniciar la aplicación.
   */
  static initialize(): void {
    if (this.initialized) return;

    console.log('[ConnectorFactory] Initializing connector factory...');

    // Registrar conectores disponibles
    this.registerAvailableConnectors();

    this.initialized = true;
    console.log(`[ConnectorFactory] Factory initialized with ${this.connectorRegistry.size} connectors`);
  }

  /**
   * Registra todos los conectores disponibles en el sistema.
   * Aquí se agregan nuevos conectores cuando se implementan.
   */
  private static registerAvailableConnectors(): void {
    // Twitter Connector
    this.registerConnector({
      sourceType: SourceType.TWITTER,
      connectorClass: TwitterConnector,
      description: 'Twitter API v2 connector for real-time tweet monitoring',
      version: '1.0.0',
      enabled: true,
      defaultConfig: {
        enabled: true,
        timeoutMs: 30000,
        rateLimitPerMinute: 180
      }
    });

    // News API Connector
    this.registerConnector({
      sourceType: SourceType.NEWS_API,
      connectorClass: NewsApiConnector,
      description: 'NewsAPI.org connector for global news articles monitoring',
      version: '1.0.0',
      enabled: true,
      defaultConfig: {
        enabled: true,
        timeoutMs: 15000,
        rateLimitPerMinute: 42 // Conservative for free tier
      }
    });

    // TODO: Agregar más conectores aquí cuando se implementen
    /*
    this.registerConnector({
      sourceType: SourceType.TIKTOK,
      connectorClass: TikTokConnector,
      description: 'TikTok API connector for video content monitoring',
      version: '1.0.0',
      enabled: true
    });

    this.registerConnector({
      sourceType: SourceType.YOUTUBE,
      connectorClass: YouTubeConnector,
      description: 'YouTube Data API connector for video monitoring',
      version: '1.0.0',
      enabled: true
    });
    */

    console.log(`[ConnectorFactory] Registered ${this.connectorRegistry.size} connector types`);
  }

  /**
   * Registra un nuevo tipo de conector en la factory.
   */
  static registerConnector(registration: ConnectorRegistration): void {
    if (this.connectorRegistry.has(registration.sourceType)) {
      console.warn(`[ConnectorFactory] Overriding existing registration for ${registration.sourceType}`);
    }

    this.connectorRegistry.set(registration.sourceType, registration);
    console.log(`[ConnectorFactory] Registered ${registration.sourceType} connector v${registration.version}`);
  }

  // ========================================================================
  // MÉTODOS PRINCIPALES DE FACTORY
  // ========================================================================

  /**
   * MÉTODO PRINCIPAL: Obtiene una instancia de conector para la fuente especificada.
   * 
   * @param source - Tipo de fuente (TWITTER, TIKTOK, etc.)
   * @param forceNew - Si crear nueva instancia o reusar existente
   * @returns Instancia del conector solicitado
   * @throws Error si la fuente no está registrada o no está disponible
   */
  static async getConnector(source: SourceType, forceNew: boolean = false): Promise<ISourceConnector> {
    this.ensureInitialized();

    // Validar que la fuente esté registrada
    const registration = this.connectorRegistry.get(source);
    if (!registration) {
      throw new Error(`Unknown connector source: ${source}. Available sources: ${this.getAvailableSources().join(', ')}`);
    }

    // Validar que el conector esté habilitado
    if (!registration.enabled) {
      throw new Error(`Connector ${source} is disabled`);
    }

    // Reusar instancia existente si no se fuerza nueva creación
    if (!forceNew && this.instances.has(source)) {
      const existingInstance = this.instances.get(source)!;
      console.log(`[ConnectorFactory] Reusing existing ${source} connector instance`);
      return existingInstance;
    }

    try {
      // Crear nueva instancia
      const ConnectorClass = registration.connectorClass;
      const instance = new ConnectorClass();

      // Inicializar con configuración por defecto si está disponible
      if (registration.defaultConfig) {
        await instance.initialize({
          enabled: true,
          ...registration.defaultConfig
        } as ConnectorConfig);
      }

      // Cachear instancia para reutilización
      this.instances.set(source, instance);

      console.log(`[ConnectorFactory] Created new ${source} connector instance v${instance.version}`);
      return instance;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create ${source} connector: ${errorMessage}`);
    }
  }

  /**
   * Obtiene múltiples conectores de una sola vez.
   * 
   * @param sources - Array de fuentes requeridas
   * @param continueOnError - Si continuar cuando un conector falla
   * @returns Mapa de conectores exitosamente creados
   */
  static async getMultipleConnectors(
    sources: SourceType[], 
    continueOnError: boolean = true
  ): Promise<Map<SourceType, ISourceConnector>> {
    const connectors = new Map<SourceType, ISourceConnector>();
    const errors: string[] = [];

    for (const source of sources) {
      try {
        const connector = await this.getConnector(source);
        connectors.set(source, connector);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${source}: ${errorMessage}`);
        
        if (!continueOnError) {
          throw new Error(`Failed to create connectors. Errors: ${errors.join('; ')}`);
        }
      }
    }

    if (errors.length > 0 && connectors.size === 0) {
      throw new Error(`No connectors could be created. Errors: ${errors.join('; ')}`);
    }

    console.log(`[ConnectorFactory] Created ${connectors.size} connectors${errors.length > 0 ? ` (${errors.length} failed)` : ''}`);
    return connectors;
  }

  /**
   * Obtiene todos los conectores disponibles y habilitados.
   * 
   * @returns Mapa de todos los conectores disponibles
   */
  static async getAllConnectors(): Promise<Map<SourceType, ISourceConnector>> {
    const enabledSources = this.getEnabledSources();
    return this.getMultipleConnectors(enabledSources, true);
  }

  // ========================================================================
  // OPERACIONES BATCH EN MÚLTIPLES FUENTES
  // ========================================================================

  /**
   * MÉTODO ESTRELLA: Busca signals en múltiples fuentes con una sola llamada.
   * Permite ejecutar "Trae datos de TODAS las fuentes" con una línea.
   * 
   * @param options - Opciones de búsqueda batch
   * @returns Resultados combinados de todas las fuentes
   */
  static async fetchFromAllSources(options: BatchSearchOptions): Promise<BatchFetchResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    const sources = options.sources || this.getEnabledSources();
    const results = new Map<SourceType, FetchResult>();
    const errors = new Map<SourceType, Error>();
    const allSignals: UniversalSignal[] = [];

    console.log(`[ConnectorFactory] Starting batch fetch from ${sources.length} sources:`, sources);

    try {
      // Obtener conectores necesarios
      const connectors = await this.getMultipleConnectors(sources, options.continueOnError ?? true);

      if (connectors.size === 0) {
        throw new Error('No connectors available for batch operation');
      }

      // Ejecutar búsquedas
      if (options.parallel ?? true) {
        // Ejecución en paralelo (más rápido)
        await this.executeBatchParallel(connectors, options, results, errors);
      } else {
        // Ejecución secuencial (más controlado)
        await this.executeBatchSequential(connectors, options, results, errors);
      }

      // Combinar todos los signals
      for (const [source, result] of results.entries()) {
        allSignals.push(...result.signals);
        console.log(`[ConnectorFactory] ${source}: ${result.signals.length} signals collected`);
      }

      // Calcular estadísticas agregadas
      const totalSignals = allSignals.length;
      const totalProcessed = Array.from(results.values()).reduce((sum, r) => sum + r.processed, 0);
      const totalFailed = Array.from(results.values()).reduce((sum, r) => sum + r.failed, 0);
      const totalDurationMs = Date.now() - startTime;

      const batchResult: BatchFetchResult = {
        results,
        errors,
        allSignals,
        totalSignals,
        totalProcessed,
        totalFailed,
        totalDurationMs,
        successfulSources: Array.from(results.keys()),
        failedSources: Array.from(errors.keys())
      };

      console.log(`[ConnectorFactory] Batch operation completed:`, {
        totalSignals,
        successfulSources: batchResult.successfulSources.length,
        failedSources: batchResult.failedSources.length,
        durationMs: totalDurationMs
      });

      return batchResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[ConnectorFactory] Batch operation failed: ${errorMessage}`);
      throw new Error(`Batch fetch operation failed: ${errorMessage}`);
    }
  }

  /**
   * Ejecuta búsquedas en paralelo en múltiples conectores.
   */
  private static async executeBatchParallel(
    connectors: Map<SourceType, ISourceConnector>,
    options: BatchSearchOptions,
    results: Map<SourceType, FetchResult>,
    errors: Map<SourceType, Error>
  ): Promise<void> {
    const promises = Array.from(connectors.entries()).map(async ([source, connector]) => {
      try {
        const timeoutMs = options.timeoutPerConnector || 60000; // 1 minuto por defecto
        
        // Crear SearchOptions sin propiedades específicas de batch
        const searchOptions: SearchOptions = {
          query: options.query,
          maxResults: options.maxResults,
          startDate: options.startDate,
          endDate: options.endDate,
          platformFilters: options.platformFilters,
          includeShares: options.includeShares,
          includeReplies: options.includeReplies,
          language: options.language,
          geoLocation: options.geoLocation,
          pageToken: options.pageToken
        };

        const result = await this.withTimeout(
          connector.fetchSignals(searchOptions), 
          timeoutMs
        );
        
        results.set(source, result);
        
      } catch (error) {
        const connectorError = error instanceof Error ? error : new Error('Unknown error');
        errors.set(source, connectorError);
        
        if (!options.continueOnError) {
          throw connectorError;
        }
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Ejecuta búsquedas secuencialmente en múltiples conectores.
   */
  private static async executeBatchSequential(
    connectors: Map<SourceType, ISourceConnector>,
    options: BatchSearchOptions,
    results: Map<SourceType, FetchResult>,
    errors: Map<SourceType, Error>
  ): Promise<void> {
    for (const [source, connector] of connectors.entries()) {
      try {
        console.log(`[ConnectorFactory] Fetching from ${source}...`);
        
        // Crear SearchOptions sin propiedades específicas de batch
        const searchOptions: SearchOptions = {
          query: options.query,
          maxResults: options.maxResults,
          startDate: options.startDate,
          endDate: options.endDate,
          platformFilters: options.platformFilters,
          includeShares: options.includeShares,
          includeReplies: options.includeReplies,
          language: options.language,
          geoLocation: options.geoLocation,
          pageToken: options.pageToken
        };
        
        const result = await connector.fetchSignals(searchOptions);
        results.set(source, result);
        
      } catch (error) {
        const connectorError = error instanceof Error ? error : new Error('Unknown error');
        errors.set(source, connectorError);
        
        console.warn(`[ConnectorFactory] ${source} failed:`, connectorError.message);
        
        if (!options.continueOnError) {
          throw connectorError;
        }
      }
    }
  }

  // ========================================================================
  // UTILIDADES Y MÉTODOS DE INFORMACIÓN
  // ========================================================================

  /**
   * Obtiene lista de fuentes disponibles (registradas).
   */
  static getAvailableSources(): SourceType[] {
    return Array.from(this.connectorRegistry.keys());
  }

  /**
   * Obtiene lista de fuentes habilitadas.
   */
  static getEnabledSources(): SourceType[] {
    return Array.from(this.connectorRegistry.entries())
      .filter(([_, registration]) => registration.enabled)
      .map(([source, _]) => source);
  }

  /**
   * Obtiene información detallada de todos los conectores registrados.
   */
  static getConnectorInfo(): Array<{ source: SourceType; description: string; version: string; enabled: boolean }> {
    return Array.from(this.connectorRegistry.entries()).map(([source, registration]) => ({
      source,
      description: registration.description,
      version: registration.version,
      enabled: registration.enabled
    }));
  }

  /**
   * Verifica el estado de salud de todos los conectores disponibles.
   */
  static async healthCheckAll(): Promise<Map<SourceType, ConnectorHealth>> {
    const connectors = await this.getAllConnectors();
    const healthResults = new Map<SourceType, ConnectorHealth>();

    const promises = Array.from(connectors.entries()).map(async ([source, connector]) => {
      try {
        const health = await connector.healthCheck();
        healthResults.set(source, health);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        healthResults.set(source, {
          isHealthy: false,
          message: `Health check failed: ${errorMessage}`,
          statusCode: 500
        });
      }
    });

    await Promise.allSettled(promises);
    return healthResults;
  }

  // ========================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ========================================================================

  /**
   * Asegura que la factory esté inicializada.
   */
  private static ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }

  /**
   * Wrapper para agregar timeout a promesas.
   */
  private static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeout));
    });
  }

  /**
   * Limpia recursos y cierra todas las instancias de conectores.
   */
  static async shutdown(): Promise<void> {
    console.log('[ConnectorFactory] Shutting down all connector instances...');

    const shutdownPromises = Array.from(this.instances.values()).map(async (connector) => {
      try {
        await connector.shutdown();
      } catch (error) {
        console.warn(`[ConnectorFactory] Error shutting down ${connector.sourceName}:`, error);
      }
    });

    await Promise.allSettled(shutdownPromises);
    
    this.instances.clear();
    console.log('[ConnectorFactory] All connectors shut down');
  }
}

export default ConnectorFactory;