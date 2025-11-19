/**
 * ===============================================================================
 * EJEMPLO DE USO DEL ORCHESTRATOR - COORDINADOR CENTRAL
 * ===============================================================================
 * 
 * Ejemplos prácticos de cómo usar el Orchestrator para coordinar
 * búsquedas y guardado automático de señales.
 * 
 * @author LeadBoostAI - Radar System
 */

const { Orchestrator } = require('../src/core/Orchestrator');

/**
 * EJEMPLO 1: Ciclo de ingesta simple para una fuente
 */
async function ejemploCicloSimple() {
  console.log('🎯 === EJEMPLO: Ciclo de Ingesta Simple ===\n');
  
  try {
    // Obtener instancia del Orchestrator (Singleton)
    const orchestrator = Orchestrator.getInstance();
    
    // Inicializar el sistema
    await orchestrator.initialize();
    
    // Ejecutar ciclo de ingesta completo para Twitter
    const result = await orchestrator.runIngestionCycle(
      'TWITTER',                    // Fuente
      'artificial intelligence',    // Query
      {
        maxResults: 20,             // Máximo 20 resultados
        continueOnError: true       // Continuar aunque falle alguna señal
      }
    );
    
    // Mostrar resultados
    console.log('\n📊 === RESULTADOS DEL CICLO ===');
    console.log(`Fuente: ${result.source}`);
    console.log(`Query: "${result.query}"`);
    console.log(`✅ Exitoso: ${result.success}`);
    console.log(`🔍 Señales encontradas: ${result.signalsFound}`);
    console.log(`💾 Señales guardadas: ${result.signalsSaved}`);
    console.log(`❌ Señales fallidas: ${result.signalsFailed}`);
    console.log(`⏱️ Duración: ${result.durationMs}ms`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ === ERRORES ENCONTRADOS ===');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.step}] ${error.message}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error en ciclo simple:', error.message);
  }
}

/**
 * EJEMPLO 2: Ingesta masiva en múltiples fuentes
 */
async function ejemploIngestaMasiva() {
  console.log('\n🚀 === EJEMPLO: Ingesta Masiva Multi-Fuente ===\n');
  
  try {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    // Configurar múltiples fuentes y queries
    const configuraciones = [
      {
        source: 'TWITTER',
        query: 'startup funding',
        maxResults: 30,
        continueOnError: true
      },
      {
        source: 'TWITTER', // Misma fuente, different query
        query: 'venture capital',
        maxResults: 25,
        continueOnError: true,
        searchOptions: {
          language: 'en'
        }
      }
      // Aquí podrían ir más fuentes como TIKTOK, LINKEDIN, etc.
    ];
    
    // Ejecutar ingesta masiva
    const result = await orchestrator.runBatchIngestion(configuraciones);
    
    // Mostrar resultados agregados
    console.log('\n🎯 === RESULTADOS AGREGADOS ===');
    console.log(`📊 Total señales encontradas: ${result.totalSignalsFound}`);
    console.log(`💾 Total señales guardadas: ${result.totalSignalsSaved}`);
    console.log(`❌ Total señales fallidas: ${result.totalSignalsFailed}`);
    console.log(`✅ Fuentes exitosas: ${result.successfulSources.length}`);
    console.log(`❌ Fuentes fallidas: ${result.failedSources.length}`);
    console.log(`⏱️ Duración total: ${result.totalDurationMs}ms`);
    
    // Desglose por fuente
    console.log('\n📋 === DESGLOSE POR FUENTE ===');
    result.results.forEach((sourceResult, source) => {
      const status = sourceResult.success ? '✅' : '❌';
      console.log(`${status} ${source}: ${sourceResult.signalsSaved}/${sourceResult.signalsFound} señales`);
      console.log(`   Query: "${sourceResult.query}"`);
      console.log(`   Duración: ${sourceResult.durationMs}ms`);
    });
    
  } catch (error) {
    console.error('❌ Error en ingesta masiva:', error.message);
  }
}

/**
 * EJEMPLO 3: Monitoreo de marcas en tiempo real
 */
async function ejemploMonitoreoMarca() {
  console.log('\n🏢 === EJEMPLO: Monitoreo de Marca ===\n');
  
  try {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const marcas = ['OpenAI', 'ChatGPT', 'Claude AI'];
    
    // Crear query combinada para todas las marcas
    const query = marcas.map(marca => `"${marca}" OR @${marca}`).join(' OR ');
    
    const result = await orchestrator.runIngestionCycle(
      'TWITTER',
      query,
      {
        maxResults: 50,
        continueOnError: true,
        searchOptions: {
          language: 'en',
          includeReplies: false // Solo posts principales
        }
      }
    );
    
    console.log('\n🎯 === MONITOREO DE MARCA COMPLETADO ===');
    console.log(`Marcas monitoreadas: ${marcas.join(', ')}`);
    console.log(`Menciones encontradas: ${result.signalsFound}`);
    console.log(`Menciones guardadas: ${result.signalsSaved}`);
    
    if (result.success) {
      console.log('✅ Monitoreo exitoso - Datos listos para análisis');
    }
    
  } catch (error) {
    console.error('❌ Error en monitoreo de marca:', error.message);
  }
}

/**
 * EJEMPLO 4: Health check del sistema completo
 */
