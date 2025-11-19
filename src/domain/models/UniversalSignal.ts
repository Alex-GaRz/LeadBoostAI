/**
 * ===============================================================================
 * UNIVERSAL SIGNAL - ARQUITECTURA DE DATOS CANÓNICA
 * ===============================================================================
 * 
 * Esquema maestro para normalizar señales de múltiples fuentes (Twitter/X, TikTok, 
 * NewsAPI, Google Trends, YouTube, etc.) bajo un formato unificado para análisis
 * de inteligencia de mercado y predicción de tendencias.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

/**
 * Fuentes de datos soportadas por el sistema RADAR.
 * Cada fuente requiere un adaptador específico para normalizar datos a UniversalSignal.
 */
export enum SourceType {
  TWITTER = 'twitter',
  TIKTOK = 'tiktok', 
  YOUTUBE = 'youtube',
  NEWS_API = 'news_api',
  GOOGLE_TRENDS = 'google_trends',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  REDDIT = 'reddit',
  RSS_FEED = 'rss_feed',
  WEB_SCRAPING = 'web_scraping',
  API_WEBHOOK = 'api_webhook'
}

/**
 * Clasificación del contenido por tipo de medio.
 * Crítico para algoritmos de análisis específicos (NLP vs Computer Vision).
 */
export enum ContentType {
  TEXT = 'text',           // Posts, tweets, comentarios
  VIDEO = 'video',         // TikToks, YouTube videos, Instagram reels
  IMAGE = 'image',         // Fotos, infografías, memes
  AUDIO = 'audio',         // Podcasts, Spaces de Twitter
  MIXED = 'mixed',         // Contenido multimedia
  LINK = 'link'            // Enlaces, artículos de noticias
}

/**
 * Sentimientos detectados por análisis NLP.
 * Base para predicción de reacciones del mercado.
 */
export enum SentimentType {
  VERY_POSITIVE = 'very_positive',    // 0.8 - 1.0
  POSITIVE = 'positive',              // 0.4 - 0.8
  NEUTRAL = 'neutral',                // -0.4 - 0.4
  NEGATIVE = 'negative',              // -0.8 - -0.4
  VERY_NEGATIVE = 'very_negative'     // -1.0 - -0.8
}

/**
 * Etiquetas emocionales para análisis psicográfico avanzado.
 * Permite predecir comportamientos de compra y viralidad.
 */
export interface EmotionalTags {
  primary_emotion: string;      // Emoción dominante (joy, anger, fear, surprise)
  intensity: number;            // 0-1: Intensidad emocional
  secondary_emotions?: string[]; // Emociones secundarias detectadas
  psychological_triggers?: string[]; // Gatillos psicológicos (FOMO, social_proof, urgency)
}

/**
 * Datos de geolocalización normalizados.
 * Esencial para análisis de tendencias regionales y segmentación geográfica.
 */
export interface GeoLocation {
  country?: string;             // Código ISO del país (US, MX, ES)
  country_name?: string;        // Nombre completo del país
  region?: string;              // Estado/provincia
  city?: string;                // Ciudad específica
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;            // Zona horaria (America/Mexico_City)
}

/**
 * Métricas de engagement normalizadas entre plataformas.
 * Permite comparar viralidad independientemente de la fuente.
 */
export interface EngagementMetrics {
  likes: number;                // Likes, hearts, thumbs up
  shares: number;               // Retweets, shares, forwards
  comments: number;             // Comentarios, replies
  views?: number;               // Views (videos/posts)
  saves?: number;               // Bookmarks, saves
  
  // Métricas calculadas
  engagement_rate?: number;     // Ratio de engagement vs alcance
  virality_score?: number;      // Score de viralidad (0-100)
  velocity?: number;            // Velocidad de crecimiento por hora
}

/**
 * Información del autor/creador normalizada.
 * Crítica para análisis de influencia y credibilidad.
 */
export interface AuthorInfo {
  id: string;                   // ID único del autor en la plataforma
  username: string;             // Handle/username (@elonmusk)
  display_name?: string;        // Nombre público
  verified: boolean;            // Cuenta verificada
  follower_count?: number;      // Número de seguidores
  following_count?: number;     // Número de seguidos
  account_created?: Date;       // Fecha de creación de cuenta
  
  // Métricas de influencia
  influence_score?: number;     // Score de influencia (0-100)
  authority_topics?: string[];  // Temas donde tiene autoridad
  avg_engagement_rate?: number; // Engagement promedio histórico
}

