/**
 * ===============================================================================
 * EJEMPLO DE INTEGRACIÓN - RADAR HEALTH MONITOR
 * ===============================================================================
 * 
 * Demostración de cómo integrar el RadarHealthMonitor con el Orchestrator
 * para monitoreo SRE en tiempo real.
 * 
 * @author LeadBoostAI - Radar System
 */

const { RadarHealthMonitor } = require('../src/core/monitoring/RadarHealthMonitor');
const { Orchestrator } = require('../src/core/Orchestrator');

/**
 * EJEMPLO 1: Uso básico del Health Monitor
 */
async function ejemploHealthMonitorBasico() {
  console.log('🏥 === EJEMPLO: Health Monitor Básico ===\n');
  
  try {
    // Obtener instancia del monitor (Singleton)
    const monitor = RadarHealthMonitor.getInstance();
    
    console.log('📊 Estado inicial del sistema:');
    console.log(monitor.generateReport());
    
    // Simular una ejecución exitosa
    console.log('\n🚀 Simulando ejecución exitosa...');
    monitor.startRun('TWITTER');
    
    // Simular procesamiento (esperar 2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    monitor.endRun(25); // 25 señales recopiladas
    
    console.log('\n📊 Estado después de ejecución exitosa:');
    const stats = monitor.getStats();
    console.log(`Status: ${stats.status}`);
    console.log(`Total Signals: ${stats.totalSignalsCollected}`);
    console.log(`Total Executions: ${stats.totalExecutions}`);
    console.log(`Success Rate: ${(stats.successfulExecutions/stats.totalExecutions*100).toFixed(2)}%`);
    
    // Simular un error
    console.log('\n❌ Simulando error...');
    monitor.startRun('TWITTER');
    monitor.recordError(new Error('API rate limit exceeded'));
    
    console.log('\n📊 Estado después del error:');
    const statsAfterError = monitor.getStats();
    console.log(`Status: ${statsAfterError.status}`);
    console.log(`Errors Count: ${statsAfterError.errorsCount}`);
    console.log(`Last Error: ${statsAfterError.lastError}`);
    
    // Métricas avanzadas
    console.log('\n📈 Métricas de rendimiento:');
    const metrics = monitor.getMetrics();
    console.log(`Health Status: ${metrics.healthStatus}`);
    console.log(`Uptime: ${metrics.uptime}ms`);
    console.log(`Success Rate: ${metrics.successRate.toFixed(2)}%`);
    console.log(`Signals/Minute: ${metrics.signalsPerMinute.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error en ejemplo básico:', error);
  }
}

/**
 * EJEMPLO 2: Integración con Orchestrator
 */
async function ejemploIntegracionOrchestrator() {
  console.log('\n🔗 === EJEMPLO: Integración con Orchestrator ===\n');
  
  try {
    const monitor = RadarHealthMonitor.getInstance();
    const orchestrator = Orchestrator.getInstance();
    
    // Inicializar orchestrator
    await orchestrator.initialize();
    
    console.log('🚀 Ejecutando ciclo monitoreado...');
    
    // INICIO DEL MONITOREO
    monitor.startRun('TWITTER');
    
    try {
      // Ejecutar ciclo real del orchestrator
      const result = await orchestrator.runIngestionCycle(
        'TWITTER',
        'artificial intelligence',
        { maxResults: 10 }
      );
      
      // FINALIZACIÓN EXITOSA
      if (result.success) {
        monitor.endRun(result.signalsSaved);
        console.log('✅ Ciclo completado y monitoreado exitosamente');
      } else {
        monitor.recordError(new Error('Ingestion cycle failed'));
        console.log('❌ Ciclo falló - Error registrado');
      }
      
    } catch (error) {
      // REGISTRO DE ERROR
      monitor.recordError(error);
      console.log('❌ Error en ciclo - Registrado en monitor');
    }
    
    // Mostrar reporte completo
    console.log('\n📊 Reporte completo del sistema:');
    console.log(monitor.generateReport());
    
  } catch (error) {
    console.error('❌ Error en integración:', error);
  }
}

/**
 * EJEMPLO 3: Monitoreo continuo con dashboard
 */
async function ejemploDashboardMonitoreo() {
  console.log('\n📊 === EJEMPLO: Dashboard de Monitoreo ===\n');
  
  const monitor = RadarHealthMonitor.getInstance();
  
  // Función para mostrar dashboard
  function mostrarDashboard() {
    console.clear(); // Limpiar pantalla
    
    const stats = monitor.getStats();
    const metrics = monitor.getMetrics();
    
    console.log('🚀 ===== RADAR SYSTEM DASHBOARD =====');
    console.log(`⏰ ${new Date().toLocaleString()}`);
    console.log('');
    
    // Estado principal
    const statusIcon = {
      'IDLE': '🟢',
      'RUNNING': '🔵', 
      'ERROR': '🔴'
    }[stats.status];
    
    console.log(`${statusIcon} STATUS: ${stats.status}`);
    console.log(`🎯 ACTIVE SOURCE: ${stats.activeSource || 'None'}`);
    console.log('');
    
    // Métricas clave
    console.log('📊 KEY METRICS:');
    console.log(`   Signals Collected: ${stats.totalSignalsCollected}`);
    console.log(`   Total Executions: ${stats.totalExecutions}`);
    console.log(`   Success Rate: ${metrics.successRate.toFixed(1)}%`);
    console.log(`   Health: ${metrics.healthStatus}`);
    console.log('');
    
    // Timing
    console.log('⏰ TIMING:');
    console.log(`   Uptime: ${formatDuration(metrics.uptime)}`);
    console.log(`   Last Run: ${stats.lastRun ? stats.lastRun.toLocaleTimeString() : 'Never'}`);
    console.log(`   Avg Duration: ${stats.averageExecutionTime.toFixed(0)}ms`);
    console.log('');
    
    // Errores
    if (stats.errorsCount > 0) {
      console.log('❌ ERRORS:');
      console.log(`   Total Errors: ${stats.errorsCount}`);
      console.log(`   Last Error: ${stats.lastError || 'None'}`);
      console.log(`   Error Rate: ${metrics.errorsPerHour.toFixed(1)}/hour`);
      console.log('');
    }
    
    // Historial reciente
    const history = monitor.getExecutionHistory(5);
    if (history.length > 0) {
      console.log('📋 RECENT HISTORY:');
      history.reverse().forEach((record, index) => {
        const statusIcon = record.successful ? '✅' : '❌';
        const duration = record.duration ? `${record.duration}ms` : 'N/A';
        console.log(`   ${statusIcon} ${record.source}: ${record.signalsCount} signals (${duration})`);
      });
    }
    
    console.log('\nPress Ctrl+C to stop monitoring');
    console.log('=====================================');
  }
  
  // Actualizar dashboard cada 5 segundos
  const dashboardInterval = setInterval(mostrarDashboard, 5000);
  
  // Mostrar inmediatamente
  mostrarDashboard();
  
  // Simular actividad del sistema
  console.log('\n🎬 Simulando actividad del sistema...');
  
  const activityInterval = setInterval(async () => {
    const sources = ['TWITTER', 'NEWS_API', 'REDDIT'];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    
    monitor.startRun(randomSource);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // 90% de probabilidad de éxito
    if (Math.random() < 0.9) {
      const signalsCount = Math.floor(Math.random() * 50) + 10;
      monitor.endRun(signalsCount);
    } else {
      monitor.recordError(new Error('Simulated network error'));
    }
    
  }, 8000); // Cada 8 segundos
  
  // Parar después de 1 minuto (demo)
  setTimeout(() => {
    clearInterval(dashboardInterval);
    clearInterval(activityInterval);
    console.log('\n✅ Demo de dashboard completado');
  }, 60000);
}

/**
 * EJEMPLO 4: Health checks programados
 */
async function ejemploHealthChecksProgramados() {
  console.log('\n🏥 === EJEMPLO: Health Checks Programados ===\n');
  
  const monitor = RadarHealthMonitor.getInstance();
  
  // Health check cada 30 segundos
  const healthCheckInterval = setInterval(() => {
    const metrics = monitor.getMetrics();
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] Health Check: ${metrics.healthStatus}`);
    
    // Alertas basadas en métricas
    if (metrics.successRate < 80) {
      console.warn(`⚠️  ALERT: Low success rate: ${metrics.successRate.toFixed(1)}%`);
    }
    
    if (metrics.timeSinceLastRun && metrics.timeSinceLastRun > 10 * 60 * 1000) {
      console.warn(`⚠️  ALERT: No activity for ${Math.floor(metrics.timeSinceLastRun / 60000)} minutes`);
    }
    
    if (metrics.healthStatus === 'CRITICAL') {
      console.error(`🚨 CRITICAL ALERT: System health is critical!`);
    }
    
  }, 30000); // Cada 30 segundos
  
  console.log('🏥 Health checks iniciados - Ejecutando por 2 minutos...');
  
  // Detener después de 2 minutos
  setTimeout(() => {
    clearInterval(healthCheckInterval);
    console.log('✅ Health checks completados');
  }, 2 * 60 * 1000);
}

/**
 * Función auxiliar para formatear duración
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * FUNCIÓN PRINCIPAL
 */
async function main() {
  console.log('🏥 ===== EJEMPLOS RADAR HEALTH MONITOR =====\n');
  
  try {
    await ejemploHealthMonitorBasico();
    await ejemploIntegracionOrchestrator();
    
    // Preguntar qué demo ejecutar
    const args = process.argv.slice(2);
    
    if (args.includes('dashboard')) {
      await ejemploDashboardMonitoreo();
    } else if (args.includes('healthcheck')) {
      await ejemploHealthChecksProgramados();
    } else {
      console.log('\n🎯 Demos disponibles:');
      console.log('  node HealthMonitorDemo.js dashboard    # Dashboard en tiempo real');
      console.log('  node HealthMonitorDemo.js healthcheck  # Health checks programados');
    }
    
  } catch (error) {
    console.error('💥 Error en ejemplos:', error);
  }
}

// Exportar funciones
module.exports = {
  ejemploHealthMonitorBasico,
  ejemploIntegracionOrchestrator,
  ejemploDashboardMonitoreo,
  ejemploHealthChecksProgramados,
  main
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}