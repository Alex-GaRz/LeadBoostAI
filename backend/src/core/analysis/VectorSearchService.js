/**
 * ===============================================================================
 * VECTOR SEARCH SERVICE - BLOQUE 3: ANALISTA INTELLIGENCE
 * ===============================================================================
 * 
 * Servicio de Búsqueda Semántica que utiliza los embeddings del Bloque 2
 * para realizar búsquedas por significado utilizando similitud de cosenos.
 * 
 * Características:
 * - Integración con EmbeddingService (Bloque 2)
 * - Matemáticas vectoriales para similitud semántica  
 * - Búsqueda en Firebase con re-ranking por relevancia
 * - Preparado para migración a Pinecone (Enterprise)
 * 
 * @author LeadBoostAI Backend Team
 * @version 1.0.0 - Bloque 3: Analista Intelligence
 */

const { SignalRepository } = require('../../repositories/SignalRepository');
const EmbeddingService = require('../processing/EmbeddingService');

/**
 * Servicio de Búsqueda Semántica (Bloque 3)
 * Realiza búsquedas por significado utilizando similitud de cosenos sobre vectores.
 */
class VectorSearchService {
  constructor() {
    this.signalRepository = null;
    this.embeddingService = null;
    
    // Estadísticas del servicio
    this.stats = {
      totalSearches: 0,
      totalVectorComparisons: 0,
      averageSearchTime: 0,
      cacheHits: 0
    };
    
    console.log('[VectorSearchService] 🧠 Servicio de búsqueda semántica inicializado');
  }

  /**
   * Inicialización lazy de dependencias
   */
  initializeDependencies() {
    if (!this.signalRepository) {
      const { SignalRepository } = require('../../repositories/SignalRepository');
      this.signalRepository = new SignalRepository();
    }
    if (!this.embeddingService) {
      const EmbeddingService = require('../processing/EmbeddingService');
      this.embeddingService = EmbeddingService.getInstance();
    }
  }

