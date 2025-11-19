/**
 * ===============================================================================
 * ORCHESTRATOR INTEGRATION - NORMALIZATION SERVICE
 * ===============================================================================
 * 
 * Extensión del Orchestrator para integrar NormalizationService en el pipeline
 * de procesamiento de señales. Añade normalización automática después de la
 * ingesta pero antes del almacenamiento final.
 * 
 * @author LeadBoostAI - Radar System
 */

// Definición local de SourceType para evitar dependencia de TypeScript
const SourceType = {
  TWITTER: 'twitter',
  TIKTOK: 'tiktok', 
  YOUTUBE: 'youtube',
  NEWS_API: 'news_api',
  GOOGLE_TRENDS: 'google_trends',
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  REDDIT: 'reddit',
  RSS_FEED: 'rss_feed',
  WEB_SCRAPING: 'web_scraping',
  API_WEBHOOK: 'api_webhook'
};

/**
 * Servicio simplificado de normalización para integración con Orchestrator.
 * Implementa las funcionalidades esenciales sin dependencias externas.
 */
class OrchestratorNormalizationService {
  
  constructor() {
    this.config = {
      maxContentLength: 10000,
      preserveLineBreaks: true,
      resolveShortUrls: false,
      detectLanguage: false,
      hashAlgorithm: 'sha256'
    };
    this.version = '1.0.0';
    this.stats = {
      signalsProcessed: 0,
      normalizationErrors: 0,
      duplicatesDetected: 0
    };
  }

  /**
   * Método principal de normalización integrado con Orchestrator.
   */
  async normalizeSignal(signal) {
    try {
      this.stats.signalsProcessed++;
      
      console.log(`[NormalizationService] Processing signal ${signal.id} from ${signal.source}`);
      
      // 1. Limpiar contenido de texto
      const cleanContent = this.cleanText(signal.content_text);
      
      // 2. Normalizar fecha
      const normalizedDate = this.standardizeDate(signal.created_at);
      
      // 3. Generar hash único para deduplicación
      const contentHash = this.generateContentHash(cleanContent);
      
      // 4. Extraer metadatos de normalización
      const normalizationMetadata = this.extractNormalizationMetadata(
        signal.content_text,
        cleanContent,
        signal.source
      );
      
      // 5. Construir señal normalizada
      const normalizedSignal = {
        ...signal,
        cleanContent,
        normalizedDate,
        contentHash,
        normalizationMetadata,
        // Marcar como procesado por normalización
        processed_at: new Date().toISOString(),
        normalization_version: this.version
      };
      
      // 6. Validar integridad
      if (!this.validateNormalizedSignal(normalizedSignal)) {
        throw new Error('Signal validation failed after normalization');
      }
      
      console.log(`[NormalizationService] ✅ Signal ${signal.id} normalized successfully`);
      console.log(`[NormalizationService] Content: "${cleanContent.substring(0, 50)}${cleanContent.length > 50 ? '...' : ''}"`);
      console.log(`[NormalizationService] Hash: ${contentHash.substring(0, 16)}... | Length: ${normalizationMetadata.originalLength}→${normalizationMetadata.cleanedLength}`);
      
      return normalizedSignal;
      
    } catch (error) {
      this.stats.normalizationErrors++;
      console.error(`[NormalizationService] ❌ Error normalizing signal ${signal.id}:`, error.message);
      
      // Retornar señal con normalización mínima en caso de error
      return {
        ...signal,
        cleanContent: signal.content_text || '',
        normalizedDate: new Date().toISOString(),
        contentHash: this.generateFallbackHash(signal),
        normalizationMetadata: this.getMinimalMetadata(signal),
        processed_at: new Date().toISOString(),
        normalization_version: this.version,
        normalization_error: error.message
      };
    }
  }

  /**
   * Procesamiento en lote para múltiples señales.
   */
  async normalizeSignalBatch(signals) {
    console.log(`[NormalizationService] Processing batch of ${signals.length} signals`);
    
    const results = [];
    const duplicateHashes = new Set();
    
    for (const signal of signals) {
      try {
        const normalizedSignal = await this.normalizeSignal(signal);
        
        // Detectar duplicados por hash
        if (duplicateHashes.has(normalizedSignal.contentHash)) {
          this.stats.duplicatesDetected++;
          console.log(`[NormalizationService] 🔍 Duplicate detected: ${normalizedSignal.id} (hash: ${normalizedSignal.contentHash.substring(0, 16)}...)`);
          normalizedSignal.isDuplicate = true;
        } else {
          duplicateHashes.add(normalizedSignal.contentHash);
        }
        
        results.push(normalizedSignal);
      } catch (error) {
        console.error(`[NormalizationService] Batch processing error for signal ${signal.id}:`, error);
        results.push(signal); // Mantener original en caso de error crítico
      }
    }
    
    console.log(`[NormalizationService] Batch processed: ${results.length} signals, ${this.stats.duplicatesDetected} duplicates detected`);
    return results;
  }

