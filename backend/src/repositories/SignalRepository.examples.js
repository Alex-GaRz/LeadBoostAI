/**
 * ===============================================================================
 * SIGNAL REPOSITORY - EJEMPLO DE USO Y TESTING
 * ===============================================================================
 * 
 * Ejemplos prácticos de cómo usar SignalRepository en diferentes escenarios.
 * Incluye casos de uso comunes y testing básico.
 */

const { SignalRepository } = require('./SignalRepository');

/**
 * Ejemplo de uso básico del SignalRepository
 */
async function exampleUsage() {
  const signalRepo = new SignalRepository();

  // Ejemplo 1: Crear y guardar un signal de Twitter
  const twitterSignal = {
    id: 'temp_id', // Será reemplazado por ID determinista
    ingested_at: new Date(),
    created_at: new Date('2024-11-17T10:30:00Z'),
    source: 'twitter',
    original_url: 'https://twitter.com/user/status/123456789',
    content_type: 'text',
    content_text: 'Increíble oportunidad de inversión en startups de IA! 🚀 #AI #Investment #Startup',
    title: null,
    description: null,
    media_urls: [],
    
    author: {
      id: 'twitter_user_123',
      username: 'ai_investor',
      display_name: 'AI Investment Expert',
      verified: true,
      follower_count: 50000,
      following_count: 1500,
      influence_score: 85
    },

    engagement: {
      likes: 245,
      shares: 56, // retweets
      comments: 23,
      views: 1200,
      engagement_rate: 0.065,
      virality_score: 78
    },

    geo_location: {
      country: 'US',
      country_name: 'United States',
      region: 'California',
      city: 'San Francisco'
    },

    language: 'en',

    raw_metadata: {
      // Datos crudos del API de Twitter
      id_str: '123456789',
      user: {
        screen_name: 'ai_investor',
        followers_count: 50000,
        verified: true
      },
      entities: {
        hashtags: [
          { text: 'AI' },
          { text: 'Investment' },
          { text: 'Startup' }
        ]
      },
      public_metrics: {
        like_count: 245,
        retweet_count: 56,
        reply_count: 23,
        quote_count: 8
      }
    },

    processing_status: 'pending',
    schema_version: '1.0.0'
  };

  console.log('🚀 Guardando signal de Twitter...');
  const saveResult = await signalRepo.saveSignal(twitterSignal);
  
  if (saveResult.success) {
    console.log('✅ Signal guardado exitosamente:', saveResult.data);
    console.log('📊 Metadata:', saveResult.metadata);
    
    // Ejemplo 2: Obtener el signal guardado
    console.log('\n📖 Obteniendo signal guardado...');
    const getResult = await signalRepo.getSignal(saveResult.data);
    
    if (getResult.success) {
      console.log('✅ Signal obtenido:', getResult.data.content_text);
    }
    
    // Ejemplo 3: Buscar signals de Twitter
    console.log('\n🔍 Buscando signals de Twitter...');
    const twitterSignals = await signalRepo.getSignalsBySource('twitter', 10);
    
    if (twitterSignals.success) {
      console.log(`✅ Encontrados ${twitterSignals.data.length} signals de Twitter`);
    }
    
    // Ejemplo 4: Actualizar estado de procesamiento
    console.log('\n⚙️ Actualizando estado de procesamiento...');
    const updateResult = await signalRepo.updateProcessingStatus(
      saveResult.data,
      'completed',
      [
        {
          timestamp: new Date(),
          stage: 'sentiment_analysis',
          status: 'completed',
          duration_ms: 150
        },
        {
          timestamp: new Date(),
          stage: 'entity_recognition',
          status: 'completed', 
          duration_ms: 75
        }
      ]
    );
    
    if (updateResult.success) {
      console.log('✅ Estado de procesamiento actualizado');
    }

  } else {
    console.error('❌ Error guardando signal:', saveResult.error);
  }
}

/**
 * Ejemplo de uso con signal de TikTok
 */
