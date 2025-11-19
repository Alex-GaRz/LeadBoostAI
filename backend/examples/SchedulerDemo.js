/**
 * ===============================================================================
 * DEMO DEL RADAR SCHEDULER - EL CORAZÓN EN ACCIÓN
 * ===============================================================================
 * 
 * Demostración práctica del Scheduler automático.
 * Ejecuta este archivo para ver el "corazón" del sistema latiendo.
 * 
 * @author LeadBoostAI - Radar System
 */

const { RadarScheduler } = require('../src/core/Scheduler');

/**
 * Demostración básica del Scheduler
 */
async function demoScheduler() {
  console.log('💓 ===== DEMO: RADAR SCHEDULER - EL CORAZÓN =====\n');
  
  const scheduler = new RadarScheduler();
  
  try {
    // =========================================
    // INICIAR EL CORAZÓN DEL SISTEMA
    // =========================================
    
    console.log('🚀 Iniciando el corazón del Sistema RADAR...\n');
    
    await scheduler.start();
    
    // =========================================
    // MONITOREAR EL LATIDO POR 5 MINUTOS
    // =========================================
    
    console.log('⏳ Monitoreando el sistema por 5 minutos...');
    console.log('   (En producción, esto correría 24/7)');
    console.log('   Presiona Ctrl+C para detener antes\n');
    
    // Mostrar estado cada minuto
    const statusInterval = setInterval(() => {
      scheduler.showStatus();
    }, 60000); // Cada minuto
    
    // Detener después de 5 minutos (solo para demo)
    setTimeout(async () => {
      console.log('\n⏰ Demo completado - Deteniendo scheduler...');
      
      clearInterval(statusInterval);
      await scheduler.stop();
      
      console.log('✅ Demo terminado exitosamente');
      process.exit(0);
      
    }, 5 * 60 * 1000); // 5 minutos
    
    // =========================================
    // MANEJO DE INTERRUPCIÓN (Ctrl+C)
    // =========================================
    
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Interrupción detectada - Deteniendo scheduler...');
      clearInterval(statusInterval);
      await scheduler.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error en demo del scheduler:', error.message);
    await scheduler.stop();
    process.exit(1);
  }
}

/**
 * Demo con tarea personalizada
 */
async function demoTareaPersonalizada() {
  console.log('\n🎯 ===== DEMO: TAREA PERSONALIZADA =====\n');
  
  const scheduler = new RadarScheduler();
  
  try {
    await scheduler.start();
    
    // Agregar tarea personalizada que corre cada 2 minutos
    await scheduler.addTask({
      name: 'BLOCKCHAIN_MONITOR',
      cronExpression: '*/2 * * * *', // Cada 2 minutos
      source: 'TWITTER',
      keyword: 'blockchain OR cryptocurrency',
      maxResults: 30,
      enabled: true
    });
    
    console.log('✅ Tarea personalizada agregada - Monitoreando blockchain...');
    
    // Mostrar estado después de 3 minutos
    setTimeout(() => {
      scheduler.showStatus();
    }, 3 * 60 * 1000);
    
    // Detener después de 10 minutos
    setTimeout(async () => {
      await scheduler.stop();
      process.exit(0);
    }, 10 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Error en demo de tarea personalizada:', error);
    await scheduler.stop();
    process.exit(1);
  }
}

/**
 * Demo de control de tareas (pausar/reanudar)
 */
async function demoControlTareas() {
  console.log('\n🎛️ ===== DEMO: CONTROL DE TAREAS =====\n');
  
  const scheduler = new RadarScheduler();
  
  try {
    await scheduler.start();
    
    // Mostrar estado inicial
    setTimeout(() => {
      scheduler.showStatus();
    }, 1000);
    
    // Pausar una tarea después de 2 minutos
    setTimeout(() => {
      console.log('\n⏸️ Pausando tarea de AI_TRENDS_MONITOR...');
      scheduler.pauseTask('AI_TRENDS_MONITOR');
    }, 2 * 60 * 1000);
    
    // Reanudarla después de 4 minutos
    setTimeout(() => {
      console.log('\n▶️ Reanudando tarea de AI_TRENDS_MONITOR...');
      scheduler.resumeTask('AI_TRENDS_MONITOR');
    }, 4 * 60 * 1000);
    
    // Mostrar estado final después de 6 minutos
    setTimeout(() => {
      scheduler.showStatus();
      scheduler.stop();
      process.exit(0);
    }, 6 * 60 * 1000);
    
  } catch (error) {
    console.error('❌ Error en demo de control:', error);
    await scheduler.stop();
    process.exit(1);
  }
}

/**
 * Instrucciones de uso
 */
function mostrarInstrucciones() {
  console.log('\n📖 ===== INSTRUCCIONES DE USO =====');
  console.log('');
  console.log('Para ejecutar las demos:');
  console.log('');
  console.log('1. Demo básico (recomendado):');
  console.log('   node backend/examples/SchedulerDemo.js');
  console.log('');
  console.log('2. Demo con tarea personalizada:');
  console.log('   node backend/examples/SchedulerDemo.js custom');
  console.log('');
  console.log('3. Demo de control de tareas:');
  console.log('   node backend/examples/SchedulerDemo.js control');
  console.log('');
  console.log('El scheduler ejecutará:');
  console.log('  🔍 "Artificial Intelligence" cada 30 minutos');
  console.log('  🔍 "Tech Trends" cada 45 minutos');
  console.log('  🔍 "startup funding OR venture capital" cada 2 horas');
  console.log('');
  console.log('📊 Todos los datos se guardan automáticamente en Firebase');
  console.log('💓 El sistema "late" continuamente recolectando datos');
  console.log('');
}

/**
 * FUNCIÓN PRINCIPAL
 */
async function main() {
  const modo = process.argv[2];
  
  switch (modo) {
    case 'custom':
      await demoTareaPersonalizada();
      break;
      
    case 'control':
      await demoControlTareas();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      mostrarInstrucciones();
      break;
      
    default:
      await demoScheduler();
      break;
  }
}

// Exportar funciones
module.exports = {
  demoScheduler,
  demoTareaPersonalizada,
  demoControlTareas,
  mostrarInstrucciones,
  main
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}