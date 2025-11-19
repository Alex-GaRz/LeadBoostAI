/**
 * ===============================================================================
 * RADAR SCHEDULER - EL CORAZÓN QUE LATE RÍTMICAMENTE
 * ===============================================================================
 * 
 * Scheduler automático que ejecuta ciclos de ingesta de datos del Sistema RADAR
 * en intervalos regulares. Actúa como el "corazón" del sistema, manteniendo
 * un flujo constante de datos actualizados.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

import * as cron from 'node-cron';
import { Orchestrator } from './Orchestrator';
import { SourceType } from '../../../src/domain/models/UniversalSignal';

/**
 * Configuración de una tarea programada
 */
interface ScheduledTask {
  /** Nombre identificativo de la tarea */
  name: string;
  
  /** Expresión cron para el schedule */
  cronExpression: string;
  
  /** Fuente de datos */
  source: SourceType;
  
  /** Keyword de búsqueda */
  keyword: string;
  
  /** Máximo número de resultados por ejecución */
  maxResults?: number;
  
  /** Si la tarea está habilitada */
  enabled: boolean;
}

/**
 * Estadísticas de ejecución de tareas
 */
interface TaskStats {
  /** Número total de ejecuciones */
  totalExecutions: number;
  
  /** Última ejecución exitosa */
  lastSuccessfulRun?: Date;
  
  /** Última ejecución (exitosa o fallida) */
  lastRun?: Date;
  
  /** Total de señales recopiladas */
  totalSignalsCollected: number;
  
  /** Número de errores consecutivos */
  consecutiveErrors: number;
  
  /** Último error encontrado */
  lastError?: string;
}

/**
 * RADAR SCHEDULER - El Corazón Rítmico del Sistema
 * 
 * Automatiza la ejecución de ciclos de ingesta de datos en intervalos regulares.
 * Mantiene el sistema "vivo" con un flujo constante de nuevos datos.
 */
export class RadarScheduler {
  private orchestrator: Orchestrator;
  private activeTasks: Map<string, cron.ScheduledTask> = new Map();
  private taskStats: Map<string, TaskStats> = new Map();
  private isRunning: boolean = false;

  /**
   * Tareas predefinidas del sistema
   */
  private readonly DEFAULT_TASKS: ScheduledTask[] = [
    {
      name: 'AI_TRENDS_MONITOR',
      cronExpression: '*/30 * * * *', // Cada 30 minutos
      source: SourceType.TWITTER,
      keyword: 'Artificial Intelligence',
      maxResults: 50,
      enabled: true
    },
    {
      name: 'TECH_TRENDS_MONITOR', 
      cronExpression: '*/45 * * * *', // Cada 45 minutos
      source: SourceType.TWITTER,
      keyword: 'Tech Trends',
      maxResults: 40,
      enabled: true
    },
    {
      name: 'STARTUP_ECOSYSTEM_MONITOR',
      cronExpression: '0 */2 * * *', // Cada 2 horas
      source: SourceType.TWITTER,
      keyword: 'startup funding OR venture capital',
      maxResults: 60,
      enabled: true
    }
  ];

  constructor() {
    this.orchestrator = Orchestrator.getInstance();
    console.log('[RadarScheduler] 💓 Radar Scheduler initialized');
  }

  /**
   * MÉTODO PRINCIPAL: Inicia el corazón rítmico del sistema
   * 
   * Configura y activa todas las tareas programadas predefinidas.
   * El sistema comenzará a "latir" automáticamente.
   */
  async start(): Promise<void> {
    try {
      console.log('[RadarScheduler] 🚀 Starting Radar Scheduler...');
      console.log('[RadarScheduler] ⏰ Initializing automated data collection...');

      // Inicializar el Orchestrator
      await this.orchestrator.initialize();
      console.log('[RadarScheduler] ✅ Orchestrator initialized successfully');

      // Configurar todas las tareas predefinidas
      for (const taskConfig of this.DEFAULT_TASKS) {
        if (taskConfig.enabled) {
          await this.scheduleTask(taskConfig);
        }
      }

      this.isRunning = true;

      console.log('\n🎯 ===============================================');
      console.log('🎯 RADAR SCHEDULER STARTED SUCCESSFULLY! 🎯');
      console.log('🎯 ===============================================');
      console.log(`💓 Heart is beating: ${this.activeTasks.size} tasks scheduled`);
      console.log('📊 Active monitoring for:');
      
      this.DEFAULT_TASKS.filter(t => t.enabled).forEach(task => {
        console.log(`   🔍 "${task.keyword}" every ${this.cronToHumanReadable(task.cronExpression)}`);
      });
      
      console.log('\n⚡ System is now collecting data automatically!');
      console.log('📈 Data will be saved to Firebase continuously...\n');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[RadarScheduler] ❌ Failed to start scheduler:', errorMessage);
      throw new Error(`Scheduler startup failed: ${errorMessage}`);
    }
  }

