/**
 * ===============================================================================
 * DEMOSTRACIÓN: ORCHESTRATOR CON MONITOREO SRE INTEGRADO AUTOMÁTICO
 * ===============================================================================
 * 
 * Esta demostración muestra cómo el Orchestrator ahora reporta automáticamente
 * todas sus operaciones al RadarHealthMonitor, proporcionando observabilidad
 * completa sin código adicional.
 * 
 * Características Demostradas:
 * - Reporte automático de inicio de ejecución (startRun)
 * - Reporte automático de finalización exitosa (endRun) 
 * - Reporte automático de errores (recordError)
 * - Métricas en tiempo real del sistema
 * - Dashboard de observabilidad integrado
 * 
 * @author LeadBoostAI - Radar System
 * @version 2.0.0 - Con monitoreo SRE automático
 */

const { Orchestrator } = require('../src/core/Orchestrator');
const RadarHealthMonitor = require('../src/core/monitoring/RadarHealthMonitor').default;

/**
 * DEMO 1: Ciclo básico con monitoreo automático
 * El Orchestrator reporta automáticamente sin código adicional
 */
async function demo1_BasicCycleWithAutoMonitoring() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 DEMO 1: Ciclo Básico con Monitoreo SRE Automático');
    console.log('='.repeat(80));

    try {
        const orchestrator = Orchestrator.getInstance();
        const monitor = RadarHealthMonitor.getInstance();
        
        // Inicializar
        await orchestrator.initialize();
        
        // Estado antes de la ejecución
        console.log('\n📊 ESTADO ANTES DE EJECUCIÓN:');
        console.log('Señales totales colectadas:', monitor.getStats().totalSignalsCollected);
        console.log('Ejecuciones totales:', monitor.getStats().totalRuns);
        
        // ================================================================
        // EJECUCIÓN AUTOMÁTICAMENTE MONITOREADA
        // El Orchestrator reporta automáticamente:
        // - startRun() al iniciar
        // - endRun(count) al finalizar exitosamente  
        // - recordError() si hay errores
        // ================================================================
        console.log('\n🚀 EJECUTANDO CICLO (Monitoreo automático activado...)');
        
        const result = await orchestrator.runIngestionCycle(
            'TWITTER', 
            'AI startup funding',
            {
                maxResults: 25,
                continueOnError: true
            }
        );
        
        // Estado después de la ejecución
        console.log('\n📈 ESTADO DESPUÉS DE EJECUCIÓN:');
        const stats = monitor.getStats();
        const metrics = monitor.getMetrics();
        
        console.log('Señales totales colectadas:', stats.totalSignalsCollected);
        console.log('Ejecuciones totales:', stats.totalRuns);
        console.log('Tasa de éxito:', metrics.successRate + '%');
        console.log('Estado de salud:', metrics.healthStatus);
        
        console.log('\n✅ RESULTADO DEL CICLO:');
        console.log(`- Fuente: ${result.source}`);
        console.log(`- Señales encontradas: ${result.signalsFound}`);
        console.log(`- Señales guardadas: ${result.signalsSaved}`);
        console.log(`- Éxito: ${result.success ? 'SÍ' : 'NO'}`);
        console.log(`- Duración: ${result.durationMs}ms`);

    } catch (error) {
        console.error('❌ Error en Demo 1:', error.message);
        
        // El error ya fue reportado automáticamente por el Orchestrator
        console.log('\n📊 MÉTRICAS DESPUÉS DEL ERROR:');
        const stats = RadarHealthMonitor.getInstance().getStats();
        console.log('Errores totales:', stats.errorsCount);
        console.log('Última actualización:', stats.lastUpdated);
    }
}

/**
 * DEMO 2: Monitoreo de múltiples ciclos automáticos
 * Muestra cómo el monitoreo se acumula automáticamente
 */
