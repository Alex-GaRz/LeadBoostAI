/**
 * ===============================================================================
 * NORMALIZATION SERVICE - PROCESAMIENTO Y LIMPIEZA DE SEÑALES
 * ===============================================================================
 * 
 * Servicio encargado de normalizar y limpiar señales de múltiples fuentes antes
 * de su almacenamiento final. Implementa Clean Architecture y principios SOLID
 * para garantizar escalabilidad y mantenibilidad del sistema de procesamiento.
 * 
 * @author LeadBoostAI - Radar System
 * @version 1.0.0
 */

import { createHash } from 'crypto';
import { DateTime } from 'luxon';
import * as he from 'he';
import striptags from 'striptags';

import { UniversalSignal, SourceType } from '../../../../src/domain/models/UniversalSignal';

/**
 * Interfaz extendida que añade campos normalizados a UniversalSignal.
 * Proporciona datos limpios y estandarizados para procesamiento posterior.
 */
export interface NormalizedSignal extends UniversalSignal {
  /** Contenido de texto limpio sin HTML, URLs resueltas, espacios extra eliminados */
  cleanContent: string;
  
  /** Fecha normalizada en formato ISO 8601 UTC */
  normalizedDate: string;
  
  /** Hash único del contenido limpio para detección de duplicados */
  contentHash: string;
  
  /** Metadatos adicionales de normalización */
  normalizationMetadata: NormalizationMetadata;
}

/**
 * Metadatos específicos del proceso de normalización.
 */
export interface NormalizationMetadata {
  /** Indica si el contenido contiene URLs */
  hasUrl: boolean;
  
  /** Indica si es un retweet/reshare (aplicable a Twitter, etc.) */
  isRetweet: boolean;
  
  /** Idioma detectado del contenido (placeholder para futura implementación) */
  languageDetected?: string;
  
  /** Indica si el contenido fue truncado por límites de API */
  isTruncated?: boolean;
  
  /** Número de URLs encontradas en el contenido original */
  urlCount: number;
  
  /** Número de menciones encontradas (@user) */
  mentionCount: number;
  
  /** Número de hashtags encontrados */
  hashtagCount: number;
  
  /** Longitud del contenido original antes de limpieza */
  originalLength: number;
  
  /** Longitud del contenido después de limpieza */
  cleanedLength: number;
  
  /** Timestamp de cuando se realizó la normalización */
  normalizedAt: string;
  
  /** Versión del servicio de normalización usado */
  normalizationVersion: string;
}

/**
 * Configuración para el proceso de normalización.
 */
interface NormalizationConfig {
  /** Longitud máxima del contenido limpio */
  maxContentLength: number;
  
  /** Si debe preservar saltos de línea */
  preserveLineBreaks: boolean;
  
  /** Si debe resolver URLs acortadas */
  resolveShortUrls: boolean;
  
  /** Si debe detectar idioma automáticamente */
  detectLanguage: boolean;
  
  /** Algoritmo de hash a usar para contentHash */
  hashAlgorithm: 'md5' | 'sha256';
}

/**
 * ===============================================================================
 * NORMALIZATION SERVICE - IMPLEMENTACIÓN PRINCIPAL
 * ===============================================================================
 */
export class NormalizationService {
  
  // ========================================================================
  // SINGLETON PATTERN IMPLEMENTATION
  // ========================================================================
  
  private static instance: NormalizationService;
  
  private readonly config: NormalizationConfig;
  private readonly version: string = '1.0.0';
  
  /**
   * Constructor privado para implementar patrón Singleton.
   */
  private constructor() {
    this.config = {
      maxContentLength: 10000,
      preserveLineBreaks: true,
      resolveShortUrls: false, // Requiere implementación futura
      detectLanguage: false,   // Requiere implementación futura
      hashAlgorithm: 'sha256'
    };
  }
  
  /**
   * Obtiene la instancia singleton del servicio.
   */
  public static getInstance(): NormalizationService {
    if (!NormalizationService.instance) {
      NormalizationService.instance = new NormalizationService();
    }
    return NormalizationService.instance;
  }
  
  // ========================================================================
  // MÉTODO PRINCIPAL - NORMALIZACIÓN DE SEÑALES
  // ========================================================================
  