  /**
   * Programa una tarea específica usando cron
   */
  private async scheduleTask(taskConfig: ScheduledTask): Promise<void> {
    try {
      console.log(`[RadarScheduler] 📅 Scheduling task: ${taskConfig.name}`);
      console.log(`[RadarScheduler]    Schedule: ${taskConfig.cronExpression}`);
      console.log(`[RadarScheduler]    Keyword: "${taskConfig.keyword}"`);

      // Inicializar estadísticas
      this.taskStats.set(taskConfig.name, {
        totalExecutions: 0,
        totalSignalsCollected: 0,
        consecutiveErrors: 0
      });

      // Crear tarea cron
      const task = cron.schedule(taskConfig.cronExpression, async () => {
        await this.executeTask(taskConfig);
      }, {
        timezone: 'America/Mexico_City'
      });

      // Guardar referencia de la tarea
      this.activeTasks.set(taskConfig.name, task);

      // Iniciar la tarea
      task.start();

      console.log(`[RadarScheduler] ✅ Task "${taskConfig.name}" scheduled successfully`);
      console.log(`[RadarScheduler]    Next run: ${this.cronToHumanReadable(taskConfig.cronExpression)}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[RadarScheduler] ❌ Error scheduling task "${taskConfig.name}":`, errorMessage);
      throw error;
    }
  }

  /**
   * Ejecuta una tarea programada específica
   */
  private async executeTask(taskConfig: ScheduledTask): Promise<void> {
    const stats = this.taskStats.get(taskConfig.name)!;
    const startTime = Date.now();

    console.log(`\n💓 [RadarScheduler] HEARTBEAT - Executing: ${taskConfig.name}`);
    console.log(`⏰ [RadarScheduler] Time: ${new Date().toISOString()}`);
    console.log(`🔍 [RadarScheduler] Searching: "${taskConfig.keyword}"`);

    try {
      // Actualizar estadísticas
      stats.totalExecutions++;
      stats.lastRun = new Date();

      // Ejecutar ciclo de ingesta usando el Orchestrator
      const result = await this.orchestrator.runIngestionCycle(
        taskConfig.source,
        taskConfig.keyword,
        {
          maxResults: taskConfig.maxResults || 50,
          continueOnError: true
        }
      );

      // Procesar resultado exitoso
      if (result.success) {
        stats.lastSuccessfulRun = new Date();
        stats.totalSignalsCollected += result.signalsSaved;
        stats.consecutiveErrors = 0; // Reset error counter
        
        const duration = Date.now() - startTime;
        
        console.log(`✅ [RadarScheduler] Task "${taskConfig.name}" completed successfully`);
        console.log(`📊 [RadarScheduler] Signals saved: ${result.signalsSaved}/${result.signalsFound}`);
        console.log(`⏱️  [RadarScheduler] Duration: ${duration}ms`);
        console.log(`📈 [RadarScheduler] Total collected: ${stats.totalSignalsCollected} signals`);
        
      } else {
        throw new Error(`Ingestion cycle failed with errors: ${result.errors.length} errors`);
      }

    } catch (error) {
      // Manejar errores sin detener el scheduler
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stats.consecutiveErrors++;
      stats.lastError = errorMessage;

      console.error(`❌ [RadarScheduler] Task "${taskConfig.name}" failed:`, errorMessage);
      console.error(`🔥 [RadarScheduler] Consecutive errors: ${stats.consecutiveErrors}`);

      // Si hay muchos errores consecutivos, log warning pero continuar
      if (stats.consecutiveErrors >= 3) {
        console.warn(`⚠️  [RadarScheduler] WARNING: Task "${taskConfig.name}" has ${stats.consecutiveErrors} consecutive errors`);
        console.warn(`⚠️  [RadarScheduler] Consider checking system health or task configuration`);
      }

      // El scheduler continúa - NO lanza la excepción
    }

    console.log(`💓 [RadarScheduler] Heartbeat completed for: ${taskConfig.name}\n`);
  }

