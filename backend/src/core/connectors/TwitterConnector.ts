/**
 * ===============================================================================
 * TWITTER CONNECTOR - ADAPTADOR PARA TWITTER API v2
 * ===============================================================================
 * 
 * Conector específico para Twitter (X) que implementa ISourceConnector.
 * Utiliza la API v2 de Twitter para buscar tweets y los convierte al formato
 * UniversalSignal estándar del sistema RADAR.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

// Tipos para Twitter API (definidos localmente para evitar dependencia estricta)
interface TweetV2 {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  conversation_id?: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: any[];
  public_metrics?: {
    like_count?: number;
    retweet_count?: number;
    reply_count?: number;
    quote_count?: number;
    impression_count?: number;
  };
  organic_metrics?: any;
  non_public_metrics?: any;
  promoted_metrics?: any;
  possibly_sensitive?: boolean;
  reply_settings?: string;
  source?: string;
  withheld?: any;
  geo?: {
    place_id?: string;
  };
  context_annotations?: any[];
  entities?: {
    urls?: Array<{
      url: string;
      expanded_url?: string;
    }>;
    hashtags?: any[];
    mentions?: any[];
  };
  attachments?: {
    media_keys?: string[];
  };
  edit_history_tweet_ids?: string[];
  edit_controls?: any;
}

interface UserV2 {
  id: string;
  username: string;
  name: string;
  created_at?: string;
  description?: string;
  entities?: any;
  location?: string;
  pinned_tweet_id?: string;
  profile_image_url?: string;
  protected?: boolean;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
  };
  url?: string;
  verified?: boolean;
  verified_type?: string;
  withheld?: any;
}

// Importación condicional de twitter-api-v2 (debe ser instalado: npm install twitter-api-v2)
// Si no está disponible, se puede simular o usar una implementación mock
let TwitterApi: any;

try {
  const twitterModule = require('twitter-api-v2');
  TwitterApi = twitterModule.TwitterApi;
} catch (error) {
  console.warn('[TwitterConnector] twitter-api-v2 module not found. Install with: npm install twitter-api-v2');
  // Mock implementation para desarrollo sin librería
  TwitterApi = class MockTwitterApi {
    constructor(token: string) {}
    v2 = {
      me: () => Promise.resolve({ data: { id: 'mock_user' } }),
      search: () => Promise.resolve({ 
        data: { 
          data: [], 
          meta: { result_count: 0 } 
        } 
      })
    };
  };
}
import { BaseConnector, ConnectorErrorType } from './BaseConnector';
import { SearchOptions, FetchResult, ConnectorHealth } from '../interfaces/ISourceConnector';
import { UniversalSignal, SourceType, ContentType, AuthorInfo, EngagementMetrics, GeoLocation } from '../../../../src/domain/models/UniversalSignal';

/**
 * Configuración específica de Twitter
 */
interface TwitterConfig {
  bearerToken: string;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessSecret?: string;
  maxTweetsPerRequest: number;
  includeRetweets: boolean;
  includePossiblySensitive: boolean;
}

/**
 * Expansiones de la API de Twitter para obtener datos completos
 */
const TWITTER_EXPANSIONS = [
  'author_id',
  'geo.place_id',
  'in_reply_to_user_id',
  'referenced_tweets.id',
  'referenced_tweets.id.author_id'
] as const;

/**
 * Campos de tweet que necesitamos
 */
const TWEET_FIELDS = [
  'id',
  'text',
  'created_at',
  'author_id',
  'conversation_id',
  'in_reply_to_user_id',
  'referenced_tweets',
  'public_metrics',
  'non_public_metrics',
  'organic_metrics',
  'promoted_metrics',
  'possibly_sensitive',
  'reply_settings',
  'source',
  'withheld',
  'geo',
  'context_annotations',
  'entities',
  'attachments',
  'edit_history_tweet_ids',
  'edit_controls'
] as const;

/**
 * Campos de usuario que necesitamos
 */
