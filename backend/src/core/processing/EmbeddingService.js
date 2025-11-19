/**
 * ===============================================================================
 * EMBEDDING SERVICE - JAVASCRIPT VERSION
 * ===============================================================================
 * 
 * Servicio de generación de vectores con OpenAI text-embedding-3-small.
 * Versión JavaScript para integración con el sistema existente.
 * 
 * @author LeadBoostAI Backend Team
 * @version 1.0.0 - Bloque 2, Actividad 2.4
 */

/**
 * Servicio singleton para generación de embeddings con OpenAI
 */
class EmbeddingService {
  static instance = null;

  constructor() {
    this.isInitialized = false;
    this.openaiClient = null;
    this.stats = {
      totalEmbeddings: 0,
      successfulEmbeddings: 0,
      failedEmbeddings: 0,
      totalTokensUsed: 0
    };

    this.config = {
      model: 'text-embedding-3-small',
      maxTokens: 8192,
      retryAttempts: 3
    };

    this.initializeOpenAI();
  }

  static getInstance() {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
      console.log('[EmbeddingService] 🚀 Instancia singleton creada');
    }
    return EmbeddingService.instance;
  }

  initializeOpenAI() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn('[EmbeddingService] ⚠️ OPENAI_API_KEY no encontrada - modo mock habilitado');
        this.isInitialized = false;
        return;
      }

      // TODO: Descomentar cuando se instale openai
      // const OpenAI = require('openai');
      // this.openaiClient = new OpenAI({
      //   apiKey: apiKey,
      //   timeout: 30000
      // });

      console.log('[EmbeddingService] ⚠️ OpenAI client preparado - Pendiente: npm install openai');
      this.openaiClient = null; // Temporal hasta instalar dependencia
      this.isInitialized = true;
    } catch (error) {
      console.error('[EmbeddingService] ❌ Error inicializando OpenAI:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Limpia y prepara el texto para embedding
   */
  cleanTextForEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      // Eliminar saltos de línea y caracteres de control
      .replace(/[\r\n\t]/g, ' ')
      // Normalizar espacios múltiples
      .replace(/\s+/g, ' ')
      // Eliminar caracteres especiales problemáticos
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Truncar si es muy largo
      .substring(0, 6000)
      // Trim espacios
      .trim();
  }

  /**
   * Valida que el texto sea apropiado para embedding
   */
  validateText(text) {
    if (!text || text.length === 0) {
      return false;
    }

    if (text.length < 3) {
      console.warn('[EmbeddingService] ⚠️ Texto demasiado corto para embedding:', text.length);
      return false;
    }

    return true;
  }

  /**
   * Genera embedding usando OpenAI text-embedding-3-small
   */
  async generateEmbedding(text) {
    this.stats.totalEmbeddings++;

    try {
      // Validación inicial
      if (!this.isInitialized || !this.openaiClient) {
        console.warn('[EmbeddingService] 🤖 OpenAI no disponible - generando embedding mock');
        return this.generateMockEmbedding(text);
      }

      // Limpiar y validar texto
      const cleanedText = this.cleanTextForEmbedding(text);
      if (!this.validateText(cleanedText)) {
        console.warn('[EmbeddingService] ❌ Texto inválido para embedding');
        this.stats.failedEmbeddings++;
        return [];
      }

      console.log('[EmbeddingService] 🔍 Generando embedding para texto:', cleanedText.substring(0, 100) + '...');

      // TODO: Implementación real con OpenAI (cuando se instale la dependencia)
      /*
      // Llamada a OpenAI con reintentos
      let lastError = null;
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          const response = await this.openaiClient.embeddings.create({
            model: this.config.model,
            input: cleanedText,
            encoding_format: 'float'
          });

          // Validar respuesta
          if (!response.data || response.data.length === 0) {
            throw new Error('Respuesta vacía de OpenAI embeddings');
          }

          const embedding = response.data[0].embedding;
          if (!Array.isArray(embedding) || embedding.length === 0) {
            throw new Error('Embedding inválido recibido');
          }

          // Actualizar estadísticas
          this.stats.successfulEmbeddings++;
          this.stats.totalTokensUsed += response.usage?.total_tokens || 0;

          console.log('[EmbeddingService] ✅ Embedding generado exitosamente', {
            dimensions: embedding.length,
            tokens: response.usage?.total_tokens || 0,
            attempt: attempt
          });

          return embedding;

        } catch (error) {
          lastError = error;
          console.warn(`[EmbeddingService] ⚠️ Intento ${attempt}/${this.config.retryAttempts} falló:`, error.message);
          
          // Esperar antes del siguiente intento
          if (attempt < this.config.retryAttempts) {
            await this.delay(1000 * attempt);
          }
        }
      }

      // Todos los intentos fallaron
      console.error('[EmbeddingService] ❌ Error generando embedding después de reintentos:', lastError?.message);
      this.stats.failedEmbeddings++;
      */
      
      // Implementación temporal con mock
      return this.generateMockEmbedding(text);

    } catch (error) {
      console.error('[EmbeddingService] ❌ Error inesperado generando embedding:', error);
      this.stats.failedEmbeddings++;
      return [];
    }
  }

  /**
   * Genera un embedding mock para testing/fallback
   */
  generateMockEmbedding(text) {
    const dimensions = 1536; // Dimensiones del modelo text-embedding-3-small
    const mockEmbedding = [];

    // Generar vector basado en características del texto
    const textHash = this.simpleHash(text);
    const seed = textHash % 1000;

    for (let i = 0; i < dimensions; i++) {
      // Generar valores seudoaleatorios basados en el texto
      const value = Math.sin(seed + i) * 0.1 + Math.cos(seed * 2 + i) * 0.05;
      mockEmbedding.push(Number(value.toFixed(6)));
    }

    this.stats.successfulEmbeddings++;

    console.log('[EmbeddingService] 🤖 Embedding mock generado', {
      dimensions: mockEmbedding.length,
      textLength: text.length,
      seed: seed
    });

    return mockEmbedding;
  }

  /**
   * Hash simple para generar embeddings mock consistentes
   */
  simpleHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Delay utility para reintentos
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica si el servicio está listo para usar
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalEmbeddings > 0 
        ? (this.stats.successfulEmbeddings / this.stats.totalEmbeddings * 100).toFixed(2) + '%'
        : '0%',
      isInitialized: this.isInitialized,
      model: this.config.model
    };
  }

  /**
   * Reset de estadísticas
   */
  resetStats() {
    this.stats = {
      totalEmbeddings: 0,
      successfulEmbeddings: 0,
      failedEmbeddings: 0,
      totalTokensUsed: 0
    };
    console.log('[EmbeddingService] 📊 Estadísticas reseteadas');
  }
}

module.exports = EmbeddingService;