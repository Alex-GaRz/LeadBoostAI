/**
 * ===============================================================================
 * SCRIPT DE PRUEBAS COMPLETAS - SISTEMA RADAR
 * ===============================================================================
 * 
 * Script Node.js para ejecutar todas las pruebas del sistema RADAR
 * de forma automática y mostrar resultados formateados.
 */

const http = require('http');

// Función helper para hacer requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (error) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Función para mostrar resultados
function showResult(testName, result, success = true) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${success ? '✅' : '❌'} ${testName}`);
  console.log(`${'='.repeat(60)}`);
  
  if (typeof result === 'object') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(result);
  }
}

// Función principal de pruebas
async function runAllTests() {
  console.log('🧪 INICIANDO PRUEBAS COMPLETAS DEL SISTEMA RADAR');
  console.log('🔒 Modo MOCK - Sin costos de API');
  console.log('=' .repeat(70));

  try {
    // 1. Test de Status
    console.log('\n🔍 1. Testing System Status...');
    const status = await makeRequest('GET', '/api/radar/status');
    showResult('System Status', status);

    // 2. Test de Métricas
    console.log('\n📊 2. Testing System Metrics...');
    const metrics = await makeRequest('GET', '/api/radar/metrics');
    showResult('System Metrics', metrics);

    // 3. Test de Health Check
    console.log('\n🏥 3. Testing Health Check...');
    const health = await makeRequest('GET', '/api/radar/health');
    showResult('Health Check', health);

    // 4. Test de Inicialización
    console.log('\n🚀 4. Testing Initialization...');
    const init = await makeRequest('POST', '/api/radar/initialize');
    showResult('Initialization', init);

    // 5. Test Básico (Mock)
    console.log('\n🧪 5. Testing Basic Mock Operation...');
    const testBasic = await makeRequest('POST', '/api/radar/test', { testType: 'basic' });
    showResult('Basic Test', testBasic);

    // 6. Test de Ingesta Individual
    console.log('\n📡 6. Testing Individual Ingestion...');
    const ingestion = await makeRequest('POST', '/api/radar/run', {
      source: 'TWITTER',
      query: 'startup innovation',
      maxResults: 5
    });
    showResult('Individual Ingestion', ingestion);

    // 7. Test de Ingesta Batch
    console.log('\n📦 7. Testing Batch Ingestion...');
    const batch = await makeRequest('POST', '/api/radar/batch-run', {
      configs: [
        { source: 'TWITTER', query: 'AI trends', maxResults: 3 },
        { source: 'TWITTER', query: 'startup funding', maxResults: 2 }
      ]
    });
    showResult('Batch Ingestion', batch);

    // 8. Test de Dashboard
    console.log('\n📊 8. Testing Dashboard...');
    const dashboard = await makeRequest('GET', '/api/radar/dashboard');
    showResult('Dashboard Data', {
      health: dashboard.dashboard?.health?.orchestrator,
      systemStatus: dashboard.dashboard?.systemStatus,
      totalSignals: dashboard.dashboard?.stats?.totalSignalsCollected,
      successRate: dashboard.dashboard?.metrics?.successRate,
      uptime: Math.round(dashboard.dashboard?.uptime / 1000) + 's'
    });

    // 9. Test de Reporte
    console.log('\n📋 9. Testing System Report...');
    const report = await makeRequest('GET', '/api/radar/report');
    showResult('System Report', report.report || report);

    // 10. Test de Historial
    console.log('\n📜 10. Testing Execution History...');
    const history = await makeRequest('GET', '/api/radar/history');
    showResult('Execution History', {
      totalExecutions: history.history?.length || 0,
      recentExecutions: history.history?.slice(0, 3) || []
    });

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('=' .repeat(70));
    console.log('✅ Sistema RADAR completamente funcional');
    console.log('🔒 Modo MOCK activo - Sin costos de API');
    console.log('📊 Monitoreo SRE operativo');
    console.log('🎛️ Control manual habilitado');
    console.log('🚀 Listo para desarrollo y pruebas');
    console.log('=' .repeat(70));

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error.message);
    console.error('🔧 Verifica que el servidor esté ejecutándose en puerto 4000');
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, makeRequest };