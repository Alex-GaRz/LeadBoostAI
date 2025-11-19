/**
 * ===============================================================================
 * CORRELATION ENGINE - BLOQUE 3: ANALISTA INTELLIGENCE
 * ===============================================================================
 * 
 * Motor de Correlación Temporal que analiza relaciones causa-efecto entre tópicos
 * utilizando análisis de series de tiempo y detección de desfase (lag analysis).
 * 
 * Características:
 * - Correlación de Pearson para relaciones lineales
 * - Detección de lag óptimo (lead indicators)
 * - Análisis de series temporales agregadas
 * - Interpretación automática de patrones
 * 
 * @author LeadBoostAI Backend Team
 * @version 1.0.0 - Bloque 3: Analista Intelligence
 */

const { SignalRepository } = require('../../repositories/SignalRepository');

/**
 * Motor de Correlación Temporal (Bloque 3)
 * Detecta patrones de desfase (lag) entre dos tópicos o fuentes.
 * 
 * Ejemplo de uso: ¿Hablar de "inflación" precede a "bajas ventas"?
 */
class CorrelationEngine {
  constructor() {
    this.signalRepository = null;
    
    // Cache para consultas frecuentes
    this.timeSeriesCache = new Map();
    this.cacheExpiration = 30 * 60 * 1000; // 30 minutos
    
    // Estadísticas del motor
    this.stats = {
      totalAnalyses: 0,
      cacheHits: 0,
      averageAnalysisTime: 0,
      topCorrelations: []
    };
    
    console.log('[CorrelationEngine] 📊 Motor de correlación temporal inicializado');
  }

  /**
   * Inicialización lazy de dependencias
   */
  initializeDependencies() {
    if (!this.signalRepository) {
      const { SignalRepository } = require('../../repositories/SignalRepository');
      this.signalRepository = new SignalRepository();
    }
  }