  /**
   * Obtener estadísticas del servicio.
   */
  getStats() {
    return {
      ...this.stats,
      version: this.version,
      config: { ...this.config }
    };
  }

  /**
   * Resetear estadísticas.
   */
  resetStats() {
    this.stats = {
      signalsProcessed: 0,
      normalizationErrors: 0,
      duplicatesDetected: 0
    };
  }

  // ========================================================================
  // MÉTODOS PRIVADOS DE PROCESAMIENTO
  // ========================================================================

  cleanText(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    
    try {
      // Decodificar entidades HTML básicas
      let cleaned = rawText
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&apos;/g, "'");
      
      // Remover tags HTML
      cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      cleaned = cleaned.replace(/<[^>]*>/g, '');
      
      // Normalizar espacios en blanco
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      
      // Truncar si excede límite
      if (cleaned.length > this.config.maxContentLength) {
        cleaned = cleaned.substring(0, this.config.maxContentLength).trim();
      }
      
      return cleaned;
    } catch (error) {
      console.error('[NormalizationService] Text cleaning error:', error);
      return rawText ? rawText.trim().replace(/\s+/g, ' ') : '';
    }
  }

  standardizeDate(dateInput) {
    try {
      let date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        if (/^\d+$/.test(dateInput)) {
          // Es timestamp
          const timestamp = parseInt(dateInput, 10);
          const isMilliseconds = timestamp > 1e10;
          date = new Date(isMilliseconds ? timestamp : timestamp * 1000);
        } else {
          date = new Date(dateInput);
        }
      } else {
        throw new Error('Invalid date type');
      }
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      
      return date.toISOString();
    } catch (error) {
      console.error('[NormalizationService] Date normalization error:', error);
      return new Date().toISOString();
    }
  }

  generateContentHash(content) {
    try {
      const crypto = require('crypto');
      const normalizedContent = content ? content.trim().toLowerCase() : '';
      return crypto.createHash(this.config.hashAlgorithm).update(normalizedContent).digest('hex');
    } catch (error) {
      console.error('[NormalizationService] Hash generation error:', error);
      return this.generateFallbackHash({ content_text: content });
    }
  }

  extractNormalizationMetadata(originalContent, cleanedContent, source) {
    try {
      const urlRegex = /https?:\/\/[^\s]+/gi;
      const mentionRegex = /@[\w]+/gi;
      const hashtagRegex = /#[\w]+/gi;
      
      const urls = originalContent.match(urlRegex) || [];
      const mentions = originalContent.match(mentionRegex) || [];
      const hashtags = originalContent.match(hashtagRegex) || [];
      
      let isRetweet = false;
      if (source === 'twitter') {
        isRetweet = /^RT\s+@\w+:/i.test(originalContent.trim()) ||
                    originalContent.includes('retweeted');
      }
      
      const isTruncated = originalContent.endsWith('...') || 
                         originalContent.endsWith('…') ||
                         cleanedContent.endsWith('...');
      
      return {
        hasUrl: urls.length > 0,
        isRetweet,
        urlCount: urls.length,
        mentionCount: mentions.length,
        hashtagCount: hashtags.length,
        originalLength: originalContent.length,
        cleanedLength: cleanedContent.length,
        isTruncated,
        normalizedAt: new Date().toISOString(),
        normalizationVersion: this.version,
        languageDetected: undefined // TODO: Implementar detección de idioma
      };
    } catch (error) {
      console.error('[NormalizationService] Metadata extraction error:', error);
      return this.getMinimalMetadata({ content_text: originalContent });
    }
  }

  validateNormalizedSignal(signal) {
    try {
      // Validaciones básicas
      if (!signal.id || !signal.cleanContent || !signal.contentHash) {
        return false;
      }
      
      if (!signal.source || !['twitter', 'news_api', 'youtube', 'tiktok'].includes(signal.source)) {
        return false;
      }
      
      if (!signal.normalizationMetadata || typeof signal.normalizationMetadata !== 'object') {
        return false;
      }
      
      // Validar hash length (SHA-256 = 64 chars, MD5 = 32 chars)
      const expectedHashLength = this.config.hashAlgorithm === 'sha256' ? 64 : 32;
      if (signal.contentHash.length !== expectedHashLength) {
        console.warn(`[NormalizationService] Hash length mismatch: ${signal.contentHash.length} vs ${expectedHashLength}`);
      }
      
      return true;
    } catch (error) {
      console.error('[NormalizationService] Validation error:', error);
      return false;
    }
  }

  generateFallbackHash(signal) {
    try {
      const crypto = require('crypto');
      const fallbackContent = `fallback_${signal.id || 'unknown'}_${Date.now()}`;
      return crypto.createHash('sha256').update(fallbackContent).digest('hex');
    } catch (error) {
      console.error('[NormalizationService] Fallback hash error:', error);
      return 'fallback_hash_' + Date.now();
    }
  }

  getMinimalMetadata(signal) {
    const content = signal.content_text || '';
    return {
      hasUrl: false,
      isRetweet: false,
      urlCount: 0,
      mentionCount: 0,
      hashtagCount: 0,
      originalLength: content.length,
      cleanedLength: content.length,
      isTruncated: false,
      normalizedAt: new Date().toISOString(),
      normalizationVersion: this.version,
      languageDetected: undefined
    };
  }
}

