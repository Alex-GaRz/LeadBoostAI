/**
 * EmbeddingService - Servicio de Generación de Vectores con OpenAI
 * 
 * Responsabilidades:
 * - Generar embeddings usando OpenAI text-embedding-3-small
 * - Gestionar la comunicación con OpenAI API
 * - Manejar errores robustamente
 * - Optimizar texto para embedding
 * 
 * Arquitectura: Singleton Pattern para eficiencia de recursos
 * 
 * @author LeadBoostAI Backend Team
 * @version 1.0.0 - Bloque 2, Actividad 2.4
 */

import OpenAI from 'openai';

/**
 * Interface para el resultado de embedding
 */
interface EmbeddingResult {
  vector: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Interface para configuración del servicio
 */
interface EmbeddingServiceConfig {
  model: string;
  maxTokens: number;
  retryAttempts: number;
}

/**
 * Servicio singleton para generación de embeddings con OpenAI
 */
export class EmbeddingService {
  private static instance: EmbeddingService;
  private openai: OpenAI | null = null;
  private isInitialized: boolean = false;
  private stats = {
    totalEmbeddings: 0,
    successfulEmbeddings: 0,
    failedEmbeddings: 0,
    totalTokensUsed: 0
  };

  private readonly config: EmbeddingServiceConfig = {
    model: 'text-embedding-3-small',
    maxTokens: 8192, // Límite del modelo text-embedding-3-small
    retryAttempts: 3
  };

  /**
   * Constructor privado para patrón Singleton
   */
  private constructor() {
    this.initializeOpenAI();
  }

  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
      console.log('[EmbeddingService] 🚀 Instancia singleton creada');
    }
    return EmbeddingService.instance;
  }

  /**
   * Inicializa el cliente OpenAI
   */
  private initializeOpenAI(): void {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        console.warn('[EmbeddingService] ⚠️ OPENAI_API_KEY no encontrada - modo mock habilitado');
        this.isInitialized = false;
        return;
      }

      this.openai = new OpenAI({
        apiKey: apiKey,
        timeout: 30000, // 30 segundos timeout
      });

      this.isInitialized = true;
      console.log('[EmbeddingService] ✅ Cliente OpenAI inicializado correctamente');
    } catch (error) {
      console.error('[EmbeddingService] ❌ Error inicializando OpenAI:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Limpia y prepara el texto para embedding
   */
  private cleanTextForEmbedding(text: string): string {
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
      // Truncar si es muy largo (conservativo para evitar límites)
      .substring(0, 6000)
      // Trim espacios
      .trim();
  }

  /**
   * Valida que el texto sea apropiado para embedding
   */
  private validateText(text: string): boolean {
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
  public async generateEmbedding(text: string): Promise<number[]> {
    this.stats.totalEmbeddings++;

    try {
      // Validación inicial
      if (!this.isInitialized || !this.openai) {
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

      // Llamada a OpenAI con reintentos
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          const response = await this.openai.embeddings.create({
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
          lastError = error as Error;
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`[EmbeddingService] ⚠️ Intento ${attempt}/${this.config.retryAttempts} falló:`, errorMessage);
          
          // Esperar antes del siguiente intento
          if (attempt < this.config.retryAttempts) {
            await this.delay(1000 * attempt); // Backoff exponencial
          }
        }
      }

      // Todos los intentos fallaron
      console.error('[EmbeddingService] ❌ Error generando embedding después de reintentos:', lastError?.message);
      this.stats.failedEmbeddings++;
      
      // Retornar embedding mock como fallback
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
  private generateMockEmbedding(text: string): number[] {
    const dimensions = 1536; // Dimensiones del modelo text-embedding-3-small
    const mockEmbedding: number[] = [];

    // Generar vector basado en características del texto
    const textHash = this.simpleHash(text);
    const seed = textHash % 1000;

    for (let i = 0; i < dimensions; i++) {
      // Generar valores seudoaleatorios basados en el texto
      const value = Math.sin(seed + i) * 0.1 + Math.cos(seed * 2 + i) * 0.05;
      mockEmbedding.push(Number(value.toFixed(6)));
    }

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
  private simpleHash(text: string): number {
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
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Verifica si el servicio está listo para usar
   */
  public isReady(): boolean {
    return this.isInitialized && this.openai !== null;
  }

  /**
   * Obtiene estadísticas del servicio
   */
  public getStats() {
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
  public resetStats(): void {
    this.stats = {
      totalEmbeddings: 0,
      successfulEmbeddings: 0,
      failedEmbeddings: 0,
      totalTokensUsed: 0
    };
    console.log('[EmbeddingService] 📊 Estadísticas reseteadas');
  }
}

// Export por defecto para compatibilidad
export default EmbeddingService;