  /**
   * Normaliza una señal universal aplicando limpieza de contenido,
   * estandarización de fechas y generación de metadatos.
   * 
   * @param signal - Señal original a normalizar
   * @returns Señal normalizada con campos adicionales
   * @throws Error si la señal es inválida o el procesamiento falla
   */
  public normalizeSignal(signal: UniversalSignal): NormalizedSignal {
    try {
      // Validar señal de entrada
      this.validateInputSignal(signal);
      
      // Procesar contenido de texto
      const cleanContent = this.cleanTextContent(signal.content_text);
      
      // Normalizar fecha
      const normalizedDate = this.normalizeDateToISOUTC(signal.created_at);
      
      // Generar hash del contenido limpio
      const contentHash = this.generateContentHash(cleanContent);
      
      // Extraer metadatos de normalización
      const normalizationMetadata = this.extractNormalizationMetadata(
        signal.content_text,
        cleanContent,
        signal.source
      );
      
      // Construir señal normalizada
      const normalizedSignal: NormalizedSignal = {
        ...signal,
        cleanContent,
        normalizedDate,
        contentHash,
        normalizationMetadata
      };
      
      return normalizedSignal;
      
    } catch (error) {
      throw new Error(`Normalization failed for signal ${signal.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // ========================================================================
  // MÉTODOS PRIVADOS - PROCESAMIENTO ESPECÍFICO
  // ========================================================================
  
  /**
   * Valida que la señal de entrada tenga los campos requeridos.
   */
  private validateInputSignal(signal: UniversalSignal): void {
    if (!signal) {
      throw new Error('Signal is null or undefined');
    }
    
    if (!signal.id || typeof signal.id !== 'string') {
      throw new Error('Signal must have a valid id');
    }
    
    if (!signal.content_text || typeof signal.content_text !== 'string') {
      throw new Error('Signal must have valid content_text');
    }
    
    if (!signal.created_at) {
      throw new Error('Signal must have a valid created_at date');
    }
    
    if (!signal.source) {
      throw new Error('Signal must have a valid source');
    }
  }
  
  /**
   * Limpia y normaliza el contenido de texto.
   */
  private cleanTextContent(rawContent: string): string {
    try {
      // Validación inicial
      if (!rawContent || typeof rawContent !== 'string') {
        return '';
      }
      
      return this.cleanText(rawContent);
      
    } catch (error) {
      console.error('[NormalizationService] Error cleaning text content:', error);
      // Fallback: retornar texto básico limpio en lugar de fallar
      return rawContent ? rawContent.trim().replace(/\s+/g, ' ') : '';
    }
  }
  
  /**
   * Implementación robusta de limpieza de texto.
   */
  private cleanText(rawText: string): string {
    try {
      if (!rawText || typeof rawText !== 'string') {
        return '';
      }
      
      let cleanedText = rawText;
      
      // 1. Decodificar entidades HTML usando 'he'
      try {
        cleanedText = he.decode(cleanedText);
      } catch (decodeError) {
        console.warn('[NormalizationService] HTML decode error:', decodeError);
        // Continuar con el texto original si hay error
      }
      
      // 2. Remover tags HTML usando 'striptags'
      try {
        cleanedText = striptags(cleanedText);
      } catch (stripError) {
        console.warn('[NormalizationService] HTML strip error:', stripError);
        // Continuar sin stripping si hay error
      }
      
      // 3. Extraer y procesar URLs (guardarlas antes de remover)
      const urlRegex = /https?:\/\/[^\s]+/gi;
      const urls = cleanedText.match(urlRegex) || [];
      
      // Si está configurado para preservar URLs, las normalizamos
      if (!this.config.resolveShortUrls) {
        // Remover URLs del texto limpio pero mantener metadata
        cleanedText = cleanedText.replace(urlRegex, '');
      }
      
      // 4. Normalizar espacios en blanco
      // Remover caracteres de control no imprimibles
      cleanedText = cleanedText.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Normalizar espacios: múltiples espacios/tabs/newlines a un solo espacio
      if (this.config.preserveLineBreaks) {
        // Preservar saltos de línea pero limpiar espacios extra
        cleanedText = cleanedText
          .replace(/[ \t]+/g, ' ') // Múltiples espacios/tabs → un espacio
          .replace(/\n\s*\n/g, '\n') // Múltiples newlines → uno solo
          .replace(/^\s+|\s+$/gm, ''); // Trim cada línea
      } else {
        // Convertir todo whitespace a espacios únicos
        cleanedText = cleanedText.replace(/\s+/g, ' ');
      }
      
      // 5. Trim general
      cleanedText = cleanedText.trim();
      
      // 6. Truncar si excede maxContentLength
      if (cleanedText.length > this.config.maxContentLength) {
        cleanedText = cleanedText.substring(0, this.config.maxContentLength - 3) + '...';
      }
      
      return cleanedText;
      
    } catch (error) {
      console.error('[NormalizationService] Unexpected error in cleanText:', error);
      // Fallback seguro
      return rawText ? rawText.trim().replace(/\s+/g, ' ') : '';
    }
  }
  
  /**
   * Normaliza fecha a formato ISO 8601 UTC.
   */
  private normalizeDateToISOUTC(date: Date | string): string {
    try {
      return this.standardizeDate(date);
    } catch (error) {
      console.error('[NormalizationService] Error normalizing date:', error);
      // Fallback: usar fecha actual si la normalización falla
      return new Date().toISOString();
    }
  }
  
  /**
   * Implementación robusta de estandarización de fechas usando Luxon.
   */
  private standardizeDate(dateStr: string | Date): string {
    try {
      let dateTime: DateTime;
      
      if (dateStr instanceof Date) {
        // Convertir Date a Luxon DateTime
        dateTime = DateTime.fromJSDate(dateStr);
      } else if (typeof dateStr === 'string') {
        // Intentar parsear string usando múltiples formatos
        if (dateStr.trim() === '') {
          throw new Error('Empty date string');
        }
        
        // Intentar ISO format primero
        dateTime = DateTime.fromISO(dateStr);
        
        // Si falla, intentar RFC2822
        if (!dateTime.isValid) {
          dateTime = DateTime.fromRFC2822(dateStr);
        }
        
        // Si falla, intentar HTTP format
        if (!dateTime.isValid) {
          dateTime = DateTime.fromHTTP(dateStr);
        }
        
        // Si falla, intentar parsear como timestamp
        if (!dateTime.isValid && /^\d+$/.test(dateStr)) {
          const timestamp = parseInt(dateStr, 10);
          // Determinar si es seconds o milliseconds
          const isMilliseconds = timestamp > 1e10;
          dateTime = DateTime.fromMillis(isMilliseconds ? timestamp : timestamp * 1000);
        }
        
        // Si todo falla, intentar Date.parse como último recurso
        if (!dateTime.isValid) {
          const jsDate = new Date(dateStr);
          if (!isNaN(jsDate.getTime())) {
            dateTime = DateTime.fromJSDate(jsDate);
          }
        }
      } else {
        throw new Error('Invalid date type');
      }
      
      // Validar que DateTime es válido
      if (!dateTime.isValid) {
        throw new Error(`Invalid date: ${dateTime.invalidReason || 'Unknown reason'}`);
      }
      
      // Convertir a UTC y devolver ISO string
      const isoString = dateTime.toUTC().toISO();
      if (isoString === null) {
        throw new Error('Failed to convert DateTime to ISO string');
      }
      
      return isoString;
      
    } catch (error) {
      console.error('[NormalizationService] Date standardization error:', error);
      // Fallback: intentar conversión básica
      try {
        if (dateStr instanceof Date) {
          return dateStr.toISOString();
        } else {
          const fallbackDate = new Date(dateStr);
          if (!isNaN(fallbackDate.getTime())) {
            return fallbackDate.toISOString();
          }
        }
      } catch (fallbackError) {
        console.error('[NormalizationService] Fallback date conversion failed:', fallbackError);
      }
      
      // Último recurso: fecha actual
      return new Date().toISOString();
    }
  }
  
  /**
   * Genera hash único del contenido limpio.
   */
  private generateContentHash(cleanContent: string): string {
    try {
      return this.generateHash(cleanContent);
    } catch (error) {
      console.error('[NormalizationService] Error generating content hash:', error);
      // Fallback: generar hash simple basado en longitud y timestamp
      const fallbackContent = `${cleanContent.length}_${Date.now()}`;
      return createHash('sha256').update(fallbackContent).digest('hex');
    }
  }
  
  /**
   * Implementación robusta de generación de hash SHA-256.
   */
  private generateHash(text: string): string {
    try {
      // Validación de entrada
      if (typeof text !== 'string') {
        console.warn('[NormalizationService] generateHash received non-string input, converting...');
        text = String(text || '');
      }
      
      // Si el texto está vacío, generar hash de string vacío
      if (text.length === 0) {
        text = '';
      }
      
      // Normalizar el texto para hashing consistente
      // Remover variaciones que no afectan el contenido semántico
      const normalizedForHash = text
        .trim()
        .replace(/\s+/g, ' ') // Espacios múltiples a uno
        .toLowerCase(); // Case insensitive para deduplicación
      
      // Generar hash usando el algoritmo configurado
      const hash = createHash(this.config.hashAlgorithm)
        .update(normalizedForHash, 'utf8')
        .digest('hex');
      
      return hash;
      
    } catch (error) {
      console.error('[NormalizationService] Unexpected error in generateHash:', error);
      
      // Fallback ultra seguro: hash basado en timestamp y contenido
      try {
        const fallbackContent = `fallback_${text ? text.slice(0, 10) : 'empty'}_${Date.now()}`;
        return createHash('sha256').update(fallbackContent).digest('hex');
      } catch (fallbackError) {
        console.error('[NormalizationService] Even fallback hash generation failed:', fallbackError);
        // Último recurso: hash de timestamp actual
        return createHash('sha256').update(Date.now().toString()).digest('hex');
      }
    }
  }
  
  /**
   * Extrae metadatos específicos del proceso de normalización.
   */
  private extractNormalizationMetadata(
    originalContent: string,
    cleanedContent: string,
    source: SourceType
  ): NormalizationMetadata {
    
    try {
      // Análisis de patrones en el contenido original
      const urlRegex = /https?:\/\/[^\s]+/gi;
      const mentionRegex = /@[\w]+/gi;
      const hashtagRegex = /#[\w]+/gi;
      
      const urls = originalContent.match(urlRegex) || [];
      const mentions = originalContent.match(mentionRegex) || [];
      const hashtags = originalContent.match(hashtagRegex) || [];
      
      // Detectar retweets específicos por fuente
      let isRetweet = false;
      if (source === SourceType.TWITTER) {
        isRetweet = originalContent.startsWith('RT @') || 
                    originalContent.includes('retweeted') ||
                    originalContent.includes('RT:') ||
                    /^RT\s+@\w+:/i.test(originalContent.trim());
      }
      
      // Detectar truncamiento (común en APIs con límites)
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
      console.error('[NormalizationService] Error extracting metadata:', error);
      
      // Fallback: metadata mínimo seguro
      return {
        hasUrl: false,
        isRetweet: false,
        urlCount: 0,
        mentionCount: 0,
        hashtagCount: 0,
        originalLength: originalContent ? originalContent.length : 0,
        cleanedLength: cleanedContent ? cleanedContent.length : 0,
        isTruncated: false,
        normalizedAt: new Date().toISOString(),
        normalizationVersion: this.version,
        languageDetected: undefined
      };
    }
  }
  
  /**
   * Valida la integridad de un signal normalizado.
   */
  private validateNormalizedSignal(signal: NormalizedSignal): boolean {
    
    try {
      // Validaciones esenciales del signal base
      if (!signal.id || typeof signal.id !== 'string' || signal.id.trim().length === 0) {
        console.error('[NormalizationService] Invalid signal ID:', signal.id);
        return false;
      }
      
      if (!signal.contentHash || typeof signal.contentHash !== 'string' || signal.contentHash.length < 32) {
        console.error('[NormalizationService] Invalid content hash:', signal.contentHash);
        return false;
      }
      
      if (!signal.cleanContent || typeof signal.cleanContent !== 'string') {
        console.error('[NormalizationService] Invalid clean content');
        return false;
      }
      
      if (!signal.content_text || typeof signal.content_text !== 'string') {
        console.error('[NormalizationService] Invalid original content_text');
        return false;
      }
      
      if (!signal.source || !Object.values(SourceType).includes(signal.source)) {
        console.error('[NormalizationService] Invalid source type:', signal.source);
        return false;
      }
      
      // Validaciones de timestamps
      if (!signal.created_at) {
        console.error('[NormalizationService] Missing created_at timestamp');
        return false;
      }
      
      if (!signal.normalizedDate) {
        console.error('[NormalizationService] Missing normalized date');
        return false;
      }
      
      // Validar estructura de metadata
      if (!signal.normalizationMetadata || typeof signal.normalizationMetadata !== 'object') {
        console.error('[NormalizationService] Invalid normalization metadata structure');
        return false;
      }
      
      // Validar campos específicos de metadata
      const meta = signal.normalizationMetadata;
      if (typeof meta.originalLength !== 'number' || meta.originalLength < 0) {
        console.error('[NormalizationService] Invalid original length in metadata');
        return false;
      }
      
      if (typeof meta.cleanedLength !== 'number' || meta.cleanedLength < 0) {
        console.error('[NormalizationService] Invalid cleaned length in metadata');
        return false;
      }
      
      // Validar que el contenido normalizado no esté vacío después de limpieza
      if (signal.cleanContent.trim().length === 0) {
        console.warn('[NormalizationService] Clean content is empty after normalization');
        return false;
      }
      
      // Validar que el hash sea único (longitud mínima para SHA-256)
      if (signal.contentHash.length < 64 && this.config.hashAlgorithm === 'sha256') {
        console.warn('[NormalizationService] Hash appears too short for SHA-256:', signal.contentHash.length);
      }
      
      if (signal.contentHash.length < 32 && this.config.hashAlgorithm === 'md5') {
        console.warn('[NormalizationService] Hash appears too short for MD5:', signal.contentHash.length);
      }
      
      return true;
      
    } catch (error) {
      console.error('[NormalizationService] Error validating normalized signal:', error);
      return false;
    }
  }
  
  // ========================================================================
  // MÉTODOS UTILITARIOS Y CONFIGURACIÓN
  // ========================================================================
  
  /**
   * Obtiene la configuración actual del servicio.
   */
  public getConfig(): Readonly<NormalizationConfig> {
    return { ...this.config };
  }
  
  /**
   * Actualiza la configuración del servicio.
   */
  public updateConfig(newConfig: Partial<NormalizationConfig>): void {
    Object.assign(this.config, newConfig);
  }
  
  /**
   * Obtiene estadísticas del servicio.
   */
  public getStats(): {
    version: string;
    config: NormalizationConfig;
    isInitialized: boolean;
  } {
    return {
      version: this.version,
      config: this.config,
      isInitialized: true
    };
  }
  
  /**
   * Resetea el servicio a su estado inicial.
   */
  public reset(): void {
    // Reset configuration to defaults
    this.config.maxContentLength = 10000;
    this.config.preserveLineBreaks = true;
    this.config.resolveShortUrls = false;
    this.config.detectLanguage = false;
    this.config.hashAlgorithm = 'sha256';
  }
  
  // ========================================================================
  // MÉTODOS ESTÁTICOS UTILITARIOS
  // ========================================================================
  
  /**
   * Valida si un contentHash es válido.
   */
  public static isValidHash(hash: string, algorithm: 'md5' | 'sha256' = 'sha256'): boolean {
    const expectedLength = algorithm === 'md5' ? 32 : 64;
    return typeof hash === 'string' && 
           hash.length === expectedLength && 
           /^[a-f0-9]+$/i.test(hash);
  }
  
  /**
   * Compara dos señales normalizadas para detectar duplicados.
   */
  public static areSignalsDuplicate(signal1: NormalizedSignal, signal2: NormalizedSignal): boolean {
    return signal1.contentHash === signal2.contentHash &&
           signal1.source === signal2.source;
  }
}

// ========================================================================
// EXPORTACIONES ADICIONALES
// ========================================================================

/**
 * Factory function para crear instancia del servicio (alternativa al singleton).
 */
export function createNormalizationService(): NormalizationService {
  return NormalizationService.getInstance();
}

/**
 * Función utilitaria para normalización rápida de una señal.
 */
export function normalizeSignal(signal: UniversalSignal): NormalizedSignal {
  const service = NormalizationService.getInstance();
  return service.normalizeSignal(signal);
}

/**
 * Constantes para configuración por defecto.
 */
export const NORMALIZATION_DEFAULTS = {
  MAX_CONTENT_LENGTH: 10000,
  HASH_ALGORITHM: 'sha256' as const,
  VERSION: '1.0.0'
} as const;