async function exampleTikTokSignal() {
  const signalRepo = new SignalRepository();

  const tiktokSignal = {
    id: 'temp_id',
    ingested_at: new Date(),
    created_at: new Date('2024-11-17T14:15:00Z'),
    source: 'tiktok',
    original_url: 'https://www.tiktok.com/@user/video/7123456789',
    content_type: 'video',
    content_text: 'Tutorial increíble sobre marketing digital que TODOS necesitan ver! 💯 #MarketingTips #DigitalMarketing #Business',
    title: 'Tutorial de Marketing Digital',
    description: 'Los mejores tips de marketing que aprendí trabajando en Silicon Valley',
    media_urls: ['https://tiktok-cdn.com/video123.mp4'],

    author: {
      id: 'tiktok_user_456',
      username: 'marketing_guru',
      display_name: 'Marketing Guru 📈',
      verified: false,
      follower_count: 125000,
      following_count: 500,
      influence_score: 92
    },

    engagement: {
      likes: 15600,
      shares: 2400,
      comments: 890,
      views: 234000,
      saves: 3200,
      engagement_rate: 0.095,
      virality_score: 94,
      velocity: 450 // likes por hora
    },

    geo_location: {
      country: 'MX',
      country_name: 'Mexico',
      region: 'CDMX',
      city: 'Ciudad de México'
    },

    language: 'es',

    raw_metadata: {
      id: '7123456789',
      video: {
        duration: 45,
        resolution: '1080x1920',
        effects: ['effect_1', 'beauty_filter']
      },
      music: {
        title: 'Trending Sound 2024',
        author: 'Popular Artist'
      },
      stats: {
        play_count: 234000,
        like_count: 15600,
        comment_count: 890,
        share_count: 2400
      }
    },

    processing_status: 'pending',
    schema_version: '1.0.0'
  };

  console.log('🎵 Guardando signal de TikTok...');
  const result = await signalRepo.saveSignal(tiktokSignal);
  
  if (result.success) {
    console.log('✅ TikTok signal guardado:', result.data);
  } else {
    console.error('❌ Error:', result.error);
  }
}

/**
 * Ejemplo de queries avanzadas
 */
async function exampleAdvancedQueries() {
  const signalRepo = new SignalRepository();

  console.log('🔍 Ejecutando queries avanzadas...');

  // Query 1: Signals con alto engagement de las últimas 24 horas
  const highEngagementSignals = await signalRepo.querySignals({
    dateRange: {
      from: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 horas atrás
      to: new Date()
    },
    filters: [
      { field: 'engagement.virality_score', operator: '>=', value: 80 }
    ],
    orderBy: { field: 'engagement.virality_score', direction: 'desc' },
    limit: 20
  });

  if (highEngagementSignals.success) {
    console.log(`✅ Encontrados ${highEngagementSignals.data.length} signals con alto engagement`);
  }

  // Query 2: Signals en español con keywords específicas
  const spanishMarketingSignals = await signalRepo.querySignals({
    filters: [
      { field: 'language', operator: '==', value: 'es' },
      { field: 'processing_status', operator: '==', value: 'completed' }
    ],
    orderBy: { field: 'created_at', direction: 'desc' },
    limit: 50
  });

  if (spanishMarketingSignals.success) {
    console.log(`✅ Encontrados ${spanishMarketingSignals.data.length} signals en español procesados`);
  }

  // Query 3: Signals recientes para monitoreo
  const recentSignals = await signalRepo.getRecentSignals(25);
  
  if (recentSignals.success) {
    console.log(`✅ Últimos ${recentSignals.data.length} signals para monitoreo`);
  }
}

/**
 * Test de deduplicación
 */
async function testDeduplication() {
  const signalRepo = new SignalRepository();

  console.log('🔄 Testeando deduplicación...');

  const baseSignal = {
    id: 'temp_id',
    ingested_at: new Date(),
    created_at: new Date('2024-11-17T15:00:00Z'),
    source: 'twitter',
    original_url: 'https://twitter.com/test/status/duplicate_test',
    content_type: 'text',
    content_text: 'Este es un tweet para testear deduplicación',
    author: {
      id: 'test_user',
      username: 'test_user',
      display_name: 'Test User',
      verified: false
    },
    engagement: { likes: 5, shares: 1, comments: 0 },
    raw_metadata: { id_str: 'duplicate_test' },
    processing_status: 'pending',
    schema_version: '1.0.0'
  };

  // Guardar primera vez
  const firstSave = await signalRepo.saveSignal(baseSignal);
  console.log('Primera guardada:', firstSave.metadata?.operation);

  // Guardar segunda vez (mismo signal)
  const secondSave = await signalRepo.saveSignal({
    ...baseSignal,
    content_text: 'Este es un tweet ACTUALIZADO para testear deduplicación',
    engagement: { likes: 10, shares: 2, comments: 1 } // Engagement actualizado
  });
  console.log('Segunda guardada:', secondSave.metadata?.operation);
  console.log('Fue actualización?', secondSave.metadata?.wasUpdated);

  // Verificar que el ID es el mismo
  console.log('Mismo ID?', firstSave.data === secondSave.data);
}

/**
 * Ejecutar todos los ejemplos
 */
async function runAllExamples() {
  console.log('===============================================================================');
  console.log('🚀 SIGNAL REPOSITORY - EJEMPLOS DE USO');
  console.log('===============================================================================\n');

  try {
    await exampleUsage();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exampleTikTokSignal();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await exampleAdvancedQueries();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await testDeduplication();
    
    console.log('\n✅ Todos los ejemplos ejecutados exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en ejemplos:', error);
  }
}

// Exportar funciones para uso externo
module.exports = {
  exampleUsage,
  exampleTikTokSignal,
  exampleAdvancedQueries,
  testDeduplication,
  runAllExamples
};

// Si se ejecuta directamente, correr ejemplos
if (require.main === module) {
  runAllExamples();
}