  /**
   * Busca señales semánticamente similares a un texto de consulta.
   * @param {string} queryText - Texto a buscar (ej: "gente enojada con el servicio")
   * @param {number} limit - Límite de resultados (default: 10)
   * @param {number} threshold - Umbral mínimo de similitud 0-1 (default: 0.4)
   * @param {Object} filters - Filtros adicionales (source, sentiment, timeframe)
   * @returns {Array} Array de señales ordenadas por relevancia semántica
   */
  async searchByMeaning(queryText, limit = 10, threshold = 0.4, filters = {}) {
    const searchStartTime = Date.now();
    this.stats.totalSearches++;
    
    // Inicializar dependencias si no están disponibles
    this.initializeDependencies();
    
    console.log(`[VectorSearchService] 🔍 Búsqueda semántica: "${queryText}"`);
    console.log(`[VectorSearchService] 📊 Parámetros: limit=${limit}, threshold=${threshold}`);

    try {
      // 1. Validar entrada
      if (!queryText || typeof queryText !== 'string' || queryText.trim().length === 0) {
        throw new Error('Query text no puede estar vacío');
      }

      // 2. Generar embedding para la consulta usando el mismo servicio del Bloque 2
      console.log('[VectorSearchService] 🧮 Generando embedding de consulta...');
      const queryVector = await this.embeddingService.generateEmbedding(queryText.trim());

      if (!queryVector || queryVector.length === 0) {
        throw new Error('No se pudo generar el vector para la consulta');
      }

      console.log(`[VectorSearchService] ✅ Vector de consulta: ${queryVector.length} dimensiones`);

      // 3. Obtener candidatos de la base de datos
      console.log('[VectorSearchService] 📚 Obteniendo candidatos de Firebase...');
      const candidateLimit = Math.max(200, limit * 10); // Pool más grande para re-ranking
      
      const queryOptions = {
        limit: candidateLimit,
        orderBy: { field: 'created_at', direction: 'desc' }
      };

      // Aplicar filtros si se proporcionan
      if (filters.source) queryOptions.source = filters.source;
      if (filters.sentiment) queryOptions.sentiment = filters.sentiment;
      if (filters.startDate) queryOptions.startDate = filters.startDate;
      if (filters.endDate) queryOptions.endDate = filters.endDate;

      const signalsResult = await this.signalRepository.querySignals(queryOptions);

      if (!signalsResult.success || !signalsResult.data) {
        console.warn('[VectorSearchService] ⚠️ No se obtuvieron candidatos de la base de datos');
        return [];
      }

      // 4. Filtrar solo señales que tengan embeddings
      const candidates = signalsResult.data.filter(signal => {
        return signal.embedding && 
               Array.isArray(signal.embedding) && 
               signal.embedding.length > 0;
      });

      console.log(`[VectorSearchService] 🎯 Candidatos con embeddings: ${candidates.length}/${signalsResult.data.length}`);

      if (candidates.length === 0) {
        console.warn('[VectorSearchService] ⚠️ No hay señales con embeddings para comparar');
        return [];
      }

      // 5. Calcular similitud y rankear
      console.log('[VectorSearchService] ⚡ Calculando similitudes...');
      const scoredSignals = candidates.map(signal => {
        const similarity = this.calculateCosineSimilarity(queryVector, signal.embedding);
        this.stats.totalVectorComparisons++;
        
        return {
          ...signal,
          search_score: similarity,
          search_metadata: {
            query: queryText,
            similarity: similarity,
            vector_dimensions: signal.embedding.length,
            search_timestamp: new Date().toISOString()
          }
        };
      });

      // 6. Filtrar por umbral y ordenar por relevancia
      const results = scoredSignals
        .filter(signal => signal.search_score >= threshold)
        .sort((a, b) => b.search_score - a.search_score)
        .slice(0, limit);

      // 7. Agregar información de ranking
      const rankedResults = results.map((result, index) => ({
        ...result,
        search_rank: index + 1,
        search_percentile: ((results.length - index) / results.length * 100).toFixed(1)
      }));

      // 8. Actualizar estadísticas
      const searchTime = Date.now() - searchStartTime;
      this.updateSearchStats(searchTime);

      console.log(`[VectorSearchService] ✅ Búsqueda completada en ${searchTime}ms`);
      console.log(`[VectorSearchService] 📈 Resultados: ${rankedResults.length} señales relevantes`);
      
      // Log de top resultados para debugging
      if (rankedResults.length > 0) {
        console.log(`[VectorSearchService] 🏆 Top resultado: ${rankedResults[0].search_score.toFixed(3)} - "${rankedResults[0].cleanContent?.substring(0, 100)}..."`);
      }

      return rankedResults;

    } catch (error) {
      console.error('[VectorSearchService] ❌ Error en búsqueda semántica:', error);
      throw error;
    }
  }

  /**
   * Encuentra señales similares a una señal específica (por ID).
   * Útil para "más como esta" o análisis de clusters.
   * @param {string} signalId - ID de la señal de referencia
   * @param {number} limit - Número de resultados similares
   * @param {number} threshold - Umbral de similitud
   */
  async findSimilar(signalId, limit = 5, threshold = 0.5) {
    console.log(`[VectorSearchService] 🔗 Buscando similares a señal: ${signalId}`);

    try {
      // 1. Obtener la señal de referencia
      const referenceSignalResult = await this.signalRepository.querySignals({
        limit: 1,
        // Aquí necesitarías un método específico para buscar por ID
        // Por simplicidad, usaremos el contenido como proxy
      });

      if (!referenceSignalResult.success || !referenceSignalResult.data[0]) {
        throw new Error('Señal de referencia no encontrada');
      }

      const referenceSignal = referenceSignalResult.data[0];
      
      if (!referenceSignal.embedding) {
        throw new Error('La señal de referencia no tiene embedding');
      }

      // 2. Usar el embedding de la señal de referencia para buscar similares
      return await this.searchByVector(referenceSignal.embedding, limit, threshold, {
        excludeId: signalId // Excluir la señal original
      });

    } catch (error) {
      console.error('[VectorSearchService] ❌ Error buscando similares:', error);
      throw error;
    }
  }

