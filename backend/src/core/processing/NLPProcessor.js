/**
 * ===============================================================================
 * NLP PROCESSOR - JAVASCRIPT INTEGRATION VERSION
 * ===============================================================================
 * 
 * Versión JavaScript del NLPProcessor para integración con Orchestrator.
 * Implementa el mismo API que la versión TypeScript pero en JavaScript puro.
 * 
 * ACTUALIZACIÓN BLOQUE 2.4: Integración con EmbeddingService
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.1.0 - JavaScript Integration + Embeddings
 */

// Importar EmbeddingService
const EmbeddingService = require('./EmbeddingService');

/**
 * Procesador de Lenguaje Natural para enriquecimiento automático de señales.
 * Implementa patrón Singleton para gestión eficiente de recursos.
 * 
 * NUEVO: Incluye generación de embeddings vectoriales
 */
class NLPProcessor {
  static instance = null;

  constructor() {
    this.isInitialized = false;
    this.openaiClient = null;
    this.embeddingService = null;
    
    // Verificar que existe la API key de OpenAI
    if (!process.env.OPENAI_API_KEY) {
      console.warn('[NLPProcessor] ⚠️ OPENAI_API_KEY no encontrada - Ejecutar: npm install openai');
      this.openaiClient = null;
      this.isInitialized = false;
      return;
    }

    try {
      // TODO: Descomentar cuando se instale openai
      // const OpenAI = require('openai');
      // this.openaiClient = new OpenAI({
      //   apiKey: process.env.OPENAI_API_KEY,
      // });
      
      console.log('[NLPProcessor] ⚠️ OpenAI client preparado - Pendiente: npm install openai');
      this.openaiClient = null; // Temporal hasta instalar dependencia
      
      // Inicializar EmbeddingService
      this.embeddingService = EmbeddingService.getInstance();
      console.log('[NLPProcessor] 🧠 EmbeddingService integrado exitosamente');
      this.embeddingService = EmbeddingService.getInstance();
      console.log('[NLPProcessor] 🔗 EmbeddingService integrado');
      
      this.isInitialized = true;
    } catch (error) {
      console.error('[NLPProcessor] ❌ Error inicializando OpenAI client:', error);
      this.openaiClient = null;
      this.embeddingService = null;
      this.isInitialized = false;
    }
  }

  static getInstance() {
    if (!NLPProcessor.instance) {
      NLPProcessor.instance = new NLPProcessor();
    }
    return NLPProcessor.instance;
  }

  isReady() {
    // Temporal: return true para permitir testing sin OpenAI instalado
    return this.isInitialized;
  }

