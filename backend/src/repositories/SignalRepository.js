/**
 * ===============================================================================
 * SIGNAL REPOSITORY - CLEAN ARCHITECTURE PERSISTENCE LAYER (ROBUST VERSION)
 * ===============================================================================
 * * Repositorio para persistencia de UniversalSignal en Firebase Firestore.
 * Implementa principios de Clean Architecture y Mapeo Defensivo.
 * * @author LeadBoostAI - Radar System
 * @version 1.1.0 - Robust Date Handling
 */

const admin = require('firebase-admin');
const crypto = require('crypto');

class SignalRepository {
  constructor() {
    this.db = admin.firestore();
    this.COLLECTION_NAME = 'universal_signals';
    this.initialized = false;
  }

  generateDeterministicId(signal) {
    const originalId = this.extractOriginalId(signal);
    const dateForId = signal.created_at || signal.timestamp || new Date();
    const dateString = dateForId instanceof Date ? dateForId.toISOString() : new Date(dateForId).toISOString();
    
    const uniqueString = [
      signal.source || 'unknown_source',
      signal.original_url || signal.url || 'no_url',
      originalId || dateString,
    ].join('|');

    return crypto.createHash('md5').update(uniqueString).digest('hex');
  }

  extractOriginalId(signal) {
    const rawData = signal.raw_metadata || {};
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

  async initialize() {
    try {
      if (this.initialized) return true;
      await this.healthCheck();
      this.initialized = true;
      console.log('[SignalRepository] ✅ Repository initialized successfully');
      return true;
    } catch (error) {
      console.error('[SignalRepository] ❌ Initialization failed:', error.message);
      return false; // No lanzar error para no detener el arranque, solo loguear
    }
  }

  // --- MÉTODO BLINDADO CONTRA ERRORES DE FECHA ---
  toFirestoreFormat(signal) {
    const now = new Date();
    
    // Función auxiliar segura para fechas
    const safeDate = (dateVal) => {
        if (!dateVal) return now;
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? now : d;
    };

    return {
      ...signal,
      ingested_at: admin.firestore.Timestamp.fromDate(safeDate(signal.ingested_at || signal.timestamp)),
      created_at: admin.firestore.Timestamp.fromDate(safeDate(signal.created_at || signal.timestamp)),
      last_analyzed_at: signal.last_analyzed_at 
        ? admin.firestore.Timestamp.fromDate(safeDate(signal.last_analyzed_at))
        : null,
      
      _persistence_metadata: {
        stored_at: admin.firestore.Timestamp.now(),
        schema_version: signal.schema_version || '1.0.0',
        deterministic_id_generated: true
      }
    };
  }

  // --- MÉTODO DE LECTURA BLINDADO ---
  fromFirestoreFormat(doc) {
    if (!doc.exists) return null;

    const data = doc.data();
    
    // Helper para extraer fecha seguramente sin crashear
    const extractDate = (field) => {
        if (!field) return new Date(); // Si falta, usa fecha actual
        if (field.toDate && typeof field.toDate === 'function') return field.toDate(); // Es Timestamp
        const d = new Date(field); // Intenta parsear string/number
        return isNaN(d.getTime()) ? new Date() : d; // Si es inválido, fecha actual
    };

    return {
      ...data,
      id: doc.id,
      ingested_at: extractDate(data.ingested_at),
      created_at: extractDate(data.created_at),
      last_analyzed_at: data.last_analyzed_at ? extractDate(data.last_analyzed_at) : null,
    };
  }

  async saveSignal(signal) {
    try {
      const documentId = this.generateDeterministicId(signal);
      const existingDoc = await this.db.collection(this.COLLECTION_NAME).doc(documentId).get();
      const wasUpdated = existingDoc.exists;
      const firestoreData = this.toFirestoreFormat(signal);

      await this.db.collection(this.COLLECTION_NAME).doc(documentId).set(firestoreData, { merge: true });

      return {
        success: true,
        data: documentId,
        metadata: { operation: wasUpdated ? 'update' : 'create', timestamp: new Date(), documentId, wasUpdated }
      };
    } catch (error) {
      console.error('[SignalRepository] Error saving signal:', error);
      return { success: false, error: error.message };
    }
  }

  async querySignals(options = {}) {
    try {
      const { limit = 20, lastId = null, source = null, sentiment = null, intent = null, startDate = null, endDate = null } = options;

      console.log(`[SignalRepository] 🔍 Querying signals... Limit: ${limit}`);

      let query = this.db.collection(this.COLLECTION_NAME).orderBy('created_at', 'desc');

      if (source) query = query.where('source', '==', source);
      if (sentiment) query = query.where('analysis.sentimentLabel', '==', sentiment);
      if (intent) query = query.where('analysis.intent', '==', intent);
      if (startDate) query = query.where('created_at', '>=', admin.firestore.Timestamp.fromDate(startDate));
      if (endDate) query = query.where('created_at', '<=', admin.firestore.Timestamp.fromDate(endDate));

      if (lastId) {
        const lastDocSnap = await this.db.collection(this.COLLECTION_NAME).doc(lastId).get();
        if (lastDocSnap.exists) query = query.startAfter(lastDocSnap);
      }

      query = query.limit(limit);

      const snapshot = await query.get();
      
      const signals = [];
      let newLastId = null;

      snapshot.forEach(doc => {
        // Aquí es donde la versión anterior fallaba si el doc estaba corrupto
        // Ahora fromFirestoreFormat es seguro
        try {
            const signalData = this.fromFirestoreFormat(doc);
            if (signalData) {
              signals.push(signalData);
              newLastId = doc.id;
            }
        } catch (err) {
            console.warn(`[SignalRepository] ⚠️ Skipping corrupted document ${doc.id}:`, err.message);
        }
      });

      return { signals, lastId: newLastId };

    } catch (error) {
      console.error('[SignalRepository] ❌ Error in querySignals:', error);
      return { success: false, error: error.message, signals: [] }; // Retornar array vacío en error para no romper UI
    }
  }

  async getDashboardMetrics(sampleSize = 100) {
    try {
      // Versión simplificada y segura para métricas
      const snapshot = await this.db.collection(this.COLLECTION_NAME)
        .orderBy('created_at', 'desc')
        .limit(sampleSize)
        .get();

      const metrics = {
        totalProcessed: 0,
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        topIntents: {},
        sources: {},
        period: '24h',
        timestamp: new Date().toISOString()
      };

      if (snapshot.empty) return metrics;

      snapshot.forEach(doc => {
        const data = doc.data();
        metrics.totalProcessed++;
        
        const sentiment = data.analysis?.sentimentLabel || 'neutral';
        if (metrics.sentimentBreakdown[sentiment] !== undefined) metrics.sentimentBreakdown[sentiment]++;
        
        const intent = data.analysis?.intent || 'unknown';
        metrics.topIntents[intent] = (metrics.topIntents[intent] || 0) + 1;
        
        const src = data.source || 'unknown';
        metrics.sources[src] = (metrics.sources[src] || 0) + 1;
      });

      // Calcular porcentajes
      if (metrics.totalProcessed > 0) {
        Object.keys(metrics.sentimentBreakdown).forEach(key => {
          metrics.sentimentBreakdown[key + 'Percentage'] = Math.round((metrics.sentimentBreakdown[key] / metrics.totalProcessed) * 100);
        });
      }

      return metrics;
    } catch (error) {
      console.error('[SignalRepository] ❌ Error calculating dashboard metrics:', error);
      // Retornar métricas vacías en vez de explotar
      return {
        totalProcessed: 0,
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        topIntents: {},
        period: 'Error',
        timestamp: new Date().toISOString()
      };
    }
  }
  
  // Métodos auxiliares necesarios para compatibilidad
  async healthCheck() {
      try {
          await this.db.collection(this.COLLECTION_NAME).limit(1).get();
          return { success: true };
      } catch (e) {
          throw e;
      }
  }
}

module.exports = { SignalRepository };