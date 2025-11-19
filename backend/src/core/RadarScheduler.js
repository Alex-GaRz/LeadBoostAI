/**
 * ===============================================================================
 * RADAR SCHEDULER - SISTEMA DE TAREAS PROGRAMADAS
 * ===============================================================================
 * 
 * Sistema de scheduling que usa node-cron para ejecutar ciclos de ingesta
 * automáticamente. Permite monitoreo continuo de múltiples fuentes.
 * 
 * @author LeadBoostAI - Radar System
 */

const cron = require('node-cron');
const { Orchestrator } = require('../src/core/Orchestrator');

/**
 * Configuración de tareas programadas
 */
const SCHEDULED_TASKS = {
  // Monitoreo de marca cada hora
  brandMonitoring: {
    schedule: '0 * * * *', // Cada hora en minuto 0
    enabled: true,
    config: {
      source: 'TWITTER',
      query: '"OpenAI" OR "ChatGPT" OR @openai',
      maxResults: 100,
      continueOnError: true
    }
  },
  
  // Análisis de tendencias cada 6 horas
  trendAnalysis: {
    schedule: '0 */6 * * *', // Cada 6 horas
    enabled: true,
    config: {
      source: 'TWITTER',
      query: 'artificial intelligence AND (trending OR viral)',
      maxResults: 200,
      continueOnError: true,
      searchOptions: {
        language: 'en'
      }
    }
  },
  
  // Monitoreo de competencia diario
  competitorAnalysis: {
    schedule: '0 9 * * *', // Todos los días a las 9:00 AM
    enabled: true,
    configs: [
      {
        source: 'TWITTER',
        query: '"Google AI" OR "Bard"',
        maxResults: 50
      },
      {
        source: 'TWITTER', 
        query: '"Microsoft AI" OR "Copilot"',
        maxResults: 50
      }
    ]
  },
  
  // Health check del sistema cada 30 minutos
  systemHealth: {
    schedule: '*/30 * * * *', // Cada 30 minutos
    enabled: true,
    type: 'healthCheck'
  }
};

/**
 * RADAR SCHEDULER - Gestiona tareas programadas del sistema
 */
class RadarScheduler {
  constructor() {
    this.orchestrator = Orchestrator.getInstance();
    this.activeTasks = new Map();
    this.taskStats = new Map();
    this.isInitialized = false;
  }

  /**
   * Inicializa el scheduler y todas las tareas configuradas
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[RadarScheduler] Already initialized');
      return;
    }

    try {
      console.log('[RadarScheduler] 🚀 Initializing Radar Scheduler...');
      
      // Inicializar el Orchestrator
      await this.orchestrator.initialize();
      
      // Configurar todas las tareas habilitadas
      for (const [taskName, taskConfig] of Object.entries(SCHEDULED_TASKS)) {
        if (taskConfig.enabled) {
          await this.scheduleTask(taskName, taskConfig);
        }
      }
      
      this.isInitialized = true;
      console.log('[RadarScheduler] ✅ Successfully initialized');
      console.log(`[RadarScheduler] 📅 ${this.activeTasks.size} tasks scheduled`);
      
    } catch (error) {
      console.error('[RadarScheduler] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Programa una tarea específica
   */
  async scheduleTask(taskName, taskConfig) {
    try {
      console.log(`[RadarScheduler] 📅 Scheduling task: ${taskName}`);
      console.log(`[RadarScheduler] Schedule: ${taskConfig.schedule}`);
      
      // Inicializar estadísticas
      this.taskStats.set(taskName, {
        executions: 0,
        lastExecution: null,
        lastSuccess: null,
        totalSignalsCollected: 0,
        errors: []
      });

      const task = cron.schedule(taskConfig.schedule, async () => {
        await this.executeTask(taskName, taskConfig);
      }, {
        scheduled: false,
        timezone: 'America/Mexico_City' // Configurable
      });

      // Guardar referencia de la tarea
      this.activeTasks.set(taskName, task);
      
      // Iniciar la tarea
      task.start();
      
      console.log(`[RadarScheduler] ✅ Task '${taskName}' scheduled successfully`);
      
    } catch (error) {
      console.error(`[RadarScheduler] ❌ Error scheduling task '${taskName}':`, error);
      throw error;
    }
  }

