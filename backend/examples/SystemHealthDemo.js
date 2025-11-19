/**
 * ===============================================================================
 * DEMO FINAL - SISTEMA RADAR CON HEALTH MONITOR INTEGRADO
 * ===============================================================================
 * 
 * Demostración completa del Sistema RADAR con monitoreo SRE integrado.
 * Muestra cómo el Health Monitor trabaja automáticamente con el Orchestrator.
 * 
 * @author LeadBoostAI - Radar System
 */

const { Orchestrator } = require('../src/core/Orchestrator');
const { RadarHealthMonitor } = require('../src/core/monitoring/RadarHealthMonitor');

/**
 * Demo del sistema completo con monitoreo SRE
 */
async function demoSistemaCompleto() {
  console.log('🚀 ===== DEMO: SISTEMA RADAR + HEALTH MONITOR =====\n');
  
  try {
    // ===========================================
    // INICIALIZACIÓN DEL SISTEMA COMPLETO
    // ===========================================
    
    console.log('🏥 Inicializando sistema con monitoreo SRE...\n');
    
    const orchestrator = Orchestrator.getInstance();
    const healthMonitor = RadarHealthMonitor.getInstance(); // Misma instancia que usa Orchestrator
    
    await orchestrator.initialize();
    
    console.log('✅ Sistema inicializado con monitoreo automático\n');
    
    // ===========================================
    // ESTADO INICIAL DEL SISTEMA
    // ===========================================
    
    console.log('📊 === ESTADO INICIAL DEL SISTEMA ===');
    console.log(orchestrator.generateSystemReport());
    
    // ===========================================
    // EJECUCIÓN MONITOREADA AUTOMÁTICA
    // ===========================================
    
    console.log('\n🚀 === EJECUCIÓN MONITOREADA AUTOMÁTICA ===');
    console.log('El Orchestrator automáticamente reporta al Health Monitor...\n');
    
    // Ejecutar ciclo - El monitoreo es 100% automático
    const result1 = await orchestrator.runIngestionCycle(
      'TWITTER',
      'artificial intelligence',
      { maxResults: 15 }
    );
    
    console.log('\n📊 Estado después de primera ejecución:');
    const stats1 = orchestrator.getHealthStats();
    const metrics1 = orchestrator.getHealthMetrics();
    
    console.log(`🟢 Status: ${stats1.status}`);
    console.log(`📈 Total Signals: ${stats1.totalSignalsCollected}`);
    console.log(`✅ Success Rate: ${metrics1.successRate.toFixed(1)}%`);
    console.log(`🏥 Health: ${metrics1.healthStatus}`);
    
    // ===========================================
    // MÚLTIPLES EJECUCIONES PARA VER TENDENCIAS
    // ===========================================
    
    console.log('\n🔄 === EJECUTANDO MÚLTIPLES CICLOS ===');
    console.log('Observando cómo evolucionan las métricas...\n');
    
    // Ejecutar varios ciclos
    const queries = [
      'tech trends',
      'machine learning',
      'startup funding',
      'blockchain technology'
    ];
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`🔍 Ejecutando ciclo ${i + 2}: "${query}"`);
      
      try {
        const result = await orchestrator.runIngestionCycle('TWITTER', query, {
          maxResults: 10 + i * 5
        });
        
        const currentStats = orchestrator.getHealthStats();
        console.log(`   ✅ Signals guardados: ${result.signalsSaved}`);
        console.log(`   📊 Total acumulado: ${currentStats.totalSignalsCollected}`);
        
      } catch (error) {
        console.log(`   ❌ Error en ciclo: ${error.message}`);
      }
      
      // Pausa entre ejecuciones
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ===========================================
    // SIMULACIÓN DE ERROR Y RECUPERACIÓN
    // ===========================================
    
    console.log('\n🔥 === SIMULACIÓN DE ERROR Y RECUPERACIÓN ===');
    console.log('Probando robustez del sistema de monitoreo...\n');
    
    // Simular error manualmente
    console.log('❌ Simulando error crítico...');
    healthMonitor.startRun('TWITTER');
    healthMonitor.recordError(new Error('Simulated critical error for testing'));
    
    const statsAfterError = orchestrator.getHealthStats();
    const metricsAfterError = orchestrator.getHealthMetrics();
    
    console.log(`🔴 Status después del error: ${statsAfterError.status}`);
    console.log(`⚠️  Health Status: ${metricsAfterError.healthStatus}`);
    console.log(`📊 Success Rate: ${metricsAfterError.successRate.toFixed(1)}%`);
    console.log(`🔥 Total Errors: ${statsAfterError.errorsCount}`);
    
    // Recuperación con ejecución exitosa
    console.log('\n✅ Ejecutando recuperación...');
    const recoveryResult = await orchestrator.runIngestionCycle('TWITTER', 'recovery test', {
      maxResults: 8
    });
    
    const statsAfterRecovery = orchestrator.getHealthStats();
    const metricsAfterRecovery = orchestrator.getHealthMetrics();
    
    console.log(`🟢 Status después de recuperación: ${statsAfterRecovery.status}`);
    console.log(`💚 Health Status: ${metricsAfterRecovery.healthStatus}`);
    console.log(`📈 Success Rate: ${metricsAfterRecovery.successRate.toFixed(1)}%`);
    
    // ===========================================
    // REPORTE FINAL COMPLETO
    // ===========================================
    
    console.log('\n📋 === REPORTE FINAL DEL SISTEMA ===');
    console.log(orchestrator.generateSystemReport());
    
    // ===========================================
    // HEALTH CHECK COMPLETO
    // ===========================================
    
    console.log('\n🏥 === HEALTH CHECK COMPLETO ===');
    const healthCheck = await orchestrator.healthCheck();
    
    console.log('📊 Componentes del sistema:');
    console.log(`   🧠 Orchestrator: ${healthCheck.orchestrator ? '✅' : '❌'}`);
    console.log(`   🏭 ConnectorFactory: ${healthCheck.connectorFactory ? '✅' : '❌'}`);
    console.log(`   💾 SignalRepository: ${healthCheck.signalRepository ? '✅' : '❌'}`);
    console.log(`   🏥 HealthMonitor: ${healthCheck.healthMonitor.stats.status}`);
    
    console.log('\n📈 Métricas SRE:');
    const finalMetrics = healthCheck.healthMonitor.metrics;
    console.log(`   Uptime: ${Math.floor(finalMetrics.uptime / 1000)}s`);
    console.log(`   Success Rate: ${finalMetrics.successRate.toFixed(2)}%`);
    console.log(`   Signals/Minute: ${finalMetrics.signalsPerMinute.toFixed(2)}`);
    console.log(`   Health Status: ${finalMetrics.healthStatus}`);
    
    // ===========================================
    // HISTORIAL DE EJECUCIONES
    // ===========================================
    
    console.log('\n📋 === HISTORIAL RECIENTE ===');
    const history = healthMonitor.getExecutionHistory(5);
    
    history.reverse().forEach((record, index) => {
      const status = record.successful ? '✅' : '❌';
      const duration = record.duration ? `${record.duration}ms` : 'N/A';
      const time = record.startTime.toLocaleTimeString();
      
      console.log(`   ${status} ${time} - ${record.source}: ${record.signalsCount} signals (${duration})`);
    });
    
    console.log('\n🎉 === DEMO COMPLETADO EXITOSAMENTE ===');
    console.log('✅ Sistema RADAR con Health Monitor funcionando perfectamente');
    console.log('📊 Todas las métricas SRE siendo recopiladas automáticamente');
    console.log('🔄 Sistema listo para operación 24/7 con monitoreo continuo');
    
  } catch (error) {
    console.error('❌ Error en demo del sistema:', error);
  } finally {
    // Cleanup
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.shutdown();
    console.log('\n🧹 Recursos del sistema liberados');
  }
}