async function demo2_MultipleCyclesAutoMonitoring() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 DEMO 2: Múltiples Ciclos con Acumulación Automática de Métricas');
    console.log('='.repeat(80));

    try {
        const orchestrator = Orchestrator.getInstance();
        const monitor = RadarHealthMonitor.getInstance();
        
        const queries = [
            { source: 'TWITTER', query: 'machine learning trends' },
            { source: 'TIKTOK', query: 'tech startup life' },
            { source: 'TWITTER', query: 'venture capital 2024' }
        ];

        console.log('\n🚀 EJECUTANDO MÚLTIPLES CICLOS MONITOREADOS...');
        
        for (let i = 0; i < queries.length; i++) {
            const { source, query } = queries[i];
            
            console.log(`\n📡 Ejecutando ciclo ${i + 1}/3: ${source} - "${query}"`);
            
            // Cada ciclo se monitorea automáticamente
            const result = await orchestrator.runIngestionCycle(source, query, {
                maxResults: 15,
                continueOnError: true
            });
            
            // Ver métricas actualizadas automáticamente
            const stats = monitor.getStats();
            console.log(`   ✅ Guardadas: ${result.signalsSaved} | Total acumulado: ${stats.totalSignalsCollected}`);
            
            // Pausa breve entre ciclos
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Métricas finales acumuladas automáticamente
        console.log('\n📊 MÉTRICAS FINALES ACUMULADAS:');
        const finalStats = monitor.getStats();
        const finalMetrics = monitor.getMetrics();
        
        console.log('🎯 Estadísticas Generales:');
        console.log(`   - Total de ejecuciones: ${finalStats.totalRuns}`);
        console.log(`   - Señales totales colectadas: ${finalStats.totalSignalsCollected}`);
        console.log(`   - Errores totales: ${finalStats.errorsCount}`);
        
        console.log('\n📈 Métricas de Performance:');
        console.log(`   - Tasa de éxito: ${finalMetrics.successRate}%`);
        console.log(`   - Estado de salud: ${finalMetrics.healthStatus}`);
        console.log(`   - Tiempo de actividad: ${Math.round(finalMetrics.uptime / 1000)}s`);
        console.log(`   - Promedio señales/ejecución: ${finalMetrics.averageSignalsPerRun}`);

    } catch (error) {
        console.error('❌ Error en Demo 2:', error.message);
    }
}

/**
 * DEMO 3: Monitoreo automático de errores
 * Muestra cómo los errores se reportan automáticamente
 */
async function demo3_AutomaticErrorMonitoring() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 DEMO 3: Monitoreo Automático de Errores y Recuperación');
    console.log('='.repeat(80));

    try {
        const orchestrator = Orchestrator.getInstance();
        const monitor = RadarHealthMonitor.getInstance();

        // Estado antes de errores
        console.log('\n📊 ESTADO ANTES DE SIMULAR ERRORES:');
        let stats = monitor.getStats();
        console.log('Errores registrados:', stats.errorsCount);
        console.log('Tasa de éxito:', monitor.getMetrics().successRate + '%');

        // Simular una fuente inválida para generar error automático
        console.log('\n💥 SIMULANDO ERROR (fuente inválida)...');
        
        try {
            await orchestrator.runIngestionCycle(
                'INVALID_SOURCE',  // Esto causará un error
                'test query',
                { maxResults: 10 }
            );
        } catch (error) {
            console.log('✅ Error capturado correctamente:', error.message);
        }

        // El error fue reportado automáticamente al monitor
        console.log('\n📊 ESTADO DESPUÉS DEL ERROR (reportado automáticamente):');
        stats = monitor.getStats();
        const metrics = monitor.getMetrics();
        
        console.log('Errores registrados:', stats.errorsCount);
        console.log('Tasa de éxito:', metrics.successRate + '%');
        console.log('Estado de salud:', metrics.healthStatus);

        // Ejecutar un ciclo exitoso para mostrar recuperación
        console.log('\n🔄 EJECUTANDO CICLO EXITOSO PARA RECUPERACIÓN...');
        
        const recoveryResult = await orchestrator.runIngestionCycle(
            'TWITTER',
            'test recovery',
            { maxResults: 5 }
        );

        // Métricas después de recuperación
        console.log('\n📈 MÉTRICAS DESPUÉS DE RECUPERACIÓN:');
        const finalStats = monitor.getStats();
        const finalMetrics = monitor.getMetrics();
        
        console.log('Tasa de éxito actualizada:', finalMetrics.successRate + '%');
        console.log('Estado de salud:', finalMetrics.healthStatus);
        console.log('Total ejecuciones:', finalStats.totalRuns);
        console.log('Total errores:', finalStats.errorsCount);

    } catch (error) {
        console.error('❌ Error en Demo 3:', error.message);
    }
}