  async enrichSignal(signal) {
    if (!this.isReady()) {
      throw new Error('[NLPProcessor] Procesador no inicializado correctamente');
    }

    console.log(`[NLPProcessor] 🔄 Iniciando análisis NLP para señal: ${signal.contentHash?.slice(0, 8)}...`);

    // Verificar que existe contenido limpio para analizar
    if (!signal.cleanContent || signal.cleanContent.trim().length === 0) {
      console.warn(`[NLPProcessor] ⚠️ Sin contenido limpio para análisis: ${signal.contentHash?.slice(0, 8)}`);
      
      // Retornar señal con análisis fallback
      const fallbackAnalysis = {
        sentimentScore: 0,
        sentimentLabel: 'neutral',
        intent: 'informational',
        keywords: [],
        summary: 'Contenido sin texto analizable',
        urgency: 'low',
        analysisFailed: true
      };

      return {
        ...signal,
        analysis: fallbackAnalysis
      };
    }

    try {
      // TODO: Cuando se instale OpenAI, descomentar esta implementación
      /*
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      
      console.log(`[NLPProcessor] 🤖 Analizando con modelo: ${model}`);

      const completion = await this.openaiClient.chat.completions.create({
        model: model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Eres un analista de inteligencia de mercado experto. Analiza el siguiente texto de redes sociales/noticias. Clasifica la intención, sentimiento, urgencia y extrae palabras clave. Responde EXCLUSIVAMENTE en JSON válido siguiendo este esquema: { \"sentimentScore\": number, \"sentimentLabel\": string, \"intent\": string, \"keywords\": array, \"summary\": string, \"urgency\": string }. sentimentScore debe ser entre -1 y 1. sentimentLabel: 'positive', 'negative', 'neutral'. intent: 'commercial', 'informational', 'complaint', 'support', 'spam'. urgency: 'high', 'medium', 'low'. summary: una frase en español."
          },
          {
            role: "user",
            content: signal.cleanContent
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('Respuesta vacía de OpenAI');
      }

      const analysisResult = JSON.parse(responseContent);
      
      if (!this.validateAnalysisResult(analysisResult)) {
        throw new Error('Estructura de respuesta OpenAI inválida');
      }

      console.log(`[NLPProcessor] ✅ Análisis completado - Sentiment: ${analysisResult.sentimentLabel}, Intent: ${analysisResult.intent}`);
      */

      // Implementación temporal hasta que se instale OpenAI
      const analysisResult = this.generateMockAnalysis(signal.cleanContent);
      
      // NUEVA FUNCIONALIDAD: Generar embedding vectorial
      let embeddingVector = [];
      if (this.embeddingService && this.embeddingService.isReady()) {
        try {
          console.log(`[NLPProcessor] 🧮 Generando embedding para señal: ${signal.contentHash?.slice(0, 8)}`);
          embeddingVector = await this.embeddingService.generateEmbedding(signal.cleanContent);
          
          if (embeddingVector && embeddingVector.length > 0) {
            console.log(`[NLPProcessor] ✅ Embedding generado: ${embeddingVector.length} dimensiones`);
          } else {
            console.warn(`[NLPProcessor] ⚠️ Embedding vacío para señal: ${signal.contentHash?.slice(0, 8)}`);
          }
        } catch (embeddingError) {
          console.error(`[NLPProcessor] ❌ Error generando embedding:`, embeddingError);
          embeddingVector = []; // Fallback a vector vacío
        }
      } else {
        console.warn('[NLPProcessor] ⚠️ EmbeddingService no disponible - sin vector');
      }
      
      const enrichedSignal = {
        ...signal,
        analysis: analysisResult,
        embedding: embeddingVector.length > 0 ? embeddingVector : undefined
      };

      console.log(`[NLPProcessor] ✅ Análisis NLP completado para señal: ${signal.contentHash?.slice(0, 8)}`);
      console.log(`[NLPProcessor] 📊 Análisis: ${analysisResult.sentimentLabel} | ${analysisResult.intent} | "${analysisResult.summary}"`);
      console.log(`[NLPProcessor] 🧮 Embedding: ${embeddingVector.length > 0 ? `${embeddingVector.length} dims` : 'no disponible'}`);
      
      return enrichedSignal;

    } catch (error) {
      console.error(`[NLPProcessor] ❌ Error en análisis NLP:`, error);
      
      // Error handling robusto - retornar señal con análisis fallback
      const fallbackAnalysis = {
        sentimentScore: 0,
        sentimentLabel: 'neutral',
        intent: 'informational',
        keywords: [],
        summary: 'Error en análisis - contenido no procesado',
        urgency: 'medium',
        analysisFailed: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      return {
        ...signal,
        analysis: fallbackAnalysis,
        embedding: undefined // No embedding en caso de error
      };
    }
  }

  validateAnalysisResult(result) {
    if (!result || typeof result !== 'object') return false;
    
    const requiredFields = ['sentimentScore', 'sentimentLabel', 'intent', 'keywords', 'summary', 'urgency'];
    const hasAllFields = requiredFields.every(field => field in result);
    
    if (!hasAllFields) return false;
    
    const isValidSentiment = typeof result.sentimentScore === 'number' && 
                            result.sentimentScore >= -1 && 
                            result.sentimentScore <= 1;
    
    const isValidLabel = ['positive', 'negative', 'neutral'].includes(result.sentimentLabel);
    const isValidIntent = ['commercial', 'informational', 'complaint', 'support', 'spam'].includes(result.intent);
    const isValidUrgency = ['high', 'medium', 'low'].includes(result.urgency);
    const isValidKeywords = Array.isArray(result.keywords);
    const isValidSummary = typeof result.summary === 'string';
    
    return isValidSentiment && isValidLabel && isValidIntent && isValidUrgency && isValidKeywords && isValidSummary;
  }

  generateMockAnalysis(content) {
    const lowerContent = content.toLowerCase();
    
    // Análisis básico de sentimiento basado en palabras clave
    const positiveWords = ['excelente', 'bueno', 'genial', 'increíble', 'amazing', 'great', 'good', 'excellent', 'love', 'awesome', 'innovation', 'breakthrough'];
    const negativeWords = ['malo', 'terrible', 'pésimo', 'horrible', 'bad', 'terrible', 'awful', 'hate', 'worst', 'disgusting', 'crisis', 'crash'];
    
    const positiveCount = positiveWords.reduce((count, word) => count + (lowerContent.includes(word) ? 1 : 0), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (lowerContent.includes(word) ? 1 : 0), 0);
    
    let sentimentScore = 0;
    let sentimentLabel = 'neutral';
    
    if (positiveCount > negativeCount) {
      sentimentScore = Math.min(0.8, positiveCount * 0.3);
      sentimentLabel = 'positive';
    } else if (negativeCount > positiveCount) {
      sentimentScore = Math.max(-0.8, negativeCount * -0.3);
      sentimentLabel = 'negative';
    }
    
    // Detección básica de intent
    let intent = 'informational';
    
    if (lowerContent.includes('comprar') || lowerContent.includes('vender') || lowerContent.includes('precio') || 
        lowerContent.includes('buy') || lowerContent.includes('sell') || lowerContent.includes('price') ||
        lowerContent.includes('invest') || lowerContent.includes('stock')) {
      intent = 'commercial';
    } else if (lowerContent.includes('ayuda') || lowerContent.includes('help') || lowerContent.includes('support')) {
      intent = 'support';
    } else if (lowerContent.includes('queja') || lowerContent.includes('reclamo') || lowerContent.includes('complaint')) {
      intent = 'complaint';
    } else if (lowerContent.includes('spam') || lowerContent.includes('oferta') || lowerContent.includes('gratis')) {
      intent = 'spam';
    }
    
    // Extracción básica de keywords
    const words = content.split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['that', 'with', 'have', 'this', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their'].includes(word.toLowerCase()))
      .slice(0, 5);
    
    const keywords = [...new Set(words)]; // Eliminar duplicados
    
    // Determinar urgencia
    let urgency = 'medium';
    
    if (lowerContent.includes('urgente') || lowerContent.includes('urgent') || lowerContent.includes('immediately') ||
        lowerContent.includes('breaking') || lowerContent.includes('alert')) {
      urgency = 'high';
    } else if (lowerContent.includes('cuando puedas') || lowerContent.includes('no rush') || lowerContent.includes('eventually')) {
      urgency = 'low';
    }
    
    // Generar resumen inteligente basado en contenido
    let summary;
    if (lowerContent.includes('artificial intelligence') || lowerContent.includes('ai')) {
      summary = `Contenido sobre inteligencia artificial con sentimiento ${sentimentLabel}`;
    } else if (lowerContent.includes('technology') || lowerContent.includes('tech')) {
      summary = `Información tecnológica con tono ${sentimentLabel}`;
    } else if (lowerContent.includes('market') || lowerContent.includes('stock') || lowerContent.includes('financial')) {
      summary = `Análisis de mercado financiero con perspectiva ${sentimentLabel}`;
    } else {
      summary = content.length > 50 ? 
        `Análisis: ${content.substring(0, 47)}...` : 
        `Análisis: ${content}`;
    }
    
    return {
      sentimentScore: Math.round(sentimentScore * 100) / 100, // Redondear a 2 decimales
      sentimentLabel,
      intent,
      keywords,
      summary,
      urgency
    };
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      clientReady: !!this.openaiClient,
      embeddingService: this.embeddingService?.getStats() || null
    };
  }
}

module.exports = NLPProcessor;