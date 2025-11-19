/**
 * ===============================================================================
 * SIGNAL REPOSITORY - CLEAN ARCHITECTURE PERSISTENCE LAYER
 * ===============================================================================
 * 
 * Repositorio para persistencia de UniversalSignal en Firebase Firestore.
 * Implementa principios de Clean Architecture separando lógica de base de datos
 * de la lógica de negocio.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

/**
 * Tipos documentados para JSDoc (en JavaScript no se usan interfaces)
 * 
 * @typedef {Object} RepositoryResult
 * @property {boolean} success
 * @property {*} [data]
 * @property {string} [error]
 * @property {Object} [metadata]
 * @property {string} metadata.operation
 * @property {Date} metadata.timestamp
 * @property {string} [metadata.documentId]
 * @property {boolean} [metadata.wasUpdated]
 * 
 * @typedef {Object} SignalQueryOptions
 * @property {string} [source]
 * @property {Object} [dateRange]
 * @property {Date} dateRange.from
 * @property {Date} dateRange.to
 * @property {number} [limit]
 * @property {number} [offset]
 * @property {Object} [orderBy]
 * @property {string} orderBy.field
 * @property {string} orderBy.direction - 'asc' o 'desc'
 * @property {Array} [filters]
 */

/**
 * Repository para gestionar UniversalSignal en Firebase Firestore.
 * Implementa patrones de Clean Architecture para separar persistencia de lógica.
 */
class SignalRepository {
  constructor() {
    this.db = admin.firestore();
    this.COLLECTION_NAME = 'universal_signals';
    this.initialized = false;
  }

  /**
   * Genera un ID determinista para evitar duplicados en Firestore.
   * Basado en source + original_url + created_at para máxima unicidad.
   * 
   * @param {Object} signal - El signal del cual generar el ID
   * @returns {string} ID determinista MD5
   */
  generateDeterministicId(signal) {
    // Extraer ID original de la fuente (si existe en raw_metadata)
    const originalId = this.extractOriginalId(signal);
    
    // Asegurar fecha válida para el ID
    const dateForId = signal.created_at || signal.timestamp || new Date();
    const dateString = dateForId instanceof Date ? dateForId.toISOString() : new Date(dateForId).toISOString();
    
    // Crear string único basado en fuente, URL original y timestamp
    const uniqueString = [
      signal.source || 'unknown_source',
      signal.original_url || signal.url || 'no_url',
      originalId || dateString,
    ].join('|');

    // Generar hash MD5 determinista
    return crypto.createHash('md5').update(uniqueString).digest('hex');
  }

  /**
   * Extrae el ID original de la plataforma fuente desde raw_metadata.
   * Cada adaptador debe incluir el ID original en raw_metadata.
   * 
   * @param {Object} signal - El signal con raw_metadata
   * @returns {string|null} ID original de la plataforma o null
   */
  extractOriginalId(signal) {
    const rawData = signal.raw_metadata || {};

    // IDs según plataforma
    const platformIds = {
      twitter: rawData.id_str || rawData.id,
      tiktok: rawData.id,
      youtube: rawData.id,
      news_api: rawData.url,
      google_trends: rawData.query,
      instagram: rawData.id,
      linkedin: rawData.id,
      reddit: rawData.id,
      rss_feed: rawData.guid || rawData.link,
      web_scraping: rawData.url,
    };

    return platformIds[signal.source] || null;
  }

  /**
   * Inicializa el repositorio y verifica la conexión con Firebase
   */
  async initialize() {
    try {
      if (this.initialized) {
        console.log('[SignalRepository] ℹ️ Already initialized');
        return true;
      }

      // Realizar un health check para verificar conectividad
      await this.healthCheck();
      
      this.initialized = true;
      console.log('[SignalRepository] ✅ Repository initialized successfully');
      
      return true;
      
    } catch (error) {
      console.error('[SignalRepository] ❌ Initialization failed:', error.message);
      throw new Error(`SignalRepository initialization failed: ${error.message}`);
    }
  }

