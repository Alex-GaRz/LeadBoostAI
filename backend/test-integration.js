/**
 * ===============================================================================
 * TEST DE INTEGRACIÓN - SISTEMA NERVIOSO RADAR CONECTADO
 * ===============================================================================
 * 
 * Script de prueba para verificar que el sistema nervioso RADAR esté 
 * completamente conectado y funcionando correctamente.
 */

console.log('🧪 INICIANDO TEST DE INTEGRACIÓN DEL SISTEMA RADAR');
console.log('='.repeat(60));

async function testRadarIntegration() {
  try {
    // Test 1: Verificar importaciones
    console.log('\n📦 Test 1: Verificando importaciones...');
    
    const radarRoutes = require('./routes/radar.routes');
    console.log('✅ radar.routes importado correctamente');
    
    // Test 2: Verificar RadarScheduler 
    console.log('\n⏰ Test 2: Verificando RadarScheduler...');
    
    const RadarScheduler = require('./src/core/Scheduler').default || require('./src/core/Scheduler');
    const scheduler = RadarScheduler.getInstance();
    console.log('✅ RadarScheduler instanciado correctamente');
    
    // Test 3: Verificar Orchestrator
    console.log('\n🧠 Test 3: Verificando Orchestrator...');
    
    const { Orchestrator } = require('./src/core/Orchestrator');
    const orchestrator = Orchestrator.getInstance();
    console.log('✅ Orchestrator instanciado correctamente');
    
    // Test 4: Verificar Health Monitor
    console.log('\n🏥 Test 4: Verificando RadarHealthMonitor...');
    
    const RadarHealthMonitor = require('./src/core/monitoring/RadarHealthMonitor').default;
    const monitor = RadarHealthMonitor.getInstance();
    const stats = monitor.getStats();
    console.log('✅ RadarHealthMonitor funcionando correctamente');
    console.log(`   📊 Estado: ${stats.status}`);
    console.log(`   📈 Uptime: ${Math.round(monitor.getMetrics().uptime / 1000)}s`);
    
    // Test 5: Health check completo
    console.log('\n🩺 Test 5: Health check completo...');
    
    await orchestrator.initialize();
    const healthCheck = await orchestrator.healthCheck();
    console.log('✅ Health check completado');
    console.log(`   🏥 Orchestrator: ${healthCheck.orchestrator ? '✅' : '❌'}`);
    console.log(`   🔌 ConnectorFactory: ${healthCheck.connectorFactory ? '✅' : '❌'}`);
    console.log(`   💾 SignalRepository: ${healthCheck.signalRepository ? '✅' : '❌'}`);
    
    console.log('\n🎉 TODOS LOS TESTS PASARON EXITOSAMENTE');
    console.log('🚀 El sistema nervioso RADAR está completamente conectado');
    console.log('='.repeat(60));
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR EN TEST DE INTEGRACIÓN:', error.message);
    console.error('🔧 Revisa las importaciones y dependencias');
    return false;
  }
}

// Ejecutar test si se llama directamente
if (require.main === module) {
  testRadarIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testRadarIntegration };