/**
 * Análisis de entidades y temas detectados por NLP.
 * Base para segmentación y targeting inteligente.
 */
export interface EntityRecognition {
  people?: string[];            // Personas mencionadas
  organizations?: string[];     // Empresas, marcas, organizaciones
  locations?: string[];         // Lugares mencionados
  products?: string[];          // Productos específicos
  brands?: string[];            // Marcas identificadas
  hashtags?: string[];          // Hashtags extraídos
  mentions?: string[];          // @mentions
  topics?: string[];            // Temas principales identificados
  keywords?: string[];          // Keywords relevantes extraídas
  
  // Análisis semántico
  intent?: string;              // Intención detectada (buy, sell, complain, recommend)
  category?: string;            // Categoría de negocio
  confidence_score?: number;    // Confianza del análisis (0-1)
}

/**
 * INTERFAZ PRINCIPAL: UniversalSignal
 * 
 * Esquema canónico que unifica datos de todas las fuentes bajo un formato estándar.
 * Diseñado para escalabilidad, análisis predictivo y machine learning.
 */
export interface UniversalSignal {
  // ========================================================================
  // METADATOS BASE - Trazabilidad y gestión de datos
  // ========================================================================
  
  /**
   * Identificador único universal del signal.
   * Formato: {source}_{platform_id}_{timestamp} para evitar duplicados.
   */
  id: string;

  /**
   * Timestamp de cuándo fue ingestado en nuestro sistema.
   * Crítico para análisis temporal y deduplicación.
   */
  ingested_at: Date;

  /**
   * Timestamp original de cuando fue creado el contenido en la fuente.
   * Esencial para análisis de trends y correlación temporal.
   */
  created_at: Date;

  /**
   * Fuente de origen del signal.
   * Permite filtros y análisis por plataforma.
   */
  source: SourceType;

  /**
   * URL original del contenido.
   * Permite rastreabilidad y verificación manual.
   */
  original_url: string;

  /**
   * Tipo de contenido detectado.
   * Determina qué algoritmos de análisis aplicar.
   */
  content_type: ContentType;

  // ========================================================================
  // PAYLOAD NORMALIZADO - Contenido para análisis NLP
  // ========================================================================

  /**
   * Texto unificado extraído del contenido.
   * Es el campo principal para análisis NLP, sentiment y entity recognition.
   * Para videos: transcript. Para imágenes: OCR + alt text. Para texto: content directo.
   */
  content_text: string;

  /**
   * Título o asunto del contenido (si aplica).
   * Para tweets: null. Para noticias: headline. Para videos: title.
   */
  title?: string;

  /**
   * Descripción adicional o metadata textual.
   * Para videos: descripción. Para noticias: summary. Para posts: caption.
   */
  description?: string;

  /**
   * URLs de medios adjuntos (imágenes, videos).
   * Almacena referencias para análisis posterior de Computer Vision.
   */
  media_urls?: string[];

  // ========================================================================
  // DATOS ESTRUCTURADOS - Información normalizada
  // ========================================================================

  /**
   * Información del autor/creador.
   * Crítica para análisis de influencia y credibilidad de la señal.
   */
  author: AuthorInfo;

  /**
   * Métricas de engagement normalizadas.
   * Permite comparar popularidad entre plataformas diferentes.
   */
  engagement: EngagementMetrics;

  /**
   * Datos de geolocalización (si están disponibles).
   * Esencial para análisis regional y segmentación geográfica.
   */
  geo_location?: GeoLocation;

  /**
   * Idioma detectado del contenido.
   * Código ISO 639-1 (en, es, fr). Crítico para NLP multiidioma.
   */
  language?: string;

  // ========================================================================
  // DATOS CRUDOS - Información específica de cada API
  // ========================================================================

  /**
   * Datos completos y sin procesar de la API original.
   * Preserva toda la información específica de cada plataforma para análisis futuros.
   * 
   * Ejemplos:
   * - Twitter: tweet object completo con metrics, context annotations, etc.
   * - TikTok: video metadata, effects used, music, etc.
   * - YouTube: video statistics, channel info, etc.
   * - News: publication info, category, tags, etc.
   */
  raw_metadata: Record<string, any>;

  /**
   * Hash del contenido original para deduplicación.
   * Permite detectar reposts y contenido duplicado entre plataformas.
   */
  content_hash?: string;

