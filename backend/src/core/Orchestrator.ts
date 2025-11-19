/**
 * ===============================================================================
 * ORCHESTRATOR - COORDINADOR CENTRAL CON MONITOREO SRE INTEGRADO
 * ===============================================================================
 * 
 * Clase central que coordina todos los procesos de ingesta de datos del Sistema RADAR
 * con monitoreo SRE (Site Reliability Engineering) completamente integrado.
 * 
 * Maneja la orquestación entre ConnectorFactory y SignalRepository para automatizar
 * los ciclos de búsqueda, procesamiento y guardado de señales, mientras reporta
 * automáticamente todas las operaciones al RadarHealthMonitor.
 * 
 * Responsabilidades:
 * - Coordinar búsqueda de señales desde múltiples fuentes
 * - Gestionar persistencia automática en Firebase
 * - Reportar automáticamente al sistema de monitoreo SRE
 * - Manejar errores sin interrumpir operaciones
 * - Proporcionar observabilidad completa del sistema
 * - Ejecutar ciclos de ingesta programados
 * 
 * @author LeadBoostAI - Radar System
 * @version 2.0.0 - Con monitoreo SRE integrado
 */

import ConnectorFactory from './connectors/ConnectorFactory';
import { SignalRepository } from '../repositories/SignalRepository';
import { SourceType, UniversalSignal } from '../../../src/domain/models/UniversalSignal';
import { SearchOptions, FetchResult } from './interfaces/ISourceConnector';
import RadarHealthMonitor from './monitoring/RadarHealthMonitor';

/**
 * Configuración para ciclos de ingesta
 */
interface IngestionConfig {
  /** Fuente de datos a procesar */
  source: SourceType;
  
  /** Query de búsqueda */
  query: string;
  
  /** Máximo número de resultados por ciclo */
  maxResults?: number;
  
  /** Configuraciones adicionales de búsqueda */
  searchOptions?: Partial<SearchOptions>;
  
  /** Continuar aunque fallen algunas señales */
  continueOnError?: boolean;
}

/**
 * Resultado de un ciclo de ingesta
 */
interface IngestionResult {
  /** Fuente procesada */
  source: SourceType;
  
  /** Query utilizada */
  query: string;
  
  /** Número de señales encontradas */
  signalsFound: number;
  
  /** Número de señales guardadas exitosamente */
  signalsSaved: number;
  
  /** Número de señales que fallaron al guardar */
  signalsFailed: number;
  
  /** Duración total del ciclo en milisegundos */
  durationMs: number;
  
  /** Errores encontrados durante el proceso */
  errors: Array<{
    step: 'fetch' | 'save';
    message: string;
    timestamp: Date;
  }>;
  
  /** Si el ciclo se completó exitosamente */
  success: boolean;
}

/**
 * Resultado de ingesta masiva multi-fuente
 */
interface BatchIngestionResult {
  /** Resultados individuales por fuente */
  results: Map<SourceType, IngestionResult>;
  
  /** Estadísticas agregadas */
  totalSignalsFound: number;
  totalSignalsSaved: number;
  totalSignalsFailed: number;
  totalDurationMs: number;
  
  /** Fuentes que completaron exitosamente */
  successfulSources: SourceType[];
  
  /** Fuentes que fallaron */
  failedSources: SourceType[];
}

/**
 * ORCHESTRATOR - Coordinador Central del Sistema RADAR con Monitoreo SRE
 * 
 * Singleton que maneja todos los procesos de ingesta de datos con observabilidad completa.
 * Coordina ConnectorFactory y SignalRepository mientras reporta automáticamente
 * todas las operaciones al RadarHealthMonitor para análisis SRE.
 */
export class Orchestrator {
  private static instance: Orchestrator | null = null;
  private signalRepository: SignalRepository;
  private healthMonitor: RadarHealthMonitor;
  private isInitialized: boolean = false;