const USER_FIELDS = [
  'id',
  'username',
  'name',
  'created_at',
  'description',
  'entities',
  'location',
  'pinned_tweet_id',
  'profile_image_url',
  'protected',
  'public_metrics',
  'url',
  'verified',
  'verified_type',
  'withheld'
] as const;

/**
 * ===============================================================================
 * TWITTER CONNECTOR IMPLEMENTATION
 * ===============================================================================
 */
export class TwitterConnector extends BaseConnector {
  public readonly sourceName = SourceType.TWITTER;
  public readonly version = '1.0.0';
  public readonly description = 'Twitter API v2 connector for real-time tweet monitoring';

  private twitterClient: any; // Usar any para evitar problemas de tipo
  private twitterConfig: TwitterConfig = {
    bearerToken: '',
    maxTweetsPerRequest: 10, // Mínimo para ahorrar cuota durante pruebas
    includeRetweets: true,
    includePossiblySensitive: false
  };

  // ========================================================================
  // CONSTRUCTOR Y CONFIGURACIÓN
  // ========================================================================

  constructor() {
    super({
      enabled: false,
      timeoutMs: 30000,
      rateLimitPerMinute: 180, // Twitter permite ~180 requests por 15 min ventana
    });

    this.initializeTwitterConfig();
    this.initializeTwitterClient();
  }

  /**
   * Inicializa configuración específica de Twitter desde variables de entorno
   */
  private initializeTwitterConfig(): void {
    this.twitterConfig = {
      bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
      maxTweetsPerRequest: parseInt(process.env.TWITTER_MAX_TWEETS || '10'), // Mínimo por defecto para ahorrar cuota
      includeRetweets: process.env.TWITTER_INCLUDE_RETWEETS !== 'false',
      includePossiblySensitive: process.env.TWITTER_INCLUDE_SENSITIVE === 'true'
    };

    this.log('debug', 'Twitter configuration initialized', {
      hasBearerToken: !!this.twitterConfig.bearerToken,
      hasApiKey: !!this.twitterConfig.apiKey,
      maxTweetsPerRequest: this.twitterConfig.maxTweetsPerRequest
    });
  }

  /**
   * Inicializa cliente de Twitter API
   */
  private initializeTwitterClient(): void {
    if (this.twitterConfig.bearerToken) {
      // Usar Bearer Token para app-only authentication
      this.twitterClient = new TwitterApi(this.twitterConfig.bearerToken);
      this.config.enabled = true;
      this.log('info', 'Twitter client initialized with Bearer Token');
    } else if (this.twitterConfig.apiKey && this.twitterConfig.apiSecret) {
      // Usar API Key/Secret para app authentication
      this.twitterClient = new TwitterApi({
        appKey: this.twitterConfig.apiKey,
        appSecret: this.twitterConfig.apiSecret,
        accessToken: this.twitterConfig.accessToken,
        accessSecret: this.twitterConfig.accessSecret
      });
      this.config.enabled = true;
      this.log('info', 'Twitter client initialized with API Keys');
    } else {
      this.log('error', 'Twitter credentials not found in environment variables');
    }
  }

  // ========================================================================
  // IMPLEMENTACIÓN DE MÉTODOS ABSTRACTOS
  // ========================================================================

  /**
   * Valida que las credenciales de Twitter estén configuradas correctamente
   */
  validateConfig(): boolean {
    const hasValidAuth = !!(
      this.twitterConfig.bearerToken || 
      (this.twitterConfig.apiKey && this.twitterConfig.apiSecret)
    );

    const hasValidClient = !!this.twitterClient;

    const isValid = hasValidAuth && hasValidClient;

    this.log('debug', 'Configuration validation result', {
      hasValidAuth,
      hasValidClient,
      isValid
    });

    return isValid;
  }

