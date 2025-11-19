/**
 * ===============================================================================
 * QUICK START - INICIA EL CORAZÓN DEL RADAR
 * ===============================================================================
 * 
 * Archivo de inicio rápido para el Sistema RADAR.
 * Ejecuta este archivo para iniciar el monitoreo automático.
 * 
 * Uso simple:
 * ```bash
 * node backend/quickstart.js
 * ```
 * 
 * @author LeadBoostAI - Radar System
 */

const { RadarScheduler } = require('./src/core/Scheduler');

/**
 * INICIO RÁPIDO - Una línea para iniciar todo
 */
async function quickStart() {
  console.log('⚡ RADAR SYSTEM - QUICK START ⚡\n');
  
  try {
    // =========================================
    // UNA LÍNEA PARA INICIAR TODO EL SISTEMA
    // =========================================
    
    const scheduler = new RadarScheduler();
    await scheduler.start();
    
    // =========================================
    // SISTEMA CORRIENDO - PRESIONA CTRL+C PARA DETENER
    // =========================================
    
    console.log('🎯 Sistema iniciado exitosamente!');
    console.log('💓 El corazón está latiendo - Recopilando datos automáticamente');
    console.log('📊 Datos guardándose en Firebase en tiempo real');
    console.log('');
    console.log('🛑 Presiona Ctrl+C para detener el sistema');
    console.log('📈 O déjalo corriendo 24/7 para monitoreo continuo\n');
    
    // Mostrar estado cada 30 minutos
    const statusInterval = setInterval(() => {
      console.log('\n📊 === STATUS UPDATE ===');
      scheduler.showStatus();
    }, 30 * 60 * 1000);
    
    // Manejo de cierre limpio
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Deteniendo sistema...');
      clearInterval(statusInterval);
      await scheduler.stop();
      console.log('✅ Sistema detenido limpiamente');
      process.exit(0);
    });
    
    // Mantener el proceso vivo
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Error iniciando sistema:', error.message);
    console.error('💡 Tip: Asegúrate de que Firebase esté configurado correctamente');
    process.exit(1);
  }
}

/**
 * Verificación de requisitos
 */
function checkRequirements() {
  console.log('🔧 Verificando requisitos del sistema...\n');
  
  // Verificar variables de entorno críticas
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'TWITTER_BEARER_TOKEN'
  ];
  
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Variables de entorno faltantes:');
    missing.forEach(env => console.error(`   - ${env}`));
    console.error('\n💡 Configura estas variables antes de continuar');
    process.exit(1);
  }
  
  console.log('✅ Requisitos verificados correctamente\n');
}

/**
 * FUNCIÓN PRINCIPAL
 */
async function main() {
  // Verificar requisitos primero
  checkRequirements();
  
  // Iniciar sistema
  await quickStart();
}

// Ejecutar automáticamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error crítico:', error);
    process.exit(1);
  });
}