/**
 * Demo de alertas SRE en tiempo real
 */
async function demoAlertasSRE() {
  console.log('\n🚨 === DEMO: ALERTAS SRE EN TIEMPO REAL ===\n');
  
  const orchestrator = Orchestrator.getInstance();
  const healthMonitor = RadarHealthMonitor.getInstance();
  
  try {
    await orchestrator.initialize();
    
    // Configurar alertas automáticas
    const alertInterval = setInterval(() => {
      const metrics = orchestrator.getHealthMetrics();
      const stats = orchestrator.getHealthStats();
      const timestamp = new Date().toISOString();
      
      console.log(`[${timestamp}] Health Check: ${metrics.healthStatus}`);
      
      // Alertas críticas
      if (metrics.healthStatus === 'CRITICAL') {
        console.error(`🚨 CRITICAL ALERT: System health is critical!`);
        console.error(`   Success Rate: ${metrics.successRate.toFixed(1)}%`);
        console.error(`   Last Error: ${stats.lastError}`);
      }
      
      // Alertas de degradación
      if (metrics.healthStatus === 'DEGRADED') {
        console.warn(`⚠️  DEGRADED ALERT: System performance degraded`);
        console.warn(`   Success Rate: ${metrics.successRate.toFixed(1)}%`);
      }
      
      // Alertas de inactividad
      if (metrics.timeSinceLastRun && metrics.timeSinceLastRun > 5 * 60 * 1000) {
        console.warn(`⚠️  INACTIVITY ALERT: No activity for ${Math.floor(metrics.timeSinceLastRun / 60000)} minutes`);
      }
      
      // Alertas de tasa de errores
      if (metrics.errorsPerHour > 10) {
        console.warn(`⚠️  HIGH ERROR RATE: ${metrics.errorsPerHour.toFixed(1)} errors/hour`);
      }
      
    }, 10000); // Cada 10 segundos
    
    console.log('🚨 Sistema de alertas SRE activado');
    console.log('📊 Monitoreando métricas cada 10 segundos...\n');
    
    // Simular actividad mixta (éxitos y errores)
    for (let i = 0; i < 5; i++) {
      if (Math.random() < 0.7) { // 70% éxito
        await orchestrator.runIngestionCycle('TWITTER', `test query ${i}`, {
          maxResults: 5
        });
      } else {
        // Simular error
        healthMonitor.startRun('TWITTER');
        healthMonitor.recordError(new Error(`Simulated error ${i}`));
      }
      
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15 segundos
    }
    
    // Detener alertas
    clearInterval(alertInterval);
    console.log('✅ Demo de alertas SRE completado');
    
  } catch (error) {
    console.error('❌ Error en demo de alertas:', error);
  }
}

/**
 * FUNCIÓN PRINCIPAL
 */
async function main() {
  const modo = process.argv[2];
  
  switch (modo) {
    case 'alerts':
      await demoAlertasSRE();
      break;
      
    case 'help':
      console.log('🏥 === DEMOS DISPONIBLES ===');
      console.log('');
      console.log('node SystemHealthDemo.js           # Demo sistema completo');
      console.log('node SystemHealthDemo.js alerts    # Demo alertas SRE');
      console.log('');
      break;
      
    default:
      await demoSistemaCompleto();
      break;
  }
}

// Exportar funciones
module.exports = {
  demoSistemaCompleto,
  demoAlertasSRE,
  main
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}