  /**
   * Verifica el estado de salud de la conexión con Twitter API
   */
  async healthCheck(): Promise<ConnectorHealth> {
    this.log('debug', 'Performing Twitter API health check...');

    try {
      const startTime = Date.now();
      
      // Hacer una llamada mínima para verificar conectividad
      const response = await this.twitterClient.v2.me();
      
      const latency = Date.now() - startTime;

      this.log('info', 'Twitter API health check successful', {
        latencyMs: latency,
        userId: response.data?.id
      });

      return {
        isHealthy: true,
        statusCode: 200,
        message: 'Twitter API connection is healthy',
        lastSuccessfulCheck: new Date(),
        averageLatencyMs: latency
      };

    } catch (error) {
      const connectorError = this.handleError(error, 'healthCheck');
      
      return {
        isHealthy: false,
        statusCode: connectorError.statusCode || 500,
        message: `Twitter API health check failed: ${connectorError.message}`,
        recentErrors: [{
          timestamp: new Date(),
          error: connectorError.message,
          count: 1
        }]
      };
    }
  }

  /**
   * Implementación principal: busca tweets y los convierte a UniversalSignal
   */
  async fetchSignals(options: SearchOptions): Promise<FetchResult> {
    this.validateOperationalState();

    const startTime = Date.now();
    const signals: UniversalSignal[] = [];
    const errors: any[] = [];

    try {
      this.log('info', 'Fetching tweets from Twitter API', {
        query: options.query,
        maxResults: options.maxResults
      });

      // Construir query de Twitter
      const twitterQuery = this.buildTwitterQuery(options);
      // Forzar petición mínima para ahorrar cuota durante pruebas (min Twitter API v2 = 10)
      const maxResults = Math.min(
        Math.min(options.maxResults || 10, 10), // Forzar máximo 10 tweets por request
        this.twitterConfig.maxTweetsPerRequest
      );

      this.log('info', 'Using minimal Twitter API request for cost optimization', {
        requestedMaxResults: options.maxResults,
        forcedMaxResults: maxResults,
        message: 'Optimizado para minimizar costos de API'
      });

      // Buscar tweets usando API v2
      const searchResponse = await this.twitterClient.v2.search(twitterQuery, {
        max_results: maxResults,
        'tweet.fields': TWEET_FIELDS,
        'user.fields': USER_FIELDS,
        expansions: TWITTER_EXPANSIONS,
        start_time: options.startDate?.toISOString(),
        end_time: options.endDate?.toISOString()
      });

      this.log('debug', 'Twitter API response received', {
        tweetsCount: searchResponse.data?.data?.length || 0,
        hasUsers: !!searchResponse.data?.includes?.users,
        hasPlaces: !!searchResponse.data?.includes?.places
      });

      // Procesar cada tweet
      if (searchResponse.data?.data) {
        for (const tweet of searchResponse.data.data) {
          try {
            const signal = await this.mapTweetToUniversalSignal(
              tweet, 
              searchResponse.data?.includes?.users,
              searchResponse.data?.includes?.places
            );
            signals.push(signal);

          } catch (error) {
            const mappingError = this.handleError(error, `mapping tweet ${tweet.id}`);
            errors.push({
              message: mappingError.message,
              itemId: tweet.id,
              timestamp: new Date()
            });
          }
        }
      }

      const duration = Date.now() - startTime;

      const result: FetchResult = {
        signals,
        totalFound: searchResponse.data?.meta?.result_count || signals.length,
        processed: signals.length,
        failed: errors.length,
        durationMs: duration,
        errors: errors.length > 0 ? errors : undefined,
        nextPageToken: searchResponse.data?.meta?.next_token
      };

      this.log('info', 'Twitter signals fetch completed', {
        signalsProcessed: signals.length,
        errorsFound: errors.length,
        durationMs: duration
      });

      return result;

    } catch (error) {
      const connectorError = this.handleError(error, 'fetchSignals');
      
      // Si es un error recuperable, devolver resultado parcial
      if (connectorError.retryable && signals.length > 0) {
        this.log('warn', 'Returning partial results due to recoverable error', {
          signalsCollected: signals.length,
          errorType: connectorError.type
        });

        return {
          signals,
          totalFound: signals.length,
          processed: signals.length,
          failed: errors.length,
          durationMs: Date.now() - startTime,
          errors: [{
            message: connectorError.message,
            timestamp: new Date()
          }]
        };
      }

      throw connectorError;
    }
  }

  // ========================================================================
  // MÉTODOS DE MAPEO Y CONVERSIÓN
  // ========================================================================

