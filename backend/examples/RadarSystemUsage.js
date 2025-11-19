/**
 * ===============================================================================
 * EJEMPLO DE USO DEL SISTEMA RADAR COMPLETO
 * ===============================================================================
 * 
 * Este archivo muestra cómo usar todas las piezas del sistema RADAR:
 * 1. UniversalSignal para estructurar datos
 * 2. SignalRepository para persistir en Firebase
 * 3. ConnectorFactory para recopilar datos de múltiples fuentes
 * 4. TwitterConnector para datos específicos de Twitter
 * 
 * @author LeadBoostAI - Radar System
 */

const ConnectorFactory = require('../src/core/connectors/ConnectorFactory').default;
const SignalRepository = require('../src/repositories/SignalRepository');

/**
 * EJEMPLO 1: Búsqueda simple en Twitter
 */
async function ejemploTwitterSimple() {
  console.log('🐦 === EJEMPLO: Búsqueda simple en Twitter ===');
  
  try {
    // Obtener conector de Twitter
    const twitterConnector = await ConnectorFactory.getConnector('TWITTER');
    
    // Realizar búsqueda
    const result = await twitterConnector.fetchSignals({
      query: 'artificial intelligence OR "machine learning"',
      maxResults: 10,
      language: 'en'
    });
    
    console.log(`✅ Encontrados ${result.signals.length} signals de Twitter`);
    console.log(`📊 Procesados: ${result.processed}, Fallidos: ${result.failed}`);
    console.log(`⏱️ Duración: ${result.durationMs}ms`);
    
    // Mostrar algunos signals
    result.signals.slice(0, 3).forEach((signal, index) => {
      console.log(`\n📝 Signal ${index + 1}:`);
      console.log(`   Texto: ${signal.content.slice(0, 100)}...`);
      console.log(`   Autor: @${signal.authorHandle}`);
      console.log(`   Engagement: ${signal.metrics.engagementCount}`);
      console.log(`   Sentimiento: ${signal.sentiment?.polarity || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda Twitter:', error.message);
  }
}

/**
 * EJEMPLO 2: Búsqueda en TODAS las fuentes (el poder del Radar)
 */
async function ejemploBusquedaMasiva() {
  console.log('\n🚀 === EJEMPLO: BÚSQUEDA EN TODAS LAS FUENTES ===');
  
  try {
    // Esta es la línea mágica: "Trae datos de TODAS las fuentes"
    const result = await ConnectorFactory.fetchFromAllSources({
      query: 'startup funding OR "venture capital"',
      maxResults: 20,
      language: 'en',
      continueOnError: true, // Continuar aunque falle alguna fuente
      parallel: true, // Ejecutar en paralelo para máxima velocidad
      timeoutPerConnector: 30000 // 30 segundos por conector
    });
    
    console.log('🎯 === RESULTADOS AGREGADOS ===');
    console.log(`Total signals recopilados: ${result.totalSignals}`);
    console.log(`Fuentes exitosas: ${result.successfulSources.length}`);
    console.log(`Fuentes fallidas: ${result.failedSources.length}`);
    console.log(`Tiempo total: ${result.totalDurationMs}ms`);
    
    // Mostrar resultados por fuente
    console.log('\n📊 === BREAKDOWN POR FUENTE ===');
    result.results.forEach((fetchResult, source) => {
      console.log(`${source}: ${fetchResult.signals.length} signals (${fetchResult.durationMs}ms)`);
    });
    
    // Mostrar errores si los hay
    if (result.errors.size > 0) {
      console.log('\n⚠️ === ERRORES ENCONTRADOS ===');
      result.errors.forEach((error, source) => {
        console.log(`${source}: ${error.message}`);
      });
    }
    
    // Analizar sentimientos de todos los signals
    const sentimientos = result.allSignals
      .filter(s => s.sentiment)
      .map(s => s.sentiment.polarity);
    
    const positivos = sentimientos.filter(s => s > 0.1).length;
    const negativos = sentimientos.filter(s => s < -0.1).length;
    const neutros = sentimientos.filter(s => s >= -0.1 && s <= 0.1).length;
    
    console.log('\n🎭 === ANÁLISIS DE SENTIMIENTOS ===');
    console.log(`Positivos: ${positivos} (${(positivos/sentimientos.length*100).toFixed(1)}%)`);
    console.log(`Negativos: ${negativos} (${(negativos/sentimientos.length*100).toFixed(1)}%)`);
    console.log(`Neutros: ${neutros} (${(neutros/sentimientos.length*100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('❌ Error en búsqueda masiva:', error.message);
  }
}

/**
 * EJEMPLO 3: Guardar signals en Firebase
 */
async function ejemploGuardarSignals() {
  console.log('\n💾 === EJEMPLO: GUARDAR SIGNALS EN FIREBASE ===');
  
  try {
    // Buscar algunos signals
    const twitterConnector = await ConnectorFactory.getConnector('TWITTER');
    const result = await twitterConnector.fetchSignals({
      query: 'blockchain',
      maxResults: 5
    });
    
    if (result.signals.length === 0) {
      console.log('❌ No se encontraron signals para guardar');
      return;
    }
    
    // Inicializar repositorio
    const repository = new SignalRepository();
    
    // Guardar signals uno por uno
    console.log(`💿 Guardando ${result.signals.length} signals...`);
    const savedIds = [];
    
    for (const signal of result.signals) {
      try {
        const savedId = await repository.saveSignal(signal);
        savedIds.push(savedId);
        console.log(`✅ Signal guardado: ${savedId}`);
      } catch (error) {
        console.log(`❌ Error guardando signal: ${error.message}`);
      }
    }
    
    console.log(`🎉 Total guardados exitosamente: ${savedIds.length}`);
    
    // Verificar que se guardaron correctamente
    const query = {
      sourceTypes: ['TWITTER'],
      limit: 5
    };
    
    const retrievedSignals = await repository.querySignals(query);
    console.log(`🔍 Verificación: ${retrievedSignals.length} signals encontrados en base de datos`);
    
  } catch (error) {
    console.error('❌ Error guardando signals:', error.message);
  }
}

/**
 * EJEMPLO 4: Health check del sistema
 */
async function ejemploHealthCheck() {
  console.log('\n🏥 === EJEMPLO: HEALTH CHECK DEL SISTEMA ===');
  
  try {
    // Verificar estado de todos los conectores
    const healthResults = await ConnectorFactory.healthCheckAll();
    
    console.log('📊 === ESTADO DE CONECTORES ===');
    healthResults.forEach((health, source) => {
      const status = health.isHealthy ? '✅' : '❌';
      console.log(`${status} ${source}: ${health.message}`);
      
      if (health.averageLatencyMs) {
        console.log(`   Latencia promedio: ${health.averageLatencyMs}ms`);
      }
      
      if (health.rateLimitStatus) {
        const { remaining, total } = health.rateLimitStatus;
        console.log(`   Rate limit: ${remaining}/${total} requests disponibles`);
      }
    });
    
    // Mostrar información de conectores registrados
    const connectorInfo = ConnectorFactory.getConnectorInfo();
    console.log('\n🔧 === CONECTORES REGISTRADOS ===');
    connectorInfo.forEach(info => {
      const status = info.enabled ? '✅ Habilitado' : '❌ Deshabilitado';
      console.log(`${info.source}: ${info.description} (v${info.version}) - ${status}`);
    });
    
  } catch (error) {
    console.error('❌ Error en health check:', error.message);
  }
}

/**
 * FUNCIÓN PRINCIPAL - Ejecuta todos los ejemplos
 */
async function main() {
  console.log('🎯 ===== EJEMPLOS DEL SISTEMA RADAR =====\n');
  
  try {
    // Inicializar el ConnectorFactory
    ConnectorFactory.initialize();
    
    await ejemploTwitterSimple();
    await ejemploBusquedaMasiva();
    await ejemploGuardarSignals();
    await ejemploHealthCheck();
    
    console.log('\n🎉 === TODOS LOS EJEMPLOS COMPLETADOS ===');
    
  } catch (error) {
    console.error('💥 Error fatal en ejemplos:', error);
  } finally {
    // Limpiar recursos
    await ConnectorFactory.shutdown();
    console.log('🧹 Recursos del ConnectorFactory liberados');
  }
}

/**
 * Ejemplos para usar en producción
 */
const ejemplosProduccion = {
  
  // Monitoreo de marca en tiempo real
  monitoreoMarca: async (marcas) => {
    const queries = marcas.map(marca => `"${marca}" OR @${marca}`);
    const result = await ConnectorFactory.fetchFromAllSources({
      query: queries.join(' OR '),
      maxResults: 100,
      parallel: true,
      continueOnError: true
    });
    
    return result.allSignals.filter(signal => 
      signal.sentiment && Math.abs(signal.sentiment.polarity) > 0.3
    );
  },
  
  // Detección de tendencias emergentes
  tendenciasEmergentes: async (industria) => {
    const result = await ConnectorFactory.fetchFromAllSources({
      query: `"${industria}" AND (trend OR trending OR viral OR breakthrough)`,
      maxResults: 200,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
      parallel: true
    });
    
    // Agrupar por temas similares
    const temas = {};
    result.allSignals.forEach(signal => {
      const keywords = signal.extractedKeywords || [];
      keywords.forEach(keyword => {
        temas[keyword] = (temas[keyword] || 0) + 1;
      });
    });
    
    return Object.entries(temas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  },
  
  // Análisis de competencia
  analisisCompetencia: async (competidores) => {
    const results = await Promise.all(
      competidores.map(comp => 
        ConnectorFactory.fetchFromAllSources({
          query: `"${comp}" OR @${comp}`,
          maxResults: 50,
          parallel: true
        })
      )
    );
    
    return competidores.map((comp, index) => ({
      nombre: comp,
      signals: results[index].totalSignals,
      sentimientoPromedio: results[index].allSignals
        .filter(s => s.sentiment)
        .reduce((acc, s) => acc + s.sentiment.polarity, 0) / results[index].allSignals.length,
      engagementPromedio: results[index].allSignals
        .reduce((acc, s) => acc + (s.metrics?.engagementCount || 0), 0) / results[index].allSignals.length
    }));
  }
};

// Exportar para uso en otros archivos
module.exports = {
  ejemploTwitterSimple,
  ejemploBusquedaMasiva,
  ejemploGuardarSignals,
  ejemploHealthCheck,
  ejemplosProduccion,
  main
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}