  // ========================================================================
  // CAPAS DE INTELIGENCIA - Análisis aplicado por IA
  // ========================================================================

  /**
   * Análisis de sentimiento aplicado al contenido.
   * Calculado por modelos NLP especializados.
   */
  sentiment_analysis?: {
    sentiment: SentimentType;
    confidence: number;           // Confianza del análisis (0-1)
    emotional_tags?: EmotionalTags;
  };

  /**
   * Entidades y temas identificados por NLP.
   * Base para segmentación y targeting inteligente.
   */
  entity_recognition?: EntityRecognition;

  /**
   * Score de relevancia para estrategias específicas.
   * Calculado basándose en keywords, contexto y ML models.
   */
  relevance_score?: number;      // 0-100

  /**
   * Probabilidad de que sea una oportunidad comercial.
   * Calculada por modelos predictivos entrenados.
   */
  opportunity_probability?: number; // 0-1

  /**
   * Tags personalizados aplicados por el sistema o usuario.
   * Permite clasificación custom y filtrado avanzado.
   */
  custom_tags?: string[];

  /**
   * Timestamp de la última actualización del análisis.
   * Permite reprocessing e histórico de análisis.
   */
  last_analyzed_at?: Date;

  // ========================================================================
  // METADATOS DE PROCESAMIENTO - Estado interno del sistema
  // ========================================================================

  /**
   * Estado de procesamiento del signal.
   * Permite pipeline de procesamiento asíncrono.
   */
  processing_status?: 'pending' | 'processing' | 'completed' | 'error';

  /**
   * Versión del esquema utilizada.
   * Crucial para migraciones y compatibilidad hacia atrás.
   */
  schema_version?: string;

  /**
   * Información de debug y logs de procesamiento.
   * Útil para troubleshooting y optimización de pipelines.
   */
  processing_logs?: Array<{
    timestamp: Date;
    stage: string;
    status: string;
    error?: string;
    duration_ms?: number;
  }>;
}

/**
 * Factory para crear UniversalSignal con valores por defecto.
 * Simplifica la creación de signals desde diferentes adaptadores.
 */
export class UniversalSignalFactory {
  /**
   * Crea un UniversalSignal básico con metadatos mínimos requeridos.
   * Los adaptadores pueden extender este objeto con datos específicos.
   */
  static create(
    source: SourceType,
    contentText: string,
    originalUrl: string,
    author: AuthorInfo,
    createdAt: Date = new Date()
  ): UniversalSignal {
    const now = new Date();
    
    return {
      id: `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ingested_at: now,
      created_at: createdAt,
      source,
      original_url: originalUrl,
      content_type: ContentType.TEXT, // Default, debe ser overrideado
      content_text: contentText,
      author,
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0
      },
      raw_metadata: {},
      processing_status: 'pending',
      schema_version: '1.0.0'
    };
  }
}

/**
 * Utilidades para validación y manipulación de UniversalSignal.
 */
export class UniversalSignalUtils {
  /**
   * Valida que un UniversalSignal tenga los campos mínimos requeridos.
   */
  static validate(signal: Partial<UniversalSignal>): signal is UniversalSignal {
    return !!(
      signal.id &&
      signal.ingested_at &&
      signal.created_at &&
      signal.source &&
      signal.original_url &&
      signal.content_text &&
      signal.author
    );
  }

  /**
   * Calcula un hash del contenido para deduplicación.
   */
  static calculateContentHash(signal: UniversalSignal): string {
    const content = `${signal.content_text}${signal.author.username}${signal.created_at.toISOString()}`;
    // En producción, usar una librería de hashing más robusta
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Extrae keywords principales del contenido para indexación.
   */
  static extractKeywords(signal: UniversalSignal): string[] {
    // Implementación básica - en producción usar NLP avanzado
    const text = signal.content_text.toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];
    return [...new Set(words)].slice(0, 10);
  }
}

/**
 * Tipos auxiliares para queries y filtros.
 */
export interface UniversalSignalQuery {
  sources?: SourceType[];
  content_types?: ContentType[];
  date_range?: {
    from: Date;
    to: Date;
  };
  keywords?: string[];
  sentiment?: SentimentType[];
  min_engagement?: number;
  geo_location?: {
    country?: string;
    radius_km?: number;
    center?: { lat: number; lng: number; };
  };
  authors?: string[];
  tags?: string[];
  relevance_threshold?: number;
}

export default UniversalSignal;