  /**
   * Construye query de Twitter basándose en opciones de búsqueda
   */
  private buildTwitterQuery(options: SearchOptions): string {
    let query = options.query;

    // Aplicar filtros específicos de Twitter
    if (options.platformFilters?.twitter) {
      const filters = options.platformFilters.twitter;

      // Filtros de contenido
      if (!this.twitterConfig.includeRetweets) {
        query += ' -is:retweet';
      }

      if (!this.twitterConfig.includePossiblySensitive) {
        query += ' -is:sensitive';
      }

      // Filtros adicionales de la plataforma
      if (filters.verified) {
        query += ' from:verified';
      }

      if (filters.hasMedia) {
        query += ' has:media';
      }

      if (filters.hasLinks) {
        query += ' has:links';
      }

      if (filters.language) {
        query += ` lang:${filters.language}`;
      }
    }

    // Filtro por idioma general
    if (options.language) {
      query += ` lang:${options.language}`;
    }

    this.log('debug', 'Built Twitter query', { originalQuery: options.query, finalQuery: query });

    return query;
  }

  /**
   * Convierte un Tweet de la API de Twitter a UniversalSignal
   */
  private async mapTweetToUniversalSignal(
    tweet: TweetV2, 
    users?: UserV2[], 
    places?: any[]
  ): Promise<UniversalSignal> {
    
    // Encontrar autor del tweet
    const author = users?.find(user => user.id === tweet.author_id);
    
    if (!author) {
      throw new Error(`Author not found for tweet ${tweet.id}`);
    }

    // Mapear información del autor
    const authorInfo: AuthorInfo = {
      id: author.id,
      username: author.username,
      display_name: author.name,
      verified: author.verified || false,
      follower_count: author.public_metrics?.followers_count || 0,
      following_count: author.public_metrics?.following_count || 0,
      account_created: author.created_at ? new Date(author.created_at) : undefined,
      influence_score: this.calculateInfluenceScore(author)
    };

    // Mapear métricas de engagement
    const engagement: EngagementMetrics = {
      likes: tweet.public_metrics?.like_count || 0,
      shares: tweet.public_metrics?.retweet_count || 0, // retweets son shares
      comments: tweet.public_metrics?.reply_count || 0,
      views: tweet.public_metrics?.impression_count,
      engagement_rate: this.calculateEngagementRate(tweet, author),
      virality_score: this.calculateViralityScore(tweet)
    };

    // Mapear geolocalización si está disponible
    let geoLocation: GeoLocation | undefined;
    if (tweet.geo?.place_id && places) {
      const place = places.find(p => p.id === tweet.geo?.place_id);
      if (place) {
        geoLocation = {
          country: place.country_code,
          country_name: place.country,
          region: place.name,
          city: place.full_name
        };
      }
    }

    // Detectar idioma del contenido
    const language = this.detectLanguage(tweet.text);

    // Crear UniversalSignal
    const signal: UniversalSignal = {
      id: `twitter_${tweet.id}_${Date.now()}`,
      ingested_at: new Date(),
      created_at: new Date(tweet.created_at || Date.now()),
      source: SourceType.TWITTER,
      original_url: `https://twitter.com/${author.username}/status/${tweet.id}`,
      content_type: this.detectContentType(tweet),
      content_text: tweet.text,
      title: undefined, // Tweets no tienen título
      description: undefined,
      media_urls: this.extractMediaUrls(tweet),
      author: authorInfo,
      engagement,
      geo_location: geoLocation,
      language,
      
      // Datos crudos de Twitter
      raw_metadata: {
        id_str: tweet.id,
        conversation_id: tweet.conversation_id,
        in_reply_to_user_id: tweet.in_reply_to_user_id,
        referenced_tweets: tweet.referenced_tweets,
        source: tweet.source,
        possibly_sensitive: tweet.possibly_sensitive,
        reply_settings: tweet.reply_settings,
        context_annotations: tweet.context_annotations,
        entities: tweet.entities,
        attachments: tweet.attachments,
        edit_controls: tweet.edit_controls,
        author_raw: author,
        public_metrics: tweet.public_metrics,
        organic_metrics: tweet.organic_metrics,
        non_public_metrics: tweet.non_public_metrics
      },
      
      processing_status: 'pending',
      schema_version: '1.0.0'
    };

    this.log('debug', 'Tweet mapped to UniversalSignal', {
      tweetId: tweet.id,
      author: author.username,
      engagement: engagement.likes + engagement.shares + engagement.comments
    });

    return signal;
  }