  /**
   * Constructor privado para patrón Singleton
   */
  private constructor() {
    this.signalRepository = new SignalRepository();
    this.healthMonitor = RadarHealthMonitor.getInstance();
    
    console.log('[Orchestrator] 🧠 Orchestrator initialized with SRE monitoring');
  }

  /**
   * Obtiene la instancia única del Orchestrator
   */
  public static getInstance(): Orchestrator {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  /**
   * Inicializa el Orchestrator y sus dependencias
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Orchestrator] Already initialized');
      return;
    }

    try {
      console.log('[Orchestrator] Initializing Radar Orchestrator with SRE monitoring...');
      
      // Inicializar ConnectorFactory
      ConnectorFactory.initialize();
      
      // Verificar conectividad de Firebase
      await this.signalRepository.healthCheck();
      
      this.isInitialized = true;
      console.log('[Orchestrator] ✅ Successfully initialized with health monitoring');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('[Orchestrator] ❌ Initialization failed:', errorMessage);
      
      // Reportar error de inicialización al monitor
      this.healthMonitor.recordError(error instanceof Error ? error : new Error(errorMessage));
      
      throw new Error(`Orchestrator initialization failed: ${errorMessage}`);
    }
  }

  /**
   * MÉTODO PRINCIPAL: Ejecuta un ciclo completo de ingesta con monitoreo SRE automático
   * 
   * @param source - Fuente de datos (ej: SourceType.TWITTER, SourceType.TIKTOK)
   * @param query - Query de búsqueda
   * @param options - Opciones adicionales de configuración
   * @returns Resultado detallado del ciclo de ingesta
   */
  public async runIngestionCycle(
    source: SourceType, 
    query: string, 
    options?: Partial<IngestionConfig>
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const errors: IngestionResult['errors'] = [];
    let signalsFound = 0;
    let signalsSaved = 0;
    let signalsFailed = 0;

    console.log(`[Orchestrator] 🚀 Iniciando ciclo de ingesta monitoreado para ${source}...`);
    console.log(`[Orchestrator] Query: "${query}"`);

    // ===============================================================
    // 🏥 INICIO AUTOMÁTICO DE MONITOREO SRE 
    // ===============================================================
    console.log(`[Orchestrator] 📊 Reportando inicio al Health Monitor...`);
    this.healthMonitor.startRun(source);

    try {
      this.ensureInitialized();

      // ===========================================
      // PASO 1: Obtener conector usando la Factory
      // ===========================================
      console.log(`[Orchestrator] 🔌 Obteniendo conector para ${source}...`);
      
      let connector;
      try {
        connector = await ConnectorFactory.getConnector(source);
        console.log(`[Orchestrator] ✅ Conector ${source} obtenido exitosamente`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown connector error';
        console.error(`[Orchestrator] ❌ Error obteniendo conector ${source}:`, errorMessage);
        
        // Reportar error específico al monitor
        this.healthMonitor.recordError(error instanceof Error ? error : new Error(errorMessage));
        
        errors.push({
          step: 'fetch',
          message: `Failed to get connector: ${errorMessage}`,
          timestamp: new Date()
        });

        return this.createFailedResult(source, query, errors, Date.now() - startTime);
      }

      // ===========================================
      // PASO 2: Ejecutar fetchSignals con monitoreo
      // ===========================================
      console.log(`[Orchestrator] 🔍 Ejecutando búsqueda monitoreada en ${source}...`);
      
      const searchOptions: SearchOptions = {
        query,
        maxResults: options?.maxResults || 50,
        ...options?.searchOptions
      };

      let fetchResult: FetchResult;
      try {
        fetchResult = await connector.fetchSignals(searchOptions);
        signalsFound = fetchResult.signals.length;
        
        console.log(`[Orchestrator] ✅ Búsqueda completada: ${signalsFound} señales encontradas`);
        console.log(`[Orchestrator] 📊 Procesadas: ${fetchResult.processed}, Fallidas: ${fetchResult.failed}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown fetch error';
        console.error(`[Orchestrator] ❌ Error en fetchSignals para ${source}:`, errorMessage);
        
        // Reportar error de fetch al monitor
        this.healthMonitor.recordError(error instanceof Error ? error : new Error(errorMessage));
        
        errors.push({
          step: 'fetch',
          message: `Fetch failed: ${errorMessage}`,
          timestamp: new Date()
        });

        return this.createFailedResult(source, query, errors, Date.now() - startTime);
      }

      // ===========================================
      // PASO 3: Guardar señales con monitoreo granular
      // ===========================================
      if (fetchResult.signals.length === 0) {
        console.log(`[Orchestrator] ℹ️ No se encontraron señales para guardar`);
      } else {
        console.log(`[Orchestrator] 💾 Guardando ${fetchResult.signals.length} señales con monitoreo...`);
        
        for (let i = 0; i < fetchResult.signals.length; i++) {
          const signal = fetchResult.signals[i];
          
          try {
            const savedId = await this.signalRepository.saveSignal(signal);
            signalsSaved++;
            
            // Log progreso cada 10 señales
            if ((i + 1) % 10 === 0 || (i + 1) === fetchResult.signals.length) {
              console.log(`[Orchestrator] 📝 Progreso monitoreado: ${i + 1}/${fetchResult.signals.length} señales procesadas`);
            }
            
          } catch (error) {
            signalsFailed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown save error';
            
            errors.push({
              step: 'save',
              message: `Failed to save signal ${signal.id}: ${errorMessage}`,
              timestamp: new Date()
            });

            console.warn(`[Orchestrator] ⚠️ Error guardando señal ${signal.id}:`, errorMessage);

            // Reportar error de guardado (pero no detener el ciclo completo)
            if (signalsFailed === 1) { // Solo reportar el primer error de save para no saturar
              console.warn(`[Orchestrator] 📊 Reportando error de guardado al Health Monitor...`);
            }

            // Si no continuar en errores, lanzar excepción
            if (!options?.continueOnError) {
              // Reportar error crítico al monitor
              this.healthMonitor.recordError(error instanceof Error ? error : new Error(errorMessage));
              throw new Error(`Save operation failed: ${errorMessage}`);
            }
          }
        }
      }

      // ===============================================================
      // 🎉 FINALIZACIÓN EXITOSA CON REPORTE AL MONITOR
      // ===============================================================
      const durationMs = Date.now() - startTime;
      
      console.log(`[Orchestrator] 🎉 Ciclo finalizado exitosamente para ${source}`);
      console.log(`[Orchestrator] 📊 Resumen: ${signalsSaved}/${signalsFound} señales guardadas`);
      console.log(`[Orchestrator] ⏱️ Duración: ${durationMs}ms`);

      // ===============================================================
      // 🏥 REPORTE EXITOSO AL HEALTH MONITOR
      // ===============================================================
      console.log(`[Orchestrator] 📈 Reportando éxito al Health Monitor: ${signalsSaved} señales`);
      this.healthMonitor.endRun(signalsSaved);

      return {
        source,
        query,
        signalsFound,
        signalsSaved,
        signalsFailed,
        durationMs,
        errors,
        success: true
      };

    } catch (error) {
      // ===============================================================
      // 💥 MANEJO DE ERRORES CON REPORTE AUTOMÁTICO AL MONITOR
      // ===============================================================
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown orchestrator error';
      
      console.error(`[Orchestrator] 💥 Error crítico en ciclo de ingesta para ${source}:`, errorMessage);
      
      // ===============================================================
      // 🚨 REPORTE CRÍTICO AL HEALTH MONITOR (PRIORITARIO)
      // ===============================================================
      console.error(`[Orchestrator] 🚨 Reportando error crítico al Health Monitor...`);
      this.healthMonitor.recordError(error instanceof Error ? error : new Error(errorMessage));
      
      errors.push({
        step: 'fetch',
        message: `Critical error: ${errorMessage}`,
        timestamp: new Date()
      });

      return this.createFailedResult(source, query, errors, durationMs, signalsFound, signalsSaved, signalsFailed);
    }
  }

  /**
   * Ejecuta ciclos de ingesta en múltiples fuentes con monitoreo agregado
   * 
   * @param configs - Configuraciones de ingesta para múltiples fuentes
   * @returns Resultado agregado de todas las operaciones
   */
  public async runBatchIngestion(configs: IngestionConfig[]): Promise<BatchIngestionResult> {
    const startTime = Date.now();
    const results = new Map<SourceType, IngestionResult>();

    console.log(`[Orchestrator] 🚀 Iniciando ingesta masiva monitoreada para ${configs.length} fuentes...`);

    try {
      this.ensureInitialized();

      // Ejecutar todos los ciclos en paralelo (cada uno se monitoreará individualmente)
      const promises = configs.map(async (config) => {
        try {
          // Cada runIngestionCycle ya maneja su propio monitoreo
          const result = await this.runIngestionCycle(
            config.source, 
            config.query, 
            config
          );
          results.set(config.source, result);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Orchestrator] Error en ingesta masiva ${config.source}:`, errorMessage);
          
          // El error ya fue reportado por runIngestionCycle individual
          // Crear resultado fallido
          results.set(config.source, this.createFailedResult(
            config.source, 
            config.query, 
            [{
              step: 'fetch',
              message: errorMessage,
              timestamp: new Date()
            }],
            0
          ));
        }
      });

      await Promise.allSettled(promises);

      // Calcular estadísticas agregadas
      const aggregatedStats = this.calculateAggregatedStats(results);
      const totalDurationMs = Date.now() - startTime;

      console.log(`[Orchestrator] 🎯 Ingesta masiva monitoreada completada:`);
      console.log(`[Orchestrator] 📊 Total señales guardadas: ${aggregatedStats.totalSignalsSaved}`);
      console.log(`[Orchestrator] ✅ Fuentes exitosas: ${aggregatedStats.successfulSources.length}`);
      console.log(`[Orchestrator] ❌ Fuentes fallidas: ${aggregatedStats.failedSources.length}`);
      console.log(`[Orchestrator] ⏱️ Duración total: ${totalDurationMs}ms`);

      return {
        results,
        totalSignalsFound: aggregatedStats.totalSignalsFound,
        totalSignalsSaved: aggregatedStats.totalSignalsSaved,
        totalSignalsFailed: aggregatedStats.totalSignalsFailed,
        totalDurationMs,
        successfulSources: aggregatedStats.successfulSources,
        failedSources: aggregatedStats.failedSources
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown batch error';
      console.error(`[Orchestrator] 💥 Error crítico en ingesta masiva:`, errorMessage);
      
      // Reportar error de batch al monitor
      this.healthMonitor.recordError(error instanceof Error ? error : new Error(errorMessage));
      
      throw new Error(`Batch ingestion failed: ${errorMessage}`);
    }
  }

  /**
   * Verifica el estado de salud del Orchestrator incluyendo métricas del Health Monitor
   */
  public async healthCheck(): Promise<{
    orchestrator: boolean;
    connectorFactory: boolean;
    signalRepository: boolean;
    healthMonitor: any;
    details: Record<string, any>;
  }> {
    const health = {
      orchestrator: this.isInitialized,
      connectorFactory: false,
      signalRepository: false,
      healthMonitor: {},
      details: {} as Record<string, any>
    };

    try {
      // Check ConnectorFactory
      const connectorHealth = await ConnectorFactory.healthCheckAll();
      health.connectorFactory = connectorHealth.size > 0;
      health.details.connectors = Object.fromEntries(connectorHealth);

      // Check SignalRepository
      await this.signalRepository.healthCheck();
      health.signalRepository = true;
      health.details.repository = 'Connected';

      // Check Health Monitor (siempre disponible ya que es singleton en memoria)
      const healthStats = this.healthMonitor.getStats();
      const healthMetrics = this.healthMonitor.getMetrics();
      health.healthMonitor = {
        stats: healthStats,
        metrics: healthMetrics
      };
      health.details.healthMonitor = {
        status: healthStats.status,
        totalSignalsCollected: healthStats.totalSignalsCollected,
        successRate: healthMetrics.successRate,
        healthStatus: healthMetrics.healthStatus,
        uptime: healthMetrics.uptime
      };

      console.log('[Orchestrator] 🏥 Health check completado con métricas SRE');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      health.details.error = errorMessage;
      
      // Reportar error de health check
      this.healthMonitor.recordError(error instanceof Error ? error : new Error(errorMessage));
    }

    return health;
  }

  /**
   * Obtiene las estadísticas del Health Monitor
   */
  public getHealthStats() {
    return this.healthMonitor.getStats();
  }

  /**
   * Obtiene las métricas del Health Monitor  
   */
  public getHealthMetrics() {
    return this.healthMonitor.getMetrics();
  }

  /**
   * Genera reporte completo del sistema incluyendo Health Monitor
   */
  public generateSystemReport(): string {
    return this.healthMonitor.generateReport();
  }

  /**
   * Obtiene historial de ejecuciones del Health Monitor
   */
  public getExecutionHistory(limit: number = 20) {
    return this.healthMonitor.getExecutionHistory(limit);
  }

  /**
   * Limpia recursos y cierra conexiones
   */
  public async shutdown(): Promise<void> {
    console.log('[Orchestrator] 🛑 Shutting down with final health report...');
    
    try {
      // Mostrar reporte final antes del cierre
      console.log('[Orchestrator] 📊 Final system report:');
      console.log(this.generateSystemReport());
      
      await ConnectorFactory.shutdown();
      this.isInitialized = false;
      
      console.log('[Orchestrator] ✅ Shutdown completed');
    } catch (error) {
      console.error('[Orchestrator] Error during shutdown:', error);
      
      // Reportar error de shutdown
      this.healthMonitor.recordError(error instanceof Error ? error : new Error('Shutdown error'));
    }
  }

  // ========================================================================
  // MÉTODOS PRIVADOS AUXILIARES
  // ========================================================================

  /**
   * Verifica que el Orchestrator esté inicializado
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      const error = new Error('Orchestrator not initialized. Call initialize() first.');
      
      // Reportar error de estado al monitor
      this.healthMonitor.recordError(error);
      
      throw error;
    }
  }

  /**
   * Crea un resultado fallido estándar
   */
  private createFailedResult(
    source: SourceType,
    query: string,
    errors: IngestionResult['errors'],
    durationMs: number,
    signalsFound: number = 0,
    signalsSaved: number = 0,
    signalsFailed: number = 0
  ): IngestionResult {
    return {
      source,
      query,
      signalsFound,
      signalsSaved,
      signalsFailed,
      durationMs,
      errors,
      success: false
    };
  }

  /**
   * Calcula estadísticas agregadas de múltiples resultados
   */
  private calculateAggregatedStats(results: Map<SourceType, IngestionResult>) {
    let totalSignalsFound = 0;
    let totalSignalsSaved = 0;
    let totalSignalsFailed = 0;
    const successfulSources: SourceType[] = [];
    const failedSources: SourceType[] = [];

    results.forEach((result, source) => {
      totalSignalsFound += result.signalsFound;
      totalSignalsSaved += result.signalsSaved;
      totalSignalsFailed += result.signalsFailed;

      if (result.success) {
        successfulSources.push(source);
      } else {
        failedSources.push(source);
      }
    });

    return {
      totalSignalsFound,
      totalSignalsSaved,
      totalSignalsFailed,
      successfulSources,
      failedSources
    };
  }
}

export default Orchestrator;