  /**
   * Analiza la correlación temporal entre dos tópicos.
   * @param {string} topicA - Primer término/tópico
   * @param {string} topicB - Segundo término/tópico  
   * @param {string} timeframe - '24h', '7d', '30d'
   * @param {Object} options - Opciones avanzadas (granularity, sources, etc.)
   */
  async analyzeCorrelations(topicA, topicB, timeframe = '7d', options = {}) {
    const analysisStartTime = Date.now();
    this.stats.totalAnalyses++;
    
    // Inicializar dependencias si no están disponibles
    this.initializeDependencies();
    
    console.log(`[CorrelationEngine] 📊 Análisis: "${topicA}" vs "${topicB}" (${timeframe})`);

    try {
      // 1. Validar entrada
      if (!topicA || !topicB || topicA.trim() === '' || topicB.trim() === '') {
        throw new Error('Ambos tópicos son requeridos');
      }

      if (topicA.toLowerCase() === topicB.toLowerCase()) {
        throw new Error('Los tópicos deben ser diferentes');
      }

      // 2. Obtener series de tiempo para ambos tópicos
      console.log('[CorrelationEngine] 📚 Obteniendo series temporales...');
      
      const [seriesA, seriesB] = await Promise.all([
        this.getTimeSeriesForTopic(topicA, timeframe, options),
        this.getTimeSeriesForTopic(topicB, timeframe, options)
      ]);

      // 3. Validar que tenemos suficientes datos
      if (seriesA.length < 3 || seriesB.length < 3) {
        return {
          error: "Insuficientes datos para correlación significativa",
          topic_a: topicA,
          topic_b: topicB,
          timeframe,
          data_points_a: seriesA.length,
          data_points_b: seriesB.length,
          minimum_required: 3
        };
      }

      // 4. Alinear series temporales (asegurar mismos timestamps)
      console.log('[CorrelationEngine] ⚡ Alineando series temporales...');
      const alignedData = this.alignSeries(seriesA, seriesB);
      
      if (alignedData.valuesA.length < 5) {
        return {
          error: "Insuficientes puntos de datos alineados para correlación significativa",
          topic_a: topicA,
          topic_b: topicB,
          timeframe,
          aligned_points: alignedData.valuesA.length,
          minimum_required: 5
        };
      }

      // 5. Calcular correlación base (sin desfase)
      console.log('[CorrelationEngine] 🧮 Calculando correlación base...');
      const baseCorrelation = this.calculatePearsonCorrelation(alignedData.valuesA, alignedData.valuesB);

      // 6. Detectar lag óptimo (desfase que maximiza correlación)
      console.log('[CorrelationEngine] 🔍 Detectando lag óptimo...');
      const lagAnalysis = this.detectOptimalLag(alignedData.valuesA, alignedData.valuesB, options.maxLag || 5);

      // 7. Calcular métricas adicionales
      const statisticalSignificance = this.calculateSignificance(lagAnalysis.correlation, alignedData.valuesA.length);
      const volatilityMetrics = this.calculateVolatilityMetrics(alignedData.valuesA, alignedData.valuesB);

      // 8. Generar interpretación
      const interpretation = this.generateInterpretation(lagAnalysis, baseCorrelation, topicA, topicB);

      // 9. Actualizar estadísticas
      const analysisTime = Date.now() - analysisStartTime;
      this.updateAnalysisStats(analysisTime, lagAnalysis.correlation);

      const result = {
        analysis_id: `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        topic_a: topicA,
        topic_b: topicB,
        timeframe,
        analysis_timestamp: new Date().toISOString(),
        
        // Correlación principal
        base_correlation: {
          value: baseCorrelation,
          strength: this.classifyCorrelationStrength(baseCorrelation),
          description: "Correlación directa sin desfase temporal"
        },
        
        // Análisis de lag
        lag_analysis: {
          optimal_lag_hours: lagAnalysis.lag,
          optimal_correlation: lagAnalysis.correlation,
          improvement_over_base: lagAnalysis.correlation - baseCorrelation,
          interpretation: interpretation.lagInterpretation,
          significance: statisticalSignificance
        },
        
        // Métricas adicionales
        data_quality: {
          data_points: alignedData.timestamps.length,
          timespan_hours: this.calculateTimespanHours(alignedData.timestamps),
          completeness_score: this.calculateCompletenessScore(seriesA, seriesB, timeframe),
          volatility_a: volatilityMetrics.volatilityA,
          volatility_b: volatilityMetrics.volatilityB
        },
        
        // Interpretación general
        business_interpretation: interpretation.businessInterpretation,
        confidence_level: this.calculateConfidenceLevel(lagAnalysis.correlation, alignedData.valuesA.length),
        
        // Metadatos técnicos
        technical_details: {
          analysis_time_ms: analysisTime,
          cache_hit: false, // TODO: Implementar cache
          algorithm_version: "1.0.0"
        }
      };

      console.log(`[CorrelationEngine] ✅ Análisis completado en ${analysisTime}ms`);
      console.log(`[CorrelationEngine] 📈 Correlación: ${lagAnalysis.correlation.toFixed(3)} (lag: ${lagAnalysis.lag}h)`);

      return result;

    } catch (error) {
      console.error('[CorrelationEngine] ❌ Error en análisis de correlación:', error);
      throw error;
    }
  }

  /**
   * Obtiene serie temporal para un tópico específico.
   * @param {string} topic - Tópico a analizar
   * @param {string} timeframe - Marco temporal
   * @param {Object} options - Opciones de consulta
   */
  async getTimeSeriesForTopic(topic, timeframe, options = {}) {
    try {
      // 1. Calcular rango de fechas
      const { startDate, endDate } = this.calculateDateRange(timeframe);
      
      console.log(`[CorrelationEngine] 🕐 Obteniendo datos para "${topic}" desde ${startDate.toISOString()} hasta ${endDate.toISOString()}`);

      // 2. Consultar señales en el rango
      const queryOptions = {
        limit: 1000, // Límite alto para análisis temporal
        startDate,
        endDate,
        orderBy: { field: 'created_at', direction: 'asc' }
      };

      // Aplicar filtros adicionales si se especifican
      if (options.sources) queryOptions.sources = options.sources;
      if (options.sentiment) queryOptions.sentiment = options.sentiment;

      const signalsResult = await this.signalRepository.querySignals(queryOptions);

      if (!signalsResult.success || !signalsResult.data) {
        console.warn(`[CorrelationEngine] ⚠️ No se obtuvieron datos para ${topic}`);
        return [];
      }

      // 3. Filtrar señales por tópico
      const topicLower = topic.toLowerCase();
      const filtered = signalsResult.data.filter(signal => {
        // Buscar en contenido limpio
        const content = (signal.cleanContent || signal.content || '').toLowerCase();
        const hasInContent = content.includes(topicLower);
        
        // Buscar en keywords del análisis IA
        const keywords = (signal.analysis?.keywords || []).map(k => k.toLowerCase());
        const hasInKeywords = keywords.some(keyword => 
          keyword.includes(topicLower) || topicLower.includes(keyword)
        );
        
        return hasInContent || hasInKeywords;
      });

      console.log(`[CorrelationEngine] 🎯 Señales filtradas para "${topic}": ${filtered.length}/${signalsResult.data.length}`);

      // 4. Agrupar por granularidad temporal
      const granularity = options.granularity || this.getDefaultGranularity(timeframe);
      const groupedData = this.groupByTimeGranularity(filtered, granularity);

      return groupedData;

    } catch (error) {
      console.error(`[CorrelationEngine] ❌ Error obteniendo serie para ${topic}:`, error);
      return [];
    }
  }

  /**
   * Calcula rango de fechas basado en el timeframe.
   * @param {string} timeframe - '24h', '7d', '30d'
   */
  calculateDateRange(timeframe) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '24h':
        startDate.setHours(endDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7); // Default a 7 días
    }
    
    return { startDate, endDate };
  }

  /**
   * Determina granularidad por defecto basada en el timeframe.
   * @param {string} timeframe - Marco temporal
   */
  getDefaultGranularity(timeframe) {
    switch (timeframe) {
      case '24h': return 'hour';
      case '7d': return 'hour';
      case '30d': return 'day';
      case '3m': return 'day';
      default: return 'hour';
    }
  }

  /**
   * Agrupa señales por granularidad temporal.
   * @param {Array} signals - Señales filtradas
   * @param {string} granularity - 'hour', 'day', 'week'
   */
  groupByTimeGranularity(signals, granularity) {
    const timeMap = new Map();

    signals.forEach(signal => {
      // Obtener timestamp de la señal
      const timestamp = new Date(signal.created_at || signal.timestamp || signal.ingested_at);
      
      // Normalizar según granularidad
      let key;
      switch (granularity) {
        case 'hour':
          timestamp.setMinutes(0, 0, 0);
          key = timestamp.toISOString();
          break;
        case 'day':
          timestamp.setHours(0, 0, 0, 0);
          key = timestamp.toISOString();
          break;
        case 'week':
          // Normalizar al lunes de la semana
          const dayOfWeek = timestamp.getDay();
          const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
          timestamp.setDate(timestamp.getDate() - daysToMonday);
          timestamp.setHours(0, 0, 0, 0);
          key = timestamp.toISOString();
          break;
        default:
          timestamp.setMinutes(0, 0, 0);
          key = timestamp.toISOString();
      }

      // Incrementar contador para este período
      const currentCount = timeMap.get(key) || 0;
      timeMap.set(key, currentCount + 1);
    });

    // Convertir a array ordenado
    return Array.from(timeMap.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  /**
   * Alinea dos series temporales para tener los mismos timestamps.
   * @param {Array} seriesA - Serie temporal A
   * @param {Array} seriesB - Serie temporal B
   */
  alignSeries(seriesA, seriesB) {
    // 1. Crear set de todos los timestamps únicos
    const allTimes = new Set([
      ...seriesA.map(point => point.time), 
      ...seriesB.map(point => point.time)
    ]);
    
    const sortedTimes = Array.from(allTimes).sort();

    // 2. Llenar series alineadas (rellenar huecos con 0)
    const valuesA = [];
    const valuesB = [];

    sortedTimes.forEach(time => {
      const pointA = seriesA.find(point => point.time === time);
      const pointB = seriesB.find(point => point.time === time);
      
      valuesA.push(pointA ? pointA.count : 0);
      valuesB.push(pointB ? pointB.count : 0);
    });

    return { 
      timestamps: sortedTimes, 
      valuesA, 
      valuesB 
    };
  }

  /**
   * Calcula la correlación de Pearson entre dos series.
   * @param {number[]} x - Serie X
   * @param {number[]} y - Serie Y  
   */
  calculatePearsonCorrelation(x, y) {
    const n = x.length;
    if (n === 0 || n !== y.length) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - sumX * sumX) * ((n * sumY2) - sumY * sumY));

    if (denominator === 0) return 0;
    
    return numerator / denominator;
  }

  /**
   * Detecta el lag óptimo que maximiza la correlación.
   * @param {number[]} source - Serie fuente (variable independiente)
   * @param {number[]} target - Serie objetivo (variable dependiente)
   * @param {number} maxLag - Máximo lag a probar en períodos
   */
  detectOptimalLag(source, target, maxLag = 5) {
    let bestCorrelation = -1;
    let bestLag = 0;

    // Probar desfases desde 0 hasta maxLag
    for (let lag = 0; lag <= maxLag; lag++) {
      if (lag >= source.length) break;
      
      // Crear subseries desplazadas
      // lag=1 significa: source[t] vs target[t+1]
      const laggedSource = source.slice(0, source.length - lag);
      const laggedTarget = target.slice(lag);
      
      if (laggedSource.length < 3) break; // Necesitamos al menos 3 puntos
      
      const correlation = this.calculatePearsonCorrelation(laggedSource, laggedTarget);
      
      if (Math.abs(correlation) > Math.abs(bestCorrelation)) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    return { lag: bestLag, correlation: bestCorrelation };
  }

  /**
   * Genera interpretación de los resultados.
   * @param {Object} lagAnalysis - Resultado del análisis de lag
   * @param {number} baseCorrelation - Correlación sin desfase
   * @param {string} topicA - Tópico A
   * @param {string} topicB - Tópico B
   */
  generateInterpretation(lagAnalysis, baseCorrelation, topicA, topicB) {
    const { lag, correlation } = lagAnalysis;
    
    let lagInterpretation;
    if (Math.abs(correlation) < 0.3) {
      lagInterpretation = `No se detecta relación significativa entre "${topicA}" y "${topicB}"`;
    } else if (lag === 0) {
      lagInterpretation = `"${topicA}" y "${topicB}" muestran correlación simultánea (ocurren al mismo tiempo)`;
    } else {
      const hours = lag === 1 ? 'hora' : 'horas';
      lagInterpretation = `"${topicA}" actúa como indicador adelantado de "${topicB}" con aproximadamente ${lag} ${hours} de anticipación`;
    }

    let businessInterpretation;
    if (Math.abs(correlation) >= 0.7) {
      businessInterpretation = "Relación muy fuerte - Alta confianza para estrategias predictivas";
    } else if (Math.abs(correlation) >= 0.5) {
      businessInterpretation = "Relación moderada - Útil para alertas tempranas";
    } else if (Math.abs(correlation) >= 0.3) {
      businessInterpretation = "Relación débil - Requiere validación con más datos";
    } else {
      businessInterpretation = "Sin relación aparente - No recomendado para predicción";
    }

    return { lagInterpretation, businessInterpretation };
  }

  /**
   * Clasifica la fuerza de la correlación.
   * @param {number} correlation - Valor de correlación
   */
  classifyCorrelationStrength(correlation) {
    const abs = Math.abs(correlation);
    if (abs >= 0.7) return 'muy fuerte';
    if (abs >= 0.5) return 'moderada';
    if (abs >= 0.3) return 'débil';
    return 'inexistente';
  }

  /**
   * Calcula significancia estadística.
   * @param {number} correlation - Correlación
   * @param {number} sampleSize - Tamaño de muestra
   */
  calculateSignificance(correlation, sampleSize) {
    if (sampleSize < 5) return 'insuficiente';
    
    // Test t simplificado
    const t = Math.abs(correlation) * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    
    if (t > 2.776) return 'alta'; // p < 0.01
    if (t > 2.0) return 'moderada'; // p < 0.05
    return 'baja';
  }

  /**
   * Calcula métricas de volatilidad.
   * @param {number[]} seriesA - Serie A
   * @param {number[]} seriesB - Serie B
   */
  calculateVolatilityMetrics(seriesA, seriesB) {
    const calculateStdDev = (arr) => {
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
      return Math.sqrt(variance);
    };

    return {
      volatilityA: calculateStdDev(seriesA),
      volatilityB: calculateStdDev(seriesB)
    };
  }

  /**
   * Calcula completitud de los datos.
   * @param {Array} seriesA - Serie A
   * @param {Array} seriesB - Serie B  
   * @param {string} timeframe - Marco temporal
   */
  calculateCompletenessScore(seriesA, seriesB, timeframe) {
    // Calcular períodos esperados según timeframe
    let expectedPeriods;
    switch (timeframe) {
      case '24h': expectedPeriods = 24; break;
      case '7d': expectedPeriods = 168; break; // 7 * 24 horas
      case '30d': expectedPeriods = 30; break; // 30 días
      default: expectedPeriods = 168;
    }

    const actualPeriods = Math.max(seriesA.length, seriesB.length);
    return Math.min(100, (actualPeriods / expectedPeriods) * 100);
  }

  /**
   * Calcula timespan en horas.
   * @param {string[]} timestamps - Array de timestamps
   */
  calculateTimespanHours(timestamps) {
    if (timestamps.length < 2) return 0;
    
    const start = new Date(timestamps[0]);
    const end = new Date(timestamps[timestamps.length - 1]);
    
    return (end - start) / (1000 * 60 * 60); // Convertir a horas
  }

  /**
   * Calcula nivel de confianza.
   * @param {number} correlation - Correlación
   * @param {number} sampleSize - Tamaño de muestra
   */
  calculateConfidenceLevel(correlation, sampleSize) {
    const abs = Math.abs(correlation);
    if (sampleSize < 10) return 'bajo';
    if (abs >= 0.7 && sampleSize >= 20) return 'alto';
    if (abs >= 0.5 && sampleSize >= 15) return 'moderado';
    return 'bajo';
  }

  /**
   * Actualiza estadísticas del motor.
   * @param {number} analysisTime - Tiempo de análisis
   * @param {number} correlation - Correlación encontrada
   */
  updateAnalysisStats(analysisTime, correlation) {
    // Promedio móvil del tiempo de análisis
    this.stats.averageAnalysisTime = this.stats.totalAnalyses === 1 
      ? analysisTime 
      : (this.stats.averageAnalysisTime + analysisTime) / 2;

    // Mantener top correlaciones (máximo 10)
    this.stats.topCorrelations.push({
      correlation,
      timestamp: new Date().toISOString()
    });

    this.stats.topCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    this.stats.topCorrelations = this.stats.topCorrelations.slice(0, 10);
  }

  /**
   * Obtiene estadísticas del motor.
   */
  getStats() {
    return {
      ...this.stats,
      cache_size: this.timeSeriesCache.size,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Resetea estadísticas del motor.
   */
  resetStats() {
    this.stats = {
      totalAnalyses: 0,
      cacheHits: 0,
      averageAnalysisTime: 0,
      topCorrelations: []
    };
    this.timeSeriesCache.clear();
    console.log('[CorrelationEngine] 📊 Estadísticas reseteadas');
  }
}

module.exports = { CorrelationEngine };