  // ========================================================================
  // MÉTODOS AUXILIARES DE CÁLCULO Y DETECCIÓN
  // ========================================================================

  /**
   * Calcula score de influencia del autor basado en métricas
   */
  private calculateInfluenceScore(user: UserV2): number {
    if (!user.public_metrics) return 0;

    const metrics = user.public_metrics;
    const followersCount = metrics.followers_count || 0;
    const followingCount = metrics.following_count || 0;
    const tweetCount = metrics.tweet_count || 0;
    
    const followersWeight = Math.min(followersCount / 1000000, 1); // Max 1M followers = 1.0
    const ratioWeight = followersCount > 0 
      ? Math.min(followersCount / Math.max(followingCount, 1), 10) / 10 
      : 0;
    const tweetsWeight = Math.min(tweetCount / 10000, 1); // Max 10K tweets = 1.0
    const verifiedWeight = user.verified ? 0.2 : 0;

    return Math.round((followersWeight * 0.4 + ratioWeight * 0.3 + tweetsWeight * 0.1 + verifiedWeight) * 100);
  }

  /**
   * Calcula tasa de engagement del tweet
   */
  private calculateEngagementRate(tweet: TweetV2, author: UserV2): number {
    if (!tweet.public_metrics || !author.public_metrics) return 0;

    const totalEngagement = 
      (tweet.public_metrics.like_count || 0) +
      (tweet.public_metrics.retweet_count || 0) +
      (tweet.public_metrics.reply_count || 0);

    const followerCount = author.public_metrics.followers_count || 1;
    
    return totalEngagement / followerCount;
  }

  /**
   * Calcula score de viralidad del tweet
   */
  private calculateViralityScore(tweet: TweetV2): number {
    if (!tweet.public_metrics) return 0;

    const metrics = tweet.public_metrics;
    const totalEngagement = 
      (metrics.like_count || 0) +
      (metrics.retweet_count || 0) * 2 + // Retweets valen más
      (metrics.reply_count || 0) +
      (metrics.quote_count || 0) * 1.5; // Quotes también valen más

    // Normalizar a escala 0-100
    return Math.min(Math.round(Math.log10(totalEngagement + 1) * 20), 100);
  }

  /**
   * Detecta el tipo de contenido del tweet
   */
  private detectContentType(tweet: TweetV2): ContentType {
    // Verificar si tiene attachments de video
    if (tweet.attachments?.media_keys) {
      // En un escenario real, verificaríamos el tipo de media
      // Por ahora asumimos que hay media = mixed content
      return ContentType.MIXED;
    }

    // Verificar si tiene URLs (links)
    if (tweet.entities?.urls && tweet.entities.urls.length > 0) {
      return ContentType.LINK;
    }

    // Por defecto es texto
    return ContentType.TEXT;
  }

  /**
   * Extrae URLs de medios del tweet
   */
  private extractMediaUrls(tweet: TweetV2): string[] {
    const urls: string[] = [];

    // URLs de entidades
    if (tweet.entities?.urls) {
      for (const url of tweet.entities.urls) {
        if (url.expanded_url) {
          urls.push(url.expanded_url);
        }
      }
    }

    return urls;
  }

  /**
   * Detecta idioma del texto (básico)
   */
  private detectLanguage(text: string): string {
    // Implementación básica - en producción usar librería de detección de idioma
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se'];
    const englishWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'];
    
    const words = text.toLowerCase().split(/\s+/);
    const spanishCount = words.filter(word => spanishWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    if (spanishCount > englishCount) return 'es';
    if (englishCount > spanishCount) return 'en';
    
    return 'unknown';
  }
}

export default TwitterConnector;