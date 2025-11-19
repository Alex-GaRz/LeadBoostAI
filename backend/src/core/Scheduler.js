/**
 * ===============================================================================
 * RADAR SCHEDULER - JAVASCRIPT BRIDGE
 * ===============================================================================
 * 
 * Bridge JavaScript para el sistema de programación RADAR
 */

class RadarScheduler {
  static instance = null;

  constructor() {
    this.isRunning = false;
    this.jobs = [];
    this.intervals = [];
    console.log('[RadarScheduler] ⏰ Mock Scheduler initialized');
  }

  static getInstance() {
    if (!RadarScheduler.instance) {
      RadarScheduler.instance = new RadarScheduler();
    }
    return RadarScheduler.instance;
  }

  async start() {
    console.log('[RadarScheduler] 🚀 Mock: Starting scheduler...');
    this.isRunning = true;
    console.log('[RadarScheduler] ✅ Mock: Scheduler started (no automatic tasks scheduled)');
    console.log('[RadarScheduler] 🔒 Mock: Automatic execution disabled for cost control');
    return Promise.resolve();
  }

  async stop() {
    console.log('[RadarScheduler] 🛑 Mock: Stopping scheduler...');
    this.isRunning = false;
    
    // Limpiar intervalos
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    console.log('[RadarScheduler] ✅ Mock: Scheduler stopped');
    return Promise.resolve();
  }

  addJob(name, cronExpression, task) {
    console.log(`[RadarScheduler] 📋 Mock: Job "${name}" added with expression "${cronExpression}"`);
    this.jobs.push({
      name,
      cronExpression,
      task,
      enabled: false, // Deshabilitado por defecto por seguridad de costos
      lastRun: null,
      nextRun: null
    });
  }

  removeJob(name) {
    const index = this.jobs.findIndex(job => job.name === name);
    if (index !== -1) {
      this.jobs.splice(index, 1);
      console.log(`[RadarScheduler] 🗑️ Mock: Job "${name}" removed`);
    }
  }

  getJobs() {
    return this.jobs.map(job => ({
      name: job.name,
      cronExpression: job.cronExpression,
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      status: 'MOCK_DISABLED'
    }));
  }

  isActive() {
    return this.isRunning;
  }

  getStatus() {
    return {
      running: this.isRunning,
      jobCount: this.jobs.length,
      activeJobs: this.jobs.filter(j => j.enabled).length,
      mode: 'MOCK_SAFE',
      message: 'Scheduler en modo mock - no ejecuta tareas automáticas'
    };
  }
}

module.exports = RadarScheduler;