  /**
   * Ejecuta una tarea programada
   */
  async executeTask(taskName, taskConfig) {
    const startTime = Date.now();
    const stats = this.taskStats.get(taskName);
    
    console.log(`\n🔄 [RadarScheduler] Executing scheduled task: ${taskName}`);
    console.log(`⏰ [RadarScheduler] Time: ${new Date().toISOString()}`);
    
    try {
      stats.executions++;
      stats.lastExecution = new Date();
      
      let result;
      
      // Ejecutar según el tipo de tarea
      if (taskConfig.type === 'healthCheck') {
        result = await this.executeHealthCheck();
      } else if (taskConfig.configs) {
        // Tarea batch con múltiples configuraciones
        result = await this.orchestrator.runBatchIngestion(taskConfig.configs);
      } else {
        // Tarea simple con una configuración
        result = await this.orchestrator.runIngestionCycle(
          taskConfig.config.source,
          taskConfig.config.query,
          taskConfig.config
        );
      }
      
      // Actualizar estadísticas
      if (result.success !== false) {
        stats.lastSuccess = new Date();
        
        if (result.signalsSaved !== undefined) {
          stats.totalSignalsCollected += result.signalsSaved;
        } else if (result.totalSignalsSaved !== undefined) {
          stats.totalSignalsCollected += result.totalSignalsSaved;
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ [RadarScheduler] Task '${taskName}' completed successfully`);
      console.log(`📊 [RadarScheduler] Duration: ${duration}ms`);
      
      if (result.signalsSaved !== undefined) {
        console.log(`💾 [RadarScheduler] Signals saved: ${result.signalsSaved}`);
      } else if (result.totalSignalsSaved !== undefined) {
        console.log(`💾 [RadarScheduler] Total signals saved: ${result.totalSignalsSaved}`);
      }
      
    } catch (error) {
      console.error(`❌ [RadarScheduler] Task '${taskName}' failed:`, error.message);
      
      // Registrar error
      stats.errors.push({
        timestamp: new Date(),
        error: error.message
      });
      
      // Mantener solo últimos 10 errores
      if (stats.errors.length > 10) {
        stats.errors.shift();
      }
    }
  }

  /**
   * Ejecuta health check del sistema
   */
  async executeHealthCheck() {
    const health = await this.orchestrator.healthCheck();
    
    console.log(`🏥 [RadarScheduler] System Health Check:`);
    console.log(`   Orchestrator: ${health.orchestrator ? '✅' : '❌'}`);
    console.log(`   ConnectorFactory: ${health.connectorFactory ? '✅' : '❌'}`);
    console.log(`   SignalRepository: ${health.signalRepository ? '✅' : '❌'}`);
    
    return { success: true, type: 'healthCheck' };
  }

  /**
   * Obtiene estadísticas de todas las tareas
   */
  getTaskStats() {
    const stats = {};
    
    this.taskStats.forEach((taskStat, taskName) => {
      stats[taskName] = {
        ...taskStat,
        isActive: this.activeTasks.has(taskName),
        nextExecution: this.getNextExecution(taskName)
      };
    });
    
    return stats;
  }

  /**
   * Obtiene la próxima ejecución de una tarea
   */
  getNextExecution(taskName) {
    const task = this.activeTasks.get(taskName);
    if (!task) return null;
    
    // node-cron no proporciona método directo para esto
    // Se podría implementar lógica personalizada aquí
    return 'Not available'; // Placeholder
  }

  /**
   * Pausa una tarea específica
   */
  pauseTask(taskName) {
    const task = this.activeTasks.get(taskName);
    if (task) {
      task.stop();
      console.log(`⏸️ [RadarScheduler] Task '${taskName}' paused`);
      return true;
    }
    return false;
  }

  /**
   * Reanuda una tarea específica
   */
  resumeTask(taskName) {
    const task = this.activeTasks.get(taskName);
    if (task) {
      task.start();
      console.log(`▶️ [RadarScheduler] Task '${taskName}' resumed`);
      return true;
    }
    return false;
  }

  /**
   * Muestra estado de todas las tareas
   */
  showStatus() {
    console.log('\n📊 === RADAR SCHEDULER STATUS ===');
    console.log(`🔧 Initialized: ${this.isInitialized}`);
    console.log(`📅 Active tasks: ${this.activeTasks.size}`);
    
    const stats = this.getTaskStats();
    
    console.log('\n📋 === TASK DETAILS ===');
    Object.entries(stats).forEach(([taskName, taskStat]) => {
      const status = taskStat.isActive ? '🟢 Active' : '🔴 Inactive';
      console.log(`\n${taskName}:`);
      console.log(`  Status: ${status}`);
      console.log(`  Executions: ${taskStat.executions}`);
      console.log(`  Last execution: ${taskStat.lastExecution || 'Never'}`);
      console.log(`  Last success: ${taskStat.lastSuccess || 'Never'}`);
      console.log(`  Signals collected: ${taskStat.totalSignalsCollected}`);
      console.log(`  Errors: ${taskStat.errors.length}`);
    });
  }

  /**
   * Cierra el scheduler y todas las tareas
   */
  async shutdown() {
    console.log('[RadarScheduler] 🛑 Shutting down...');
    
    // Detener todas las tareas
    this.activeTasks.forEach((task, taskName) => {
      task.stop();
      console.log(`[RadarScheduler] Stopped task: ${taskName}`);
    });
    
    this.activeTasks.clear();
    this.taskStats.clear();
    
    // Cerrar el Orchestrator
    await this.orchestrator.shutdown();
    
    this.isInitialized = false;
    console.log('[RadarScheduler] ✅ Shutdown completed');
  }
}

/**
 * EJEMPLO DE USO DEL SCHEDULER
 */
async function ejemploScheduler() {
  console.log('⏰ === EJEMPLO: RADAR SCHEDULER ===\n');
  
  const scheduler = new RadarScheduler();
  
  try {
    // Inicializar scheduler
    await scheduler.initialize();
    
    // Mostrar estado inicial
    scheduler.showStatus();
    
    // Ejecutar por 2 minutos como demo
    console.log('\n⏳ Ejecutando scheduler por 2 minutos (demo)...');
    
    setTimeout(() => {
      scheduler.showStatus();
      console.log('\n📊 Estadísticas actualizadas después de 1 minuto');
    }, 60000);
    
    setTimeout(async () => {
      console.log('\n🛑 Deteniendo scheduler (demo completado)');
      await scheduler.shutdown();
    }, 120000);
    
  } catch (error) {
    console.error('❌ Error en scheduler:', error);
    await scheduler.shutdown();
  }
}

/**
 * CONFIGURACIÓN PARA PRODUCCIÓN
 */
const PRODUCTION_SCHEDULES = {
  // Monitoreo continuo cada 15 minutos
  continuousMonitoring: '*/15 * * * *',
  
  // Análisis profundo cada 2 horas
  deepAnalysis: '0 */2 * * *',
  
  // Reportes diarios a las 8:00 AM
  dailyReports: '0 8 * * *',
  
  // Limpieza de datos los domingos a las 3:00 AM
  weeklyCleanup: '0 3 * * 0',
  
  // Health checks cada 5 minutos
  frequentHealthCheck: '*/5 * * * *'
};

// Exportar
module.exports = {
  RadarScheduler,
  SCHEDULED_TASKS,
  PRODUCTION_SCHEDULES,
  ejemploScheduler
};

// Ejecutar ejemplo si se llama directamente
if (require.main === module) {
  ejemploScheduler().catch(console.error);
}