/**
 * ===============================================================================
 * NEWS API CONNECTOR - ADAPTADOR PARA NEWSAPI.ORG
 * ===============================================================================
 * 
 * Conector específico para NewsAPI.org que implementa ISourceConnector.
 * Utiliza la API REST de NewsAPI para buscar noticias globales y las convierte 
 * al formato UniversalSignal estándar del sistema RADAR.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

const axios = require('axios');

/**
 * Tipos de fuente - Copiados del enum SourceType
 */
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
 * Tipos de contenido - Copiados del enum ContentType
 */
const ContentType = {
  TEXT: 'text',
  VIDEO: 'video',
  IMAGE: 'image',
  AUDIO: 'audio',
  MIXED: 'mixed',
  LINK: 'link'
};

/**
 * Tipos de errores categorizados para manejo uniforme.
 */
const ConnectorErrorType = {
  CONFIG_ERROR: 'CONFIG_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR'
};

/**
 * Clase base simplificada para el conector
 */
class SimpleBaseConnector {
  constructor(initialConfig = {}) {
    this.config = {
      enabled: false,
      timeoutMs: 30000,
      rateLimitPerMinute: 60,
      ...initialConfig
    };
    
    this.stats = this.initializeStats();
    this.loggerConfig = {
      enabled: true,
      logLevel: 'info',
      includeTimestamp: true
    };
  }

  initializeStats() {
    return {
      totalRequests: 0,
      totalSuccess: 0,
      totalErrors: 0,
      lastRequestDuration: 0,
      totalSignalsCollected: 0,
      firstRequestAt: null,
      lastRequestAt: null
    };
  }

