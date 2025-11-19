/**
 * ===============================================================================
 * TEST RÁPIDO DE IMPORTACIONES - VERIFICACIÓN DE COMPATIBILIDAD
 * ===============================================================================
 */

console.log('🧪 Testing module imports...');

try {
  // Test Orchestrator
  const { Orchestrator } = require('./src/core/Orchestrator');
  const orchestrator = Orchestrator.getInstance();
  console.log('✅ Orchestrator imported successfully');

  // Test Health Monitor  
  const RadarHealthMonitor = require('./src/core/monitoring/RadarHealthMonitor');
  const monitor = RadarHealthMonitor.getInstance();
  console.log('✅ RadarHealthMonitor imported successfully');

  // Test Scheduler
  const RadarScheduler = require('./src/core/Scheduler');
  const scheduler = RadarScheduler.getInstance();
  console.log('✅ RadarScheduler imported successfully');

  // Test Routes
  const radarRoutes = require('./routes/radar.routes');
  console.log('✅ Radar routes imported successfully');

  console.log('\n🎉 All modules imported successfully!');
  console.log('📋 Ready to start server with: node index.js');

} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('🔧 Check file paths and dependencies');
}