  /**
   * Agrega una nueva tarea personalizada al scheduler
   */
  async addTask(taskConfig: ScheduledTask): Promise<void> {
    if (this.activeTasks.has(taskConfig.name)) {
      throw new Error(`Task "${taskConfig.name}" already exists`);
    }

    await this.scheduleTask(taskConfig);
    console.log(`[RadarScheduler] ➕ Custom task "${taskConfig.name}" added successfully`);
  }

  /**
   * Pausa una tarea específica
   */
  pauseTask(taskName: string): boolean {
    const task = this.activeTasks.get(taskName);
    if (task) {
      task.stop();
      console.log(`⏸️  [RadarScheduler] Task "${taskName}" paused`);
      return true;
    }
    console.warn(`⚠️  [RadarScheduler] Task "${taskName}" not found`);
    return false;
  }

  /**
   * Reanuda una tarea pausada
   */
  resumeTask(taskName: string): boolean {
    const task = this.activeTasks.get(taskName);
    if (task) {
      task.start();
      console.log(`▶️  [RadarScheduler] Task "${taskName}" resumed`);
      return true;
    }
    console.warn(`⚠️  [RadarScheduler] Task "${taskName}" not found`);
    return false;
  }

  /**
   * Obtiene estadísticas de todas las tareas
   */
  getStats(): Map<string, TaskStats> {
    return new Map(this.taskStats);
  }

  /**
   * Muestra estado actual del scheduler
   */
  showStatus(): void {
    console.log('\n💓 =============== RADAR SCHEDULER STATUS ===============');
    console.log(`🟢 Scheduler Running: ${this.isRunning}`);
    console.log(`📅 Active Tasks: ${this.activeTasks.size}`);
    console.log(`📊 Total Tasks Configured: ${this.DEFAULT_TASKS.length}`);
    
    console.log('\n📋 Task Details:');
    this.taskStats.forEach((stats, taskName) => {
      const task = this.DEFAULT_TASKS.find(t => t.name === taskName);
      const isActive = this.activeTasks.has(taskName);
      const status = isActive ? '🟢 Active' : '🔴 Inactive';
      
      console.log(`\n  ${taskName}:`);
      console.log(`    Status: ${status}`);
      if (task) {
        console.log(`    Keyword: "${task.keyword}"`);
        console.log(`    Schedule: ${this.cronToHumanReadable(task.cronExpression)}`);
      }
      console.log(`    Executions: ${stats.totalExecutions}`);
      console.log(`    Last run: ${stats.lastRun?.toISOString() || 'Never'}`);
      console.log(`    Last success: ${stats.lastSuccessfulRun?.toISOString() || 'Never'}`);
      console.log(`    Signals collected: ${stats.totalSignalsCollected}`);
      console.log(`    Consecutive errors: ${stats.consecutiveErrors}`);
      
      if (stats.lastError) {
        console.log(`    Last error: ${stats.lastError}`);
      }
    });
    
    console.log('\n💓 ================================================\n');
  }

  /**
   * Convierte expresión cron a texto legible
   */
  private cronToHumanReadable(cronExpression: string): string {
    const patterns: Record<string, string> = {
      '*/30 * * * *': 'every 30 minutes',
      '*/45 * * * *': 'every 45 minutes', 
      '0 */2 * * *': 'every 2 hours',
      '0 * * * *': 'every hour',
      '0 9 * * *': 'daily at 9:00 AM'
    };

    return patterns[cronExpression] || cronExpression;
  }

  /**
   * Para el scheduler y limpia recursos
   */
  async stop(): Promise<void> {
    console.log('\n[RadarScheduler] 🛑 Stopping Radar Scheduler...');

    // Detener todas las tareas
    this.activeTasks.forEach((task, taskName) => {
      task.stop();
      console.log(`[RadarScheduler] 🔇 Stopped task: ${taskName}`);
    });

    this.activeTasks.clear();
    this.isRunning = false;

    // Shutdown del Orchestrator
    await this.orchestrator.shutdown();

    console.log('[RadarScheduler] ✅ Radar Scheduler stopped successfully');
    console.log('[RadarScheduler] 💤 Heart has stopped beating - System in rest mode\n');
  }

  /**
   * Verifica si el scheduler está ejecutándose
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export default RadarScheduler;