  log(level, message, data) {
    if (!this.loggerConfig.enabled) return;
    
    const timestamp = this.loggerConfig.includeTimestamp 
      ? new Date().toISOString() 
      : '';
    
    const prefix = `[${this.sourceName || 'CONNECTOR'}${this.loggerConfig.includeTimestamp ? ` - ${timestamp}` : ''}]`;
    const formattedMessage = `${prefix} ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'debug':
      case 'info':
        console.log(formattedMessage, data ? data : '');
        break;
      case 'warn':
        console.warn(formattedMessage, data ? data : '');
        break;
      case 'error':
        console.error(formattedMessage, data ? data : '');
        break;
    }
  }

  createError(type, message, details) {
    const error = new Error(message);
    error.type = type;
    error.details = details;
    return error;
  }
}

/**
 * Códigos de error específicos de NewsAPI
 */
const NEWS_API_ERROR_CODES = {
  apiKeyDisabled: 'apiKeyDisabled',
  apiKeyExhausted: 'apiKeyExhausted', 
  apiKeyInvalid: 'apiKeyInvalid',
  apiKeyMissing: 'apiKeyMissing',
  parameterInvalid: 'parameterInvalid',
  parametersMissing: 'parametersMissing',
  rateLimited: 'rateLimited',
  sourcesTooMany: 'sourcesTooMany',
  sourceDoesNotExist: 'sourceDoesNotExist',
  unexpectedError: 'unexpectedError'
};

/**
 * ===============================================================================
 * NEWSAPI CONNECTOR - IMPLEMENTACIÓN PRINCIPAL
 * ===============================================================================
 */
class NewsApiConnector extends SimpleBaseConnector {
  
  constructor() {
    super({
      enabled: true,
      rateLimitPerMinute: 42, // Conservador para plan gratuito
      timeoutMs: 15000, // 15 segundos timeout
      customConfig: {
        retryAttempts: 3,
        retryDelayMs: 1000
      }
    });
    
    // Propiedades específicas
    this.sourceName = SourceType.NEWS_API;
    this.sourceType = SourceType.NEWS_API;
    
    // Rate limiting para NewsAPI (Developer plan: 1000 requests/day)
    this.DEFAULT_RATE_LIMIT = 42; // ~42 requests/hora para no exceder 1000/día
    this.API_BASE_URL = 'https://newsapi.org/v2';
    
    // Configuración específica de NewsAPI
    this.newsApiConfig = {
      apiKey: process.env.NEWS_API_KEY || '',
      baseUrl: this.API_BASE_URL,
      maxArticlesPerRequest: 100, // Máximo permitido por NewsAPI
      sortBy: 'relevancy',
      language: 'en', // Inglés por defecto para mayor cobertura
      searchIn: 'title,description', // Buscar en título y descripción
      excludeDomains: ['reddit.com', 'twitter.com'] // Evitar duplicados con otros conectores
    };
    
    // Configurar axios con interceptores
    this.axiosInstance = axios.create({
      baseURL: this.newsApiConfig.baseUrl,
      timeout: this.config.timeoutMs,
      headers: {
        'X-API-Key': this.newsApiConfig.apiKey,
        'User-Agent': 'LeadBoostAI-RADAR/1.0'
      }
    });
    
    this.setupAxiosInterceptors();
    this.log('info', 'NewsApiConnector initialized');
  }
  
  // ========================================================================
  // VALIDACIÓN DE CONFIGURACIÓN
  // ========================================================================
  
  validateConfig() {
    const issues = [];
    
    // Verificar API Key
    if (!this.newsApiConfig.apiKey) {
      issues.push('NEWS_API_KEY environment variable is required');
    }
    
    if (this.newsApiConfig.apiKey && this.newsApiConfig.apiKey.length < 30) {
      issues.push('NEWS_API_KEY appears to be invalid (too short)');
    }
    
    // Verificar configuración básica
    if (!this.newsApiConfig.baseUrl) {
      issues.push('Base URL is required');
    }
    
    if (this.newsApiConfig.maxArticlesPerRequest > 100) {
      issues.push('Max articles per request cannot exceed 100 (NewsAPI limit)');
    }
    
    if (issues.length > 0) {
      this.log('error', 'Configuration validation failed', { issues });
      return false;
    }
    
    this.log('info', 'Configuration validation passed');
    return true;
  }
  
  // ========================================================================
  // IMPLEMENTACIÓN PRINCIPAL - FETCH SIGNALS
  // ========================================================================
  
  async fetchSignals(options) {
    const startTime = Date.now();
    this.stats.totalRequests++;
    
    this.log('info', `Fetching news signals for query: "${options.query}"`);
    
    try {
      // Validar configuración antes de proceder
      if (!this.validateConfig()) {
        throw this.createError(ConnectorErrorType.CONFIG_ERROR, 'Invalid configuration');
      }
      
      // Preparar parámetros de búsqueda
      const searchParams = this.buildSearchParams(options);
      this.log('debug', 'Search parameters prepared', searchParams);
      
      // Realizar petición a NewsAPI
      const response = await this.makeApiRequest('/everything', searchParams);
      
      // Procesar respuesta
      const result = await this.processNewsApiResponse(response, startTime);
      
      // Actualizar estadísticas
      this.updateStats(result, startTime);
      
      this.log('info', `Successfully fetched ${result.signals.length} news signals`);
      return result;
      
    } catch (error) {
      this.stats.totalErrors++;
      this.handleFetchError(error, startTime);
      throw error;
    }
  }
  
  // ========================================================================
  // CONSTRUCCIÓN DE PARÁMETROS DE BÚSQUEDA
  // ========================================================================
  
  buildSearchParams(options) {
    const params = {
      q: options.query,
      apiKey: this.newsApiConfig.apiKey,
      language: this.newsApiConfig.language,
      sortBy: this.newsApiConfig.sortBy,
      searchIn: this.newsApiConfig.searchIn,
      pageSize: Math.min(options.maxResults || 50, this.newsApiConfig.maxArticlesPerRequest)
    };
    
    // Filtros temporales
    if (options.startDate) {
      params.from = options.startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    if (options.endDate) {
      params.to = options.endDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // Filtros de plataforma específicos
    if (options.platformFilters) {
      if (options.platformFilters.domains) {
        params.domains = Array.isArray(options.platformFilters.domains) 
          ? options.platformFilters.domains.join(',')
          : options.platformFilters.domains;
      }
      
      if (options.platformFilters.excludeDomains) {
        params.excludeDomains = Array.isArray(options.platformFilters.excludeDomains)
          ? options.platformFilters.excludeDomains.join(',')
          : options.platformFilters.excludeDomains;
      }
      
      if (options.platformFilters.sources) {
        params.sources = Array.isArray(options.platformFilters.sources)
          ? options.platformFilters.sources.join(',')
          : options.platformFilters.sources;
      }
      
      if (options.platformFilters.language) {
        params.language = options.platformFilters.language;
      }
      
      if (options.platformFilters.sortBy) {
        params.sortBy = options.platformFilters.sortBy;
      }
    }
    
    // Aplicar dominios excluidos por defecto
    if (this.newsApiConfig.excludeDomains && this.newsApiConfig.excludeDomains.length > 0) {
      params.excludeDomains = this.newsApiConfig.excludeDomains.join(',');
    }
    
    return params;
  }
  
  // ========================================================================
  // PETICIÓN A API
  // ========================================================================
  
  async makeApiRequest(endpoint, params) {
    try {
      this.log('debug', `Making request to ${endpoint}`, { params });
      
      const response = await this.axiosInstance.get(endpoint, {
        params,
        validateStatus: (status) => status < 500 // Permitir 4xx para manejar errores específicos
      });
      
      // Manejar respuestas de error de NewsAPI
      if (response.data.status === 'error') {
        this.handleNewsApiError(response.data);
      }
      
      return response;
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.log('error', 'Axios error in API request', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        // Categorizar error según status code
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw this.createError(ConnectorErrorType.TIMEOUT_ERROR, `Request timeout: ${error.message}`);
        }
        
        if (error.response?.status === 429) {
          throw this.createError(ConnectorErrorType.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded');
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw this.createError(ConnectorErrorType.AUTH_ERROR, 'Authentication failed');
        }
        
        if (error.response?.status === 404) {
          throw this.createError(ConnectorErrorType.NOT_FOUND_ERROR, 'Endpoint not found');
        }
        
        throw this.createError(ConnectorErrorType.NETWORK_ERROR, `Network error: ${error.message}`);
      }
      
      throw this.createError(ConnectorErrorType.API_ERROR, `Unexpected error: ${error}`);
    }
  }
  
  // ========================================================================
  // MANEJO DE ERRORES ESPECÍFICOS DE NEWSAPI
  // ========================================================================
  
  handleNewsApiError(errorResponse) {
    const { code, message } = errorResponse;
    
    switch (code) {
      case NEWS_API_ERROR_CODES.apiKeyInvalid:
      case NEWS_API_ERROR_CODES.apiKeyMissing:
        throw this.createError(ConnectorErrorType.AUTH_ERROR, `API Key error: ${message}`);
        
      case NEWS_API_ERROR_CODES.apiKeyDisabled:
        throw this.createError(ConnectorErrorType.AUTH_ERROR, `API Key disabled: ${message}`);
        
      case NEWS_API_ERROR_CODES.apiKeyExhausted:
      case NEWS_API_ERROR_CODES.rateLimited:
        throw this.createError(ConnectorErrorType.RATE_LIMIT_EXCEEDED, `Rate limit exceeded: ${message}`);
        
      case NEWS_API_ERROR_CODES.parameterInvalid:
      case NEWS_API_ERROR_CODES.parametersMissing:
        throw this.createError(ConnectorErrorType.VALIDATION_ERROR, `Parameter error: ${message}`);
        
      case NEWS_API_ERROR_CODES.sourcesTooMany:
      case NEWS_API_ERROR_CODES.sourceDoesNotExist:
        throw this.createError(ConnectorErrorType.VALIDATION_ERROR, `Source error: ${message}`);
        
      default:
        throw this.createError(ConnectorErrorType.API_ERROR, `NewsAPI error: ${message}`);
    }
  }
  
  // ========================================================================
  // PROCESAMIENTO DE RESPUESTA
  // ========================================================================
  
  async processNewsApiResponse(response, startTime) {
    const { data } = response;
    const signals = [];
    const errors = [];
    
    if (!data.articles || data.articles.length === 0) {
      this.log('info', 'No articles found in response');
      return {
        signals: [],
        totalFound: 0,
        processed: 0,
        failed: 0,
        durationMs: Date.now() - startTime,
        errors: []
      };
    }
    
    // Procesar cada artículo
    for (const article of data.articles) {
      try {
        const signal = await this.mapArticleToUniversalSignal(article);
        signals.push(signal);
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        this.log('warn', `Failed to process article: ${article.title}`, { error: errorMsg });
        
        errors.push({
          message: `Failed to process article: ${errorMsg}`,
          itemId: article.url,
          timestamp: new Date()
        });
      }
    }
    
    this.log('info', `Processed ${signals.length}/${data.articles.length} articles successfully`);
    
    return {
      signals,
      totalFound: data.totalResults,
      processed: signals.length,
      failed: data.articles.length - signals.length,
      durationMs: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  // ========================================================================
  // MAPEO INTELIGENTE A UNIVERSAL SIGNAL
  // ========================================================================
  
  async mapArticleToUniversalSignal(article) {
    // Construir contenido combinando título y descripción
    const contentParts = [article.title];
    if (article.description && article.description !== article.title) {
      contentParts.push(article.description);
    }
    const content_text = contentParts.join('\n\n');
    
    // Extraer información del autor
    const author_info = {
      id: article.source.id || article.source.name.toLowerCase().replace(/\s+/g, '_'),
      username: article.source.name,
      display_name: article.author || article.source.name,
      profile_url: undefined, // NewsAPI no proporciona URL del perfil
      verified: false // NewsAPI no proporciona información de verificación
    };
    
    // Métricas de engagement (NewsAPI no las proporciona, usamos valores por defecto)
    const engagement_metrics = {
      likes: 0,
      shares: 0,
      comments: 0,
      views: 0,
      reactions: {}
    };
    
    // Metadata específica de noticias
    const metadata = {
      // Información de la fuente
      source_name: article.source.name,
      source_id: article.source.id,
      
      // URL y contenido adicional
      article_url: article.url,
      image_url: article.urlToImage,
      full_content: article.content,
      
      // Información del autor
      author_name: article.author,
      
      // Información adicional
      published_at: article.publishedAt,
      content_preview: article.description,
      
      // Clasificación de contenido
      content_type: 'news_article',
      language: this.newsApiConfig.language,
      
      // Metadatos del conector
      connector_version: '1.0.0',
      processed_at: new Date().toISOString(),
      api_source: 'newsapi.org'
    };
    
    // Crear el UniversalSignal
    const signal = {
      // Identificadores únicos
      id: this.generateSignalId(article.url),
      platform_id: article.url, // URL como ID único de la plataforma
      
      // Información de fuente
      source: this.sourceType,
      content_type: ContentType.TEXT,
      
      // Contenido principal
      content_text,
      
      // Información del autor
      author_info,
      
      // Métricas
      engagement_metrics,
      
      // Timestamps
      created_at: new Date(article.publishedAt),
      collected_at: new Date(),
      
      // Ubicación (no disponible en NewsAPI)
      location: undefined,
      
      // Metadatos extensos
      metadata,
      
      // URLs relacionadas
      url: article.url,
      
      // Procesamiento interno
      processed: true,
      processing_notes: [`Processed by NewsApiConnector v1.0.0 at ${new Date().toISOString()}`]
    };
    
    return signal;
  }
  
  // ========================================================================
  // GENERACIÓN DE ID ÚNICO
  // ========================================================================
  
  generateSignalId(url) {
    // Usar URL como base para generar ID único y reproducible
    const urlHash = Buffer.from(url).toString('base64').replace(/[+/=]/g, '').substring(0, 16);
    const timestamp = Date.now().toString(36);
    return `news_${urlHash}_${timestamp}`;
  }
  
  // ========================================================================
  // HEALTH CHECK
  // ========================================================================
  
  async healthCheck() {
    const startTime = Date.now();
    
    try {
      this.log('debug', 'Starting health check');
      
      // Verificar configuración
      if (!this.validateConfig()) {
        return {
          healthy: false,
          message: 'Configuration validation failed',
          details: { configValid: false },
          timestamp: new Date(),
          responseTimeMs: Date.now() - startTime
        };
      }
      
      // Hacer un request simple a NewsAPI para verificar conectividad
      const testResponse = await this.axiosInstance.get('/everything', {
        params: {
          q: 'test',
          apiKey: this.newsApiConfig.apiKey,
          pageSize: 1
        }
      });
      
      const isHealthy = testResponse.status === 200 && testResponse.data.status === 'ok';
      const responseTime = Date.now() - startTime;
      
      this.log('info', `Health check completed - Status: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      return {
        healthy: isHealthy,
        message: isHealthy ? 'NewsAPI connector is healthy' : 'NewsAPI connector is not responding correctly',
        details: {
          configValid: true,
          apiResponseTime: responseTime,
          apiStatus: testResponse.data.status,
          rateLimitRemaining: this.extractRateLimitInfo(testResponse)
        },
        timestamp: new Date(),
        responseTimeMs: responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.log('error', 'Health check failed', { error: errorMessage });
      
      return {
        healthy: false,
        message: `Health check failed: ${errorMessage}`,
        details: {
          error: errorMessage,
          configValid: this.validateConfig()
        },
        timestamp: new Date(),
        responseTimeMs: responseTime
      };
    }
  }
  