/**
 * DEMO 4: Dashboard en tiempo real con datos automáticos
 * Muestra el dashboard alimentado por datos automáticos del Orchestrator
 */
async function demo4_AutomaticRealtimeDashboard() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 DEMO 4: Dashboard Tiempo Real con Datos Automáticos del Orchestrator');
    console.log('='.repeat(80));

    try {
        const orchestrator = Orchestrator.getInstance();
        const monitor = RadarHealthMonitor.getInstance();

        console.log('\n🖥️ INICIANDO DASHBOARD TIEMPO REAL (datos automáticos)...');
        
        // Función de dashboard que se actualiza automáticamente
        const displayDashboard = () => {
            const stats = monitor.getStats();
            const metrics = monitor.getMetrics();
            
            console.clear();
            console.log('┌─────────────────────────────────────────────────────────────────────┐');
            console.log('│                    🎯 RADAR HEALTH MONITOR DASHBOARD                │');
            console.log('│                     (Alimentado automáticamente)                   │');
            console.log('├─────────────────────────────────────────────────────────────────────┤');
            console.log(`│ 🏥 Estado de Salud: ${metrics.healthStatus.padEnd(20)} │ 📊 Uptime: ${Math.round(metrics.uptime/1000)}s    │`);
            console.log(`│ ✅ Tasa de Éxito: ${metrics.successRate}%${' '.repeat(15)} │ 🔄 Runs: ${stats.totalRuns}        │`);
            console.log(`│ 📡 Señales Totales: ${stats.totalSignalsCollected.toString().padEnd(18)} │ ❌ Errores: ${stats.errorsCount}      │`);
            console.log(`│ ⚡ Promedio/Run: ${metrics.averageSignalsPerRun.toString().padEnd(20)} │ 🕒 Última: ${new Date(stats.lastUpdated).toLocaleTimeString()} │`);
            console.log('├─────────────────────────────────────────────────────────────────────┤');
            
            // Historial reciente (últimas 3 ejecuciones)
            const history = monitor.getExecutionHistory(3);
            console.log('│ 📈 HISTORIAL RECIENTE (automático):                                │');
            history.forEach((exec, i) => {
                const time = new Date(exec.timestamp).toLocaleTimeString();
                const status = exec.successful ? '✅' : '❌';
                console.log(`│   ${i+1}. ${time} | ${exec.source} | ${exec.signalsCollected} señales ${status}${''.padEnd(10)}│`);
            });
            
            console.log('└─────────────────────────────────────────────────────────────────────┘');
            console.log('🔄 Dashboard actualizándose automáticamente con datos del Orchestrator...\n');
        };

        // Mostrar dashboard inicial
        displayDashboard();

        // Ejecutar algunos ciclos mientras se actualiza el dashboard
        const testQueries = [
            { source: 'TWITTER', query: 'AI innovation' },
            { source: 'TIKTOK', query: 'startup culture' },
            { source: 'TWITTER', query: 'tech trends 2024' }
        ];

        for (let i = 0; i < testQueries.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { source, query } = testQueries[i];
            console.log(`\n🚀 Ejecutando: ${source} - "${query}"`);
            
            // Ejecutar ciclo (se monitorea automáticamente)
            await orchestrator.runIngestionCycle(source, query, { maxResults: 8 });
            
            // Dashboard se actualiza automáticamente con nuevos datos
            await new Promise(resolve => setTimeout(resolve, 1000));
            displayDashboard();
        }

        console.log('\n✅ Demo 4 completada. El dashboard se alimenta automáticamente del Orchestrator.');

    } catch (error) {
        console.error('❌ Error en Demo 4:', error.message);
    }
}