// ========================================================================
// EXTENSIONES AL ORCHESTRATOR EXISTENTE
// ========================================================================

/**
 * Integración del NormalizationService en el Orchestrator.
 * Modifica el pipeline de ingesta para incluir normalización automática.
 */
class EnhancedOrchestratorWithNormalization {
  
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.normalizationService = new OrchestratorNormalizationService();
    
    console.log('[Enhanced Orchestrator] Normalization service integrated');
  }

  /**
   * Método mejorado de ingesta con normalización automática.
   */
  async runEnhancedIngestionCycle(source = 'twitter', query = 'AI innovation') {
    console.log('\n🚀 ENHANCED INGESTION CYCLE WITH NORMALIZATION');
    console.log('='.repeat(60));
    console.log(`📡 Source: ${source}`);
    console.log(`🎯 Query: "${query}"`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    try {
      // 1. Ejecutar ingesta tradicional
      const rawSignals = await this.orchestrator.runIngestionCycle(source, query);
      
      console.log(`📊 Raw signals retrieved: ${rawSignals.length}`);
      
      if (rawSignals.length === 0) {
        console.log('⚠️ No signals to normalize');
        return [];
      }
      
      // 2. Aplicar normalización a todas las señales
      console.log('\n🧽 Starting normalization process...');
      const normalizedSignals = await this.normalizationService.normalizeSignalBatch(rawSignals);
      
      // 3. Mostrar estadísticas de normalización
      const stats = this.normalizationService.getStats();
      console.log('\n📊 NORMALIZATION STATISTICS');
      console.log('-'.repeat(40));
      console.log(`✅ Signals processed: ${stats.signalsProcessed}`);
      console.log(`❌ Normalization errors: ${stats.normalizationErrors}`);
      console.log(`🔍 Duplicates detected: ${stats.duplicatesDetected}`);
      console.log(`📈 Success rate: ${((stats.signalsProcessed - stats.normalizationErrors) / stats.signalsProcessed * 100).toFixed(1)}%`);
      
      // 4. Mostrar muestras de señales normalizadas
      console.log('\n📄 NORMALIZED SIGNALS PREVIEW');
      console.log('-'.repeat(40));
      normalizedSignals.slice(0, 3).forEach((signal, index) => {
        console.log(`\nSignal ${index + 1}:`);
        console.log(`  ID: ${signal.id}`);
        console.log(`  Source: ${signal.source}`);
        console.log(`  Original: "${signal.content_text?.substring(0, 80)}${signal.content_text?.length > 80 ? '...' : ''}"`);
        console.log(`  Cleaned: "${signal.cleanContent?.substring(0, 80)}${signal.cleanContent?.length > 80 ? '...' : ''}"`);
        console.log(`  Hash: ${signal.contentHash?.substring(0, 16)}...`);
        console.log(`  Metadata: ${signal.normalizationMetadata?.originalLength}→${signal.normalizationMetadata?.cleanedLength} chars, RT: ${signal.normalizationMetadata?.isRetweet}, URLs: ${signal.normalizationMetadata?.hasUrl}`);
      });
      
      console.log(`\n✅ Enhanced ingestion completed! ${normalizedSignals.length} normalized signals ready for storage.`);
      
      return normalizedSignals;
      
    } catch (error) {
      console.error('\n❌ Enhanced ingestion failed:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas combinadas del sistema.
   */
  getEnhancedStats() {
    return {
      orchestrator: this.orchestrator.getStats ? this.orchestrator.getStats() : 'N/A',
      normalization: this.normalizationService.getStats()
    };
  }

  /**
   * Resetear todas las estadísticas.
   */
  resetAllStats() {
    if (this.orchestrator.resetStats) {
      this.orchestrator.resetStats();
    }
    this.normalizationService.resetStats();
  }
}

module.exports = {
  OrchestratorNormalizationService,
  EnhancedOrchestratorWithNormalization
};