async function ejemploHealthCheck() {
  console.log('\n🏥 === EJEMPLO: Health Check del Sistema ===\n');
  
  try {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const health = await orchestrator.healthCheck();
    
    console.log('📊 === ESTADO DEL SISTEMA ===');
    console.log(`🎛️  Orchestrator: ${health.orchestrator ? '✅ OK' : '❌ FAIL'}`);
    console.log(`🏭 ConnectorFactory: ${health.connectorFactory ? '✅ OK' : '❌ FAIL'}`);
    console.log(`💾 SignalRepository: ${health.signalRepository ? '✅ OK' : '❌ FAIL'}`);
    
    if (health.details.connectors) {
      console.log('\n🔌 === ESTADO DE CONECTORES ===');
      Object.entries(health.details.connectors).forEach(([source, connectorHealth]) => {
        const status = connectorHealth.isHealthy ? '✅' : '❌';
        console.log(`${status} ${source}: ${connectorHealth.message}`);
        
        if (connectorHealth.averageLatencyMs) {
          console.log(`   Latencia: ${connectorHealth.averageLatencyMs}ms`);
        }
      });
    }
    
    if (health.details.repository) {
      console.log(`\n💾 Repository: ${health.details.repository}`);
    }
    
    if (health.details.error) {
      console.log(`\n❌ Error: ${health.details.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error en health check:', error.message);
  }
}

/**
 * EJEMPLO 5: Simulación de tarea programada (usando node-cron)
 */
async function ejemploTareaProgramada() {
  console.log('\n⏰ === EJEMPLO: Tarea Programada ===\n');
  
  const cron = require('node-cron');
  
  try {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    console.log('⏰ Configurando tarea programada cada 5 segundos (demo)...');
    
    // Programar tarea cada 5 segundos (en producción sería cada hora/día)
    const task = cron.schedule('*/5 * * * * *', async () => {
      console.log('\n🔄 === EJECUTANDO TAREA PROGRAMADA ===');
      
      try {
        const result = await orchestrator.runIngestionCycle(
          'TWITTER',
          'trending technology',
          { 
            maxResults: 10,
            continueOnError: true
          }
        );
        
        console.log(`✅ Tarea completada: ${result.signalsSaved} señales guardadas`);
        
      } catch (error) {
        console.error('❌ Error en tarea programada:', error.message);
      }
    }, {
      scheduled: false // No iniciar automáticamente
    });
    
    // Iniciar la tarea
    task.start();
    console.log('✅ Tarea programada iniciada');
    
    // Ejecutar por 30 segundos como demo
    setTimeout(() => {
      task.stop();
      console.log('\n⏹️ Tarea programada detenida (demo completado)');
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error configurando tarea programada:', error.message);
  }
}

/**
 * Casos de uso empresariales con el Orchestrator
 */
const casosDeUsoEmpresariales = {
  
  // Monitoreo continuo de reputación
  monitoreoReputacion: async (empresa) => {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const queries = [
      `"${empresa}" AND (complaint OR problem OR issue)`,
      `"${empresa}" AND (amazing OR excellent OR love)`,
      `@${empresa}` // Menciones directas
    ];
    
    const resultados = await Promise.all(
      queries.map(query => 
        orchestrator.runIngestionCycle('TWITTER', query, {
          maxResults: 50,
          continueOnError: true
        })
      )
    );
    
    return resultados.reduce((total, r) => total + r.signalsSaved, 0);
  },
  
  // Análisis de competencia automático
  analisisCompetencia: async (competidores) => {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const configs = competidores.map(comp => ({
      source: 'TWITTER',
      query: `"${comp}"`,
      maxResults: 30,
      continueOnError: true
    }));
    
    const result = await orchestrator.runBatchIngestion(configs);
    return result;
  },
  
  // Detección de crisis temprana
  deteccionCrisis: async (palabrasClaveRiesgo) => {
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.initialize();
    
    const query = palabrasClaveRiesgo.map(palabra => `"${palabra}"`).join(' OR ');
    
    const result = await orchestrator.runIngestionCycle('TWITTER', query, {
      maxResults: 100,
      continueOnError: true,
      searchOptions: {
        language: 'es' // Español para el mercado local
      }
    });
    
    return result;
  }
};

/**
 * FUNCIÓN PRINCIPAL - Ejecuta todos los ejemplos
 */
async function main() {
  console.log('🎯 ===== EJEMPLOS DEL ORCHESTRATOR =====\n');
  
  try {
    // Ejemplos básicos
    await ejemploCicloSimple();
    await ejemploIngestaMasiva();
    await ejemploMonitoreoMarca();
    await ejemploHealthCheck();
    
    // Ejemplo de tarea programada (correría en background)
    await ejemploTareaProgramada();
    
    console.log('\n🎉 === TODOS LOS EJEMPLOS COMPLETADOS ===');
    
    // Demostración de caso empresarial
    console.log('\n🏢 === CASO EMPRESARIAL: Análisis de Competencia ===');
    const competidores = ['Tesla', 'BMW Electric', 'Mercedes EQS'];
    const analisisResult = await casosDeUsoEmpresariales.analisisCompetencia(competidores);
    
    console.log(`📊 Análisis completado: ${analisisResult.totalSignalsSaved} señales recopiladas`);
    console.log(`⚡ Fuentes exitosas: ${analisisResult.successfulSources.length}`);
    
  } catch (error) {
    console.error('💥 Error fatal en ejemplos:', error);
  } finally {
    // Limpiar recursos
    const orchestrator = Orchestrator.getInstance();
    await orchestrator.shutdown();
    console.log('\n🧹 Recursos del Orchestrator liberados');
  }
}

// Exportar para uso en otros archivos
module.exports = {
  ejemploCicloSimple,
  ejemploIngestaMasiva,
  ejemploMonitoreoMarca,
  ejemploHealthCheck,
  ejemploTareaProgramada,
  casosDeUsoEmpresariales,
  main
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}