  /**
   * Convierte UniversalSignal a formato Firestore-compatible.
   * Firestore no soporta Date objects directamente, necesita Timestamps.
   * 
   * @param {Object} signal - Signal a convertir
   * @returns {Object} Objeto compatible con Firestore
   */
  toFirestoreFormat(signal) {
    // Asegurar fechas válidas con valores por defecto
    const now = new Date();
    const ingestedAt = signal.ingested_at || signal.timestamp || now;
    const createdAt = signal.created_at || signal.timestamp || now;
    const lastAnalyzedAt = signal.last_analyzed_at;

    return {
      ...signal,
      ingested_at: admin.firestore.Timestamp.fromDate(new Date(ingestedAt)),
      created_at: admin.firestore.Timestamp.fromDate(new Date(createdAt)),
      last_analyzed_at: lastAnalyzedAt 
        ? admin.firestore.Timestamp.fromDate(new Date(lastAnalyzedAt))
        : null,
      
      // Agregar metadata de persistencia
      _persistence_metadata: {
        stored_at: admin.firestore.Timestamp.now(),
        schema_version: signal.schema_version || '1.0.0',
        deterministic_id_generated: true
      }
    };
  }

  /**
   * Convierte documento de Firestore a UniversalSignal.
   * Restaura Date objects desde Timestamps.
   * 
   * @param {FirebaseFirestore.DocumentSnapshot} doc - Documento de Firestore
   * @returns {Object|null} UniversalSignal con tipos correctos
   */
  fromFirestoreFormat(doc) {
    if (!doc.exists) return null;

    const data = doc.data();
    
    return {
      ...data,
      id: doc.id, // Usar el ID del documento de Firestore
      ingested_at: data.ingested_at.toDate(),
      created_at: data.created_at.toDate(),
      last_analyzed_at: data.last_analyzed_at ? data.last_analyzed_at.toDate() : null,
    };
  }