  // ========================================================================
  // CONFIGURACIÓN DE INTERCEPTORES AXIOS
  // ========================================================================
  
  setupAxiosInterceptors() {
    // Request interceptor para logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.log('debug', `API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          timeout: config.timeout
        });
        return config;
      },
      (error) => {
        this.log('error', 'Request interceptor error', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor para logging y rate limit tracking
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.log('debug', `API Response: ${response.status} ${response.statusText}`, {
          dataSize: JSON.stringify(response.data).length,
          rateLimitRemaining: this.extractRateLimitInfo(response)
        });
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          this.log('error', `API Error: ${error.response?.status} ${error.response?.statusText}`, {
            data: error.response?.data,
            config: error.config
          });
        }
        return Promise.reject(error);
      }
    );
  }
  
  // ========================================================================
  // UTILIDADES
  // ========================================================================
  
  /**
   * Extrae información de rate limiting de los headers de respuesta
   */
  extractRateLimitInfo(response) {
    const headers = response.headers;
    
    return {
      remaining: headers['x-api-key-requests-remaining'] || 'unknown',
      resetTime: headers['x-api-key-requests-reset'] || 'unknown'
    };
  }
  
  /**
   * Actualiza estadísticas internas del conector
   */
  updateStats(result, startTime) {
    this.stats.totalSuccess++;
    this.stats.lastRequestDuration = Date.now() - startTime;
    this.stats.totalSignalsCollected += result.signals.length;
    
    if (result.failed > 0) {
      this.stats.totalErrors += result.failed;
    }
  }
  
  /**
   * Maneja errores durante fetch operation
   */
  handleFetchError(error, startTime) {
    this.stats.lastRequestDuration = Date.now() - startTime;
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.log('error', `Fetch operation failed: ${errorMessage}`, error);
  }
  
  /**
   * Obtiene información de configuración actual (sin exponer secrets)
   */
  getConfigInfo() {
    return {
      sourceName: this.sourceName,
      sourceType: this.sourceType,
      enabled: this.config.enabled,
      rateLimitPerMinute: this.config.rateLimitPerMinute,
      timeoutMs: this.config.timeoutMs,
      language: this.newsApiConfig.language,
      sortBy: this.newsApiConfig.sortBy,
      maxArticlesPerRequest: this.newsApiConfig.maxArticlesPerRequest,
      hasApiKey: !!this.newsApiConfig.apiKey,
      baseUrl: this.newsApiConfig.baseUrl
    };
  }
  
  /**
   * Resetea estadísticas del conector
   */
  resetStats() {
    this.stats = this.initializeStats();
    this.log('info', 'Connector statistics reset');
  }
}

module.exports = { NewsApiConnector };