  /**
   * Búsqueda directa por vector (para uso interno).
   * @param {number[]} queryVector - Vector de consulta
   * @param {number} limit - Límite de resultados
   * @param {number} threshold - Umbral de similitud
   * @param {Object} options - Opciones adicionales
   */
  async searchByVector(queryVector, limit = 10, threshold = 0.4, options = {}) {
    try {
      // Obtener candidatos
      const signalsResult = await this.signalRepository.querySignals({
        limit: 200,
        orderBy: { field: 'created_at', direction: 'desc' }
      });

      if (!signalsResult.success) return [];

      // Filtrar y puntuar
      const candidates = signalsResult.data.filter(signal => {
        if (!signal.embedding || !Array.isArray(signal.embedding)) return false;
        if (options.excludeId && signal.id === options.excludeId) return false;
        return true;
      });

      const scoredSignals = candidates.map(signal => ({
        ...signal,
        search_score: this.calculateCosineSimilarity(queryVector, signal.embedding)
      }));

      return scoredSignals
        .filter(s => s.search_score >= threshold)
        .sort((a, b) => b.search_score - a.search_score)
        .slice(0, limit);

    } catch (error) {
      console.error('[VectorSearchService] ❌ Error en búsqueda por vector:', error);
      throw error;
    }
  }

  /**
   * Calcula la similitud coseno entre dos vectores.
   * Métrica estándar para comparar embeddings en el mismo espacio latente.
   * @param {number[]} vecA - Vector A 
   * @param {number[]} vecB - Vector B
   * @returns {number} Similitud (-1 a 1, donde 1 = idénticos)
   */
  calculateCosineSimilarity(vecA, vecB) {
    // Validar dimensiones
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      console.warn('[VectorSearchService] ⚠️ Vectores con dimensiones incompatibles');
      return 0;
    }

    if (vecA.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // Calcular producto punto y normas
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    // Evitar división por cero
    if (normA === 0 || normB === 0) {
      return 0;
    }

    // Similitud coseno = cos(θ) = (A·B) / (||A|| * ||B||)
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

    // Asegurar que está en el rango válido [-1, 1]
    return Math.max(-1, Math.min(1, similarity));
  }

  /**
   * Realiza múltiples búsquedas semánticas en paralelo.
   * Útil para análisis comparativo de diferentes queries.
   * @param {string[]} queries - Array de textos de consulta
   * @param {number} limit - Límite por consulta
   * @param {number} threshold - Umbral de similitud
   */
  async batchSearch(queries, limit = 5, threshold = 0.4) {
    console.log(`[VectorSearchService] 📦 Búsqueda en lote: ${queries.length} consultas`);

    try {
      const promises = queries.map(async (query, index) => {
        try {
          const results = await this.searchByMeaning(query, limit, threshold);
          return {
            query,
            index,
            success: true,
            results: results,
            count: results.length
          };
        } catch (error) {
          return {
            query,
            index,
            success: false,
            error: error.message,
            results: []
          };
        }
      });

      const batchResults = await Promise.all(promises);
      
      console.log(`[VectorSearchService] ✅ Búsqueda en lote completada`);
      return {
        total_queries: queries.length,
        successful_queries: batchResults.filter(r => r.success).length,
        results: batchResults
      };

    } catch (error) {
      console.error('[VectorSearchService] ❌ Error en búsqueda en lote:', error);
      throw error;
    }
  }

  /**
   * Actualiza estadísticas del servicio.
   * @param {number} searchTime - Tiempo de búsqueda en ms
   */
  updateSearchStats(searchTime) {
    // Promedio móvil simple para tiempo de búsqueda
    this.stats.averageSearchTime = this.stats.totalSearches === 1 
      ? searchTime 
      : (this.stats.averageSearchTime + searchTime) / 2;
  }

  /**
   * Obtiene estadísticas del servicio.
   * @returns {Object} Estadísticas de rendimiento
   */
  getStats() {
    return {
      ...this.stats,
      embedding_service_ready: this.embeddingService.isReady(),
      embedding_service_stats: this.embeddingService.getStats(),
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Resetea estadísticas del servicio.
   */
  resetStats() {
    this.stats = {
      totalSearches: 0,
      totalVectorComparisons: 0,
      averageSearchTime: 0,
      cacheHits: 0
    };
    console.log('[VectorSearchService] 📊 Estadísticas reseteadas');
  }
}

module.exports = { VectorSearchService };