  /**
   * Guarda un UniversalSignal en Firestore con ID determinista.
   * Si el signal ya existe, lo actualiza (merge: true).
   * Si es nuevo, lo crea.
   * 
   * @param {Object} signal - Signal a persistir
   * @returns {Promise<RepositoryResult>} Resultado de la operación
   */
  async saveSignal(signal) {
    try {
      // Generar ID determinista para evitar duplicados
      const documentId = this.generateDeterministicId(signal);
      
      // Verificar si ya existe
      const existingDoc = await this.db
        .collection(this.COLLECTION_NAME)
        .doc(documentId)
        .get();

      const wasUpdated = existingDoc.exists;

      // Convertir a formato Firestore
      const firestoreData = this.toFirestoreFormat(signal);

      console.log(`[SignalRepository] 🔄 Attempting to save signal to collection: ${this.COLLECTION_NAME}`);
      console.log(`[SignalRepository] 📄 Document ID: ${documentId}`);
      console.log(`[SignalRepository] 📊 Data preview:`, JSON.stringify(firestoreData, null, 2).slice(0, 500) + '...');

      // Guardar o actualizar con merge: true
      await this.db
        .collection(this.COLLECTION_NAME)
        .doc(documentId)
        .set(firestoreData, { merge: true });

      console.log(`[SignalRepository] ✅ ${wasUpdated ? 'Updated' : 'Created'} signal: ${documentId}`);
      console.log(`[SignalRepository] 🔗 Check Firebase Console: Collection '${this.COLLECTION_NAME}' -> Document '${documentId}'`);

      return {
        success: true,
        data: documentId,
        metadata: {
          operation: wasUpdated ? 'update' : 'create',
          timestamp: new Date(),
          documentId,
          wasUpdated
        }
      };

    } catch (error) {
      console.error('[SignalRepository] Error saving signal:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'save',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Obtiene un signal por su ID determinista.
   * 
   * @param {string} signalId - ID del signal a obtener
   * @returns {Promise<RepositoryResult>} Signal encontrado o null
   */
  async getSignal(signalId) {
    try {
      const doc = await this.db
        .collection(this.COLLECTION_NAME)
        .doc(signalId)
        .get();

      const signal = this.fromFirestoreFormat(doc);

      return {
        success: true,
        data: signal,
        metadata: {
          operation: 'get',
          timestamp: new Date(),
          documentId: signalId
        }
      };

    } catch (error) {
      console.error('[SignalRepository] Error getting signal:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'get',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Busca signals con filtros avanzados.
   * Implementa paginación y ordenamiento.
   * 
   * @param {SignalQueryOptions} options - Opciones de query
   * @returns {Promise<RepositoryResult>} Array de signals que coinciden con los filtros
   */
  async querySignals(options = {}) {
    try {
      let query = this.db.collection(this.COLLECTION_NAME);

      // Aplicar filtros
      if (options.filters) {
        options.filters.forEach(filter => {
          query = query.where(filter.field, filter.operator, filter.value);
        });
      }

      // Aplicar filtro de fecha si existe
      if (options.dateRange) {
        query = query
          .where('created_at', '>=', admin.firestore.Timestamp.fromDate(options.dateRange.from))
          .where('created_at', '<=', admin.firestore.Timestamp.fromDate(options.dateRange.to));
      }

      // Aplicar ordenamiento
      if (options.orderBy) {
        query = query.orderBy(options.orderBy.field, options.orderBy.direction);
      } else {
        // Ordenamiento por defecto: más recientes primero
        query = query.orderBy('created_at', 'desc');
      }

      // Aplicar límite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Aplicar offset (paginación)
      if (options.offset) {
        query = query.offset(options.offset);
      }

      // Ejecutar query
      const snapshot = await query.get();
      
      const signals = snapshot.docs.map(doc => this.fromFirestoreFormat(doc));

      return {
        success: true,
        data: signals,
        metadata: {
          operation: 'query',
          timestamp: new Date(),
          documentId: `${signals.length} documents found`
        }
      };

    } catch (error) {
      console.error('[SignalRepository] Error querying signals:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'query',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Obtiene signals por fuente específica.
   * Método de conveniencia para queries comunes.
   * 
   * @param {string} source - Fuente de los signals (twitter, tiktok, etc.)
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<RepositoryResult>} Signals de la fuente especificada
   */
  async getSignalsBySource(source, limit = 50) {
    return this.querySignals({
      filters: [
        { field: 'source', operator: '==', value: source }
      ],
      limit,
      orderBy: { field: 'created_at', direction: 'desc' }
    });
  }

  /**
   * Obtiene signals recientes (últimas 24 horas).
   * Útil para monitoreo en tiempo real.
   * 
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<RepositoryResult>} Signals recientes
   */
  async getRecentSignals(limit = 100) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return this.querySignals({
      dateRange: {
        from: yesterday,
        to: new Date()
      },
      limit,
      orderBy: { field: 'created_at', direction: 'desc' }
    });
  }

  /**
   * Actualiza el estado de procesamiento de un signal.
   * Útil para pipelines de análisis asíncrono.
   * 
   * @param {string} signalId - ID del signal
   * @param {string} status - Nuevo estado de procesamiento
   * @param {Array} logs - Logs de procesamiento opcionales
   * @returns {Promise<RepositoryResult>} Resultado de la operación
   */
  async updateProcessingStatus(signalId, status, logs = null) {
    try {
      const updateData = {
        processing_status: status,
        last_analyzed_at: admin.firestore.Timestamp.now()
      };

      if (logs) {
        updateData.processing_logs = logs.map(log => ({
          ...log,
          timestamp: admin.firestore.Timestamp.fromDate(log.timestamp)
        }));
      }

      await this.db
        .collection(this.COLLECTION_NAME)
        .doc(signalId)
        .update(updateData);

      return {
        success: true,
        metadata: {
          operation: 'updateProcessingStatus',
          timestamp: new Date(),
          documentId: signalId
        }
      };

    } catch (error) {
      console.error('[SignalRepository] Error updating processing status:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'updateProcessingStatus',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Elimina signals antiguos para gestión de almacenamiento.
   * 
   * @param {number} olderThanDays - Eliminar signals más antiguos que X días
   * @returns {Promise<RepositoryResult>} Número de signals eliminados
   */
  async cleanupOldSignals(olderThanDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const query = this.db
        .collection(this.COLLECTION_NAME)
        .where('created_at', '<', admin.firestore.Timestamp.fromDate(cutoffDate));

      const snapshot = await query.get();
      const batch = this.db.batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`[SignalRepository] Cleaned up ${snapshot.size} old signals`);

      return {
        success: true,
        data: snapshot.size,
        metadata: {
          operation: 'cleanup',
          timestamp: new Date(),
          documentId: `${snapshot.size} documents deleted`
        }
      };

    } catch (error) {
      console.error('[SignalRepository] Error during cleanup:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'cleanup',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Verifica la conectividad y salud de la conexión con Firebase Firestore
   * 
   * @returns {Promise<RepositoryResult>} Resultado del health check
   */
  async healthCheck() {
    try {
      console.log('[SignalRepository] Performing health check...');

      // Intentar una operación básica de lectura
      const testQuery = this.db.collection(this.COLLECTION_NAME).limit(1);
      const snapshot = await testQuery.get();
      
      const isConnected = snapshot !== null;
      const documentCount = snapshot.size;
      
      console.log(`[SignalRepository] ✅ Health check passed - Connected to Firebase Firestore`);
      console.log(`[SignalRepository] Collection: ${this.COLLECTION_NAME}, Sample documents: ${documentCount}`);

      return {
        success: true,
        data: {
          connected: isConnected,
          collectionName: this.COLLECTION_NAME,
          documentCount: documentCount,
          timestamp: new Date()
        },
        metadata: {
          operation: 'healthCheck',
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('[SignalRepository] ❌ Health check failed:', error);
      
      return {
        success: false,
        error: `Health check failed: ${error.message}`,
        metadata: {
          operation: 'healthCheck',
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Consulta señales con filtrado avanzado y paginación cursor-based.
   * Implementa filtros por sentiment, intent, source y rango de fechas.
   * 
   * @param {Object} options - Opciones de consulta
   * @param {number} [options.limit=20] - Límite de resultados por página
   * @param {string} [options.lastId] - ID del último documento para paginación
   * @param {string} [options.source] - Filtro por fuente (twitter, news_api, etc.)
   * @param {string} [options.sentiment] - Filtro por sentimiento (positive, negative, neutral)
   * @param {string} [options.intent] - Filtro por intención (commercial, informational, etc.)
   * @param {Date} [options.startDate] - Fecha de inicio para filtrado
   * @param {Date} [options.endDate] - Fecha de fin para filtrado
   * @returns {Promise<{signals: Array, lastId: string|null}>} Resultados paginados
   */
  async querySignals(options = {}) {
    try {
      const {
        limit = 20,
        lastId = null,
        source = null,
        sentiment = null,
        intent = null,
        startDate = null,
        endDate = null
      } = options;

      console.log(`[SignalRepository] 🔍 Querying signals with options:`, { 
        limit, lastId: lastId?.slice(0, 8) + '...', source, sentiment, intent 
      });

      // Iniciar query base con ordenamiento
      let query = this.db
        .collection(this.COLLECTION_NAME)
        .orderBy('created_at', 'desc');

      // Aplicar filtros condicionales
      if (source) {
        query = query.where('source', '==', source);
      }

      if (sentiment) {
        query = query.where('analysis.sentimentLabel', '==', sentiment);
      }

      if (intent) {
        query = query.where('analysis.intent', '==', intent);
      }

      // Filtros de fecha (requieren índices compuestos en producción)
      if (startDate) {
        query = query.where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate));
      }

      if (endDate) {
        query = query.where('created_at', '<=', admin.firestore.Timestamp.fromDate(endDate));
      }

      // Implementar paginación cursor-based
      if (lastId) {
        try {
          const lastDocSnap = await this.db
            .collection(this.COLLECTION_NAME)
            .doc(lastId)
            .get();

          if (lastDocSnap.exists) {
            query = query.startAfter(lastDocSnap);
          } else {
            console.warn(`[SignalRepository] ⚠️ lastId ${lastId} no existe, ignorando paginación`);
          }
        } catch (error) {
          console.error(`[SignalRepository] ❌ Error obteniendo lastId ${lastId}:`, error.message);
          // Continuar sin paginación si hay error
        }
      }

      // Aplicar límite
      query = query.limit(limit);

      // Ejecutar query
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('[SignalRepository] 📭 No signals found matching criteria');
        return {
          signals: [],
          lastId: null
        };
      }

      // Procesar resultados
      const signals = [];
      let newLastId = null;

      snapshot.forEach(doc => {
        const signalData = this.fromFirestoreFormat(doc);
        if (signalData) {
          signals.push(signalData);
        }
        newLastId = doc.id; // El último ID será el del último documento
      });

      console.log(`[SignalRepository] ✅ Found ${signals.length} signals, lastId: ${newLastId?.slice(0, 8)}...`);

      return {
        signals,
        lastId: newLastId
      };

    } catch (error) {
      console.error('[SignalRepository] ❌ Error in querySignals:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          operation: 'querySignals',
          timestamp: new Date(),
          options
        }
      };
    }
  }

  /**
   * Obtiene métricas rápidas del dashboard analizando señales recientes.
   * Calcula estadísticas en memoria para evitar queries costosas.
   * 
   * @param {number} [sampleSize=100] - Cantidad de señales recientes a analizar
   * @returns {Promise<Object>} Métricas calculadas del dashboard
   */
  async getDashboardMetrics(sampleSize = 100) {
    try {
      console.log(`[SignalRepository] 📊 Calculating dashboard metrics from last ${sampleSize} signals`);

      // Obtener señales recientes (últimas 24h si es posible)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const snapshot = await this.db
        .collection(this.COLLECTION_NAME)
        .where('created_at', '>=', admin.firestore.Timestamp.fromDate(twentyFourHoursAgo))
        .orderBy('created_at', 'desc')
        .limit(sampleSize)
        .get();

      if (snapshot.empty) {
        console.warn('[SignalRepository] ⚠️ No recent signals found for metrics');
        return {
          totalProcessed: 0,
          sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
          topIntents: {},
          period: '24h',
          timestamp: new Date().toISOString()
        };
      }

      // Calcular métricas en memoria
      const metrics = {
        totalProcessed: 0,
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        topIntents: {},
        sources: {},
        period: '24h',
        timestamp: new Date().toISOString()
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        metrics.totalProcessed++;

        // Análisis de sentimiento
        if (data.analysis?.sentimentLabel) {
          const sentiment = data.analysis.sentimentLabel;
          if (metrics.sentimentBreakdown[sentiment] !== undefined) {
            metrics.sentimentBreakdown[sentiment]++;
          }
        }

        // Análisis de intenciones
        if (data.analysis?.intent) {
          const intent = data.analysis.intent;
          metrics.topIntents[intent] = (metrics.topIntents[intent] || 0) + 1;
        }

        // Análisis de fuentes
        if (data.source) {
          metrics.sources[data.source] = (metrics.sources[data.source] || 0) + 1;
        }
      });

      // Convertir conteos a porcentajes para sentiment
      if (metrics.totalProcessed > 0) {
        Object.keys(metrics.sentimentBreakdown).forEach(key => {
          const percentage = Math.round((metrics.sentimentBreakdown[key] / metrics.totalProcessed) * 100);
          metrics.sentimentBreakdown[key + 'Percentage'] = percentage;
        });
      }

      console.log(`[SignalRepository] ✅ Dashboard metrics calculated:`, {
        totalProcessed: metrics.totalProcessed,
        topSentiment: Object.keys(metrics.sentimentBreakdown).reduce((a, b) => 
          metrics.sentimentBreakdown[a] > metrics.sentimentBreakdown[b] ? a : b
        )
      });

      return metrics;

    } catch (error) {
      console.error('[SignalRepository] ❌ Error calculating dashboard metrics:', error);
      throw new Error(`Error calculating metrics: ${error.message}`);
    }
  }
}

module.exports = { SignalRepository };