/**
 * DEMO 5: Reporte completo del sistema con datos automáticos
 */
async function demo5_AutomaticSystemReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 DEMO 5: Reporte Completo del Sistema (Datos Automáticos)');
    console.log('='.repeat(80));

    try {
        const orchestrator = Orchestrator.getInstance();
        
        console.log('\n📊 GENERANDO REPORTE COMPLETO DEL SISTEMA...');
        console.log('(Todos los datos son recolectados automáticamente por el Orchestrator)\n');
        
        // El reporte incluye todos los datos recolectados automáticamente
        const report = orchestrator.generateSystemReport();
        console.log(report);

        // También mostrar health check completo
        console.log('\n🏥 HEALTH CHECK COMPLETO:');
        const healthCheck = await orchestrator.healthCheck();
        
        console.log('📋 Estado de Componentes:');
        console.log(`   - Orchestrator: ${healthCheck.orchestrator ? '✅' : '❌'}`);
        console.log(`   - ConnectorFactory: ${healthCheck.connectorFactory ? '✅' : '❌'}`);
        console.log(`   - SignalRepository: ${healthCheck.signalRepository ? '✅' : '❌'}`);
        
        console.log('\n📊 Métricas del Health Monitor:');
        console.log(`   - Estado: ${healthCheck.details.healthMonitor.status}`);
        console.log(`   - Señales colectadas: ${healthCheck.details.healthMonitor.totalSignalsCollected}`);
        console.log(`   - Tasa de éxito: ${healthCheck.details.healthMonitor.successRate}%`);
        console.log(`   - Uptime: ${Math.round(healthCheck.details.healthMonitor.uptime / 1000)}s`);

    } catch (error) {
        console.error('❌ Error en Demo 5:', error.message);
    }
}

/**
 * EJECUTOR PRINCIPAL DE DEMOS
 */
async function runAllDemos() {
    console.log('🎬 INICIANDO DEMOSTRACIONES DEL ORCHESTRATOR CON MONITOREO SRE AUTOMÁTICO');
    console.log('=' .repeat(80));
    console.log('📋 Todas las métricas son recolectadas automáticamente sin código adicional');
    console.log('🔄 El Orchestrator reporta automáticamente: startRun, endRun, recordError');
    console.log('=' .repeat(80));

    try {
        // Ejecutar todas las demos en secuencia
        await demo1_BasicCycleWithAutoMonitoring();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await demo2_MultipleCyclesAutoMonitoring();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await demo3_AutomaticErrorMonitoring();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await demo4_AutomaticRealtimeDashboard();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await demo5_AutomaticSystemReport();

        console.log('\n' + '='.repeat(80));
        console.log('🎉 TODAS LAS DEMOSTRACIONES COMPLETADAS EXITOSAMENTE');
        console.log('='.repeat(80));
        console.log('✅ El Orchestrator ahora tiene monitoreo SRE completamente automático');
        console.log('📊 Todos los datos son recolectados sin código adicional');
        console.log('🔄 Observabilidad completa del sistema RADAR habilitada');
        console.log('='.repeat(80));

    } catch (error) {
        console.error('\n💥 Error ejecutando demos:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runAllDemos().catch(console.error);
}

module.exports = {
    runAllDemos,
    demo1_BasicCycleWithAutoMonitoring,
    demo2_MultipleCyclesAutoMonitoring,
    demo3_AutomaticErrorMonitoring,
    demo4_AutomaticRealtimeDashboard,
    demo5_AutomaticSystemReport
};