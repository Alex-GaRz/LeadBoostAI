
-- =============================================================================
-- RFC-PHOENIX-02: FASE 2 - Sistema de Mensajería Resiliente
-- Database Schema for Kafka Integration & Messaging Infrastructure
-- =============================================================================

-- Extensión para UUID (si no está ya creada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLA: sys.consumer_offsets_log
-- Propósito: Control granular de offsets por consumidor para replays controlados
-- RFC Sección 6
-- =============================================================================

CREATE TABLE IF NOT EXISTS sys.consumer_offsets_log (
    consumer_group VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    partition INT NOT NULL,
    committed_offset BIGINT NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    PRIMARY KEY (consumer_group, topic, partition)
);

-- Índice para búsquedas rápidas por grupo
CREATE INDEX IF NOT EXISTS idx_consumer_offsets_group 
ON sys.consumer_offsets_log(consumer_group, last_updated DESC);

-- Índice para búsquedas por tópico
CREATE INDEX IF NOT EXISTS idx_consumer_offsets_topic 
ON sys.consumer_offsets_log(topic, partition);

COMMENT ON TABLE sys.consumer_offsets_log IS 
'Registro de offsets comprometidos por consumidor para auditoría y replay controlado';

COMMENT ON COLUMN sys.consumer_offsets_log.consumer_group IS 
'Identificador del grupo de consumidores (ej: actuator-service)';

COMMENT ON COLUMN sys.consumer_offsets_log.committed_offset IS 
'Último offset comprometido exitosamente';

COMMENT ON COLUMN sys.consumer_offsets_log.metadata IS 
'Metadatos adicionales: timestamp de commit, versión de consumer, etc.';


-- =============================================================================
-- TABLA: sys.message_traceability
-- Propósito: Trazabilidad forense de mensajes Kafka procesados
-- Permite rastrear qué mensaje originó qué transacción
-- RFC Sección 6
-- =============================================================================

CREATE TABLE IF NOT EXISTS sys.message_traceability (
    kafka_message_id VARCHAR(255) PRIMARY KEY,
    topic VARCHAR(100) NOT NULL,
    partition INT NOT NULL,
    "offset" BIGINT NOT NULL,
    consumer_group VARCHAR(100) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PROCESSED', 'DUPLICATE', 'DLQ', 'SKIPPED')),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    saga_correlation_id UUID,
    event_type TEXT NOT NULL DEFAULT 'UNKNOWN',
    payload_hash VARCHAR(64),  -- SHA256 hash del payload para verificación
    headers JSONB,
    processing_duration_ms INT,
    error_message TEXT,
    CONSTRAINT fk_saga_correlation 
        FOREIGN KEY (saga_correlation_id) 
        REFERENCES sys.sagas(correlation_id) 
        ON DELETE SET NULL
);

-- Índice para búsquedas por correlación de SAGA
CREATE INDEX IF NOT EXISTS idx_message_traceability_saga 
ON sys.message_traceability(saga_correlation_id, processed_at DESC);

-- Índice para búsquedas por tópico y estado
CREATE INDEX IF NOT EXISTS idx_message_traceability_topic_status 
ON sys.message_traceability(topic, status, processed_at DESC);

-- Índice para búsquedas por offset (para debugging)
CREATE INDEX IF NOT EXISTS idx_message_traceability_offset 
ON sys.message_traceability(topic, partition, "offset");

-- Índice para búsquedas por consumer group
CREATE INDEX IF NOT EXISTS idx_message_traceability_consumer 
ON sys.message_traceability(consumer_group, processed_at DESC);

COMMENT ON TABLE sys.message_traceability IS 
'Registro forense de todos los mensajes procesados desde Kafka con trazabilidad completa';

COMMENT ON COLUMN sys.message_traceability.kafka_message_id IS 
'ID único del mensaje (header Message-ID o hash de topic+partition+offset)';

COMMENT ON COLUMN sys.message_traceability.status IS 
'Estado del procesamiento: PROCESSED (éxito), DUPLICATE (ya procesado), DLQ (fallido), SKIPPED (ignorado)';

COMMENT ON COLUMN sys.message_traceability.saga_correlation_id IS 
'Link opcional a la SAGA que generó o consumió este mensaje';

COMMENT ON COLUMN sys.message_traceability.payload_hash IS 
'Hash SHA256 del payload para verificación de integridad';


-- =============================================================================
-- TABLA: sys.dead_letters
-- Propósito: Dead Letter Queue para mensajes fallidos tras reintentos
-- Permite revisión humana y replay manual
-- RFC Sección 5.1
-- =============================================================================

CREATE TABLE IF NOT EXISTS sys.dead_letters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_topic VARCHAR(100) NOT NULL,
    original_partition INT NOT NULL,
    original_offset BIGINT NOT NULL,
    consumer_group VARCHAR(100) NOT NULL,
    exception_class VARCHAR(200),
    exception_message TEXT,
    stack_trace TEXT,
    payload JSONB NOT NULL,
    headers JSONB,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_retry_at TIMESTAMPTZ,
    replay_status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (replay_status IN ('PENDING', 'REPLAYED', 'ARCHIVED', 'IGNORED')),
    replay_at TIMESTAMPTZ,
    replay_by VARCHAR(100),
    resolution_notes TEXT
);

-- Índice para búsquedas por estado de replay
CREATE INDEX IF NOT EXISTS idx_dead_letters_replay_status 
ON sys.dead_letters(replay_status, created_at DESC);

-- Índice para búsquedas por tópico original
CREATE INDEX IF NOT EXISTS idx_dead_letters_topic 
ON sys.dead_letters(original_topic, created_at DESC);

-- Índice para búsquedas por consumer group
CREATE INDEX IF NOT EXISTS idx_dead_letters_consumer 
ON sys.dead_letters(consumer_group, created_at DESC);

-- Índice para búsquedas por tipo de excepción (análisis de errores)
CREATE INDEX IF NOT EXISTS idx_dead_letters_exception 
ON sys.dead_letters(exception_class, created_at DESC);

COMMENT ON TABLE sys.dead_letters IS 
'Cola de mensajes fallidos tras reintentos para revisión manual y replay';

COMMENT ON COLUMN sys.dead_letters.replay_status IS 
'Estado del mensaje: PENDING (pendiente revisión), REPLAYED (reenviado), ARCHIVED (archivado), IGNORED (descartado)';

COMMENT ON COLUMN sys.dead_letters.exception_class IS 
'Clase de la excepción que causó el fallo (ej: ValueError, ConnectionError)';

COMMENT ON COLUMN sys.dead_letters.stack_trace IS 
'Stack trace completo para debugging';

COMMENT ON COLUMN sys.dead_letters.resolution_notes IS 
'Notas del operador sobre la resolución del problema';


-- =============================================================================
-- TABLA: sys.kafka_topics_metadata
-- Propósito: Catálogo de tópicos Kafka y su configuración
-- Facilita auditoría y gestión de infraestructura
-- =============================================================================

CREATE TABLE IF NOT EXISTS sys.kafka_topics_metadata (
    topic_name VARCHAR(100) PRIMARY KEY,
    topic_type VARCHAR(50) CHECK (topic_type IN ('COMMAND', 'EVENT', 'DLQ', 'AUDIT')),
    description TEXT,
    partitions INT NOT NULL,
    replication_factor INT NOT NULL,
    retention_ms BIGINT,
    partition_key VARCHAR(50),
    owner_service VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    configuration JSONB
);

-- Índice por tipo de tópico
CREATE INDEX IF NOT EXISTS idx_kafka_topics_type 
ON sys.kafka_topics_metadata(topic_type, is_active);

COMMENT ON TABLE sys.kafka_topics_metadata IS 
'Catálogo de tópicos Kafka con configuración y metadatos';

COMMENT ON COLUMN sys.kafka_topics_metadata.topic_type IS 
'Tipo de tópico según RFC: COMMAND, EVENT, DLQ, AUDIT';

COMMENT ON COLUMN sys.kafka_topics_metadata.partition_key IS 
'Clave de particionamiento (tenant_id, trace_id, etc.)';


-- =============================================================================
-- TABLA: sys.message_rate_limits
-- Propósito: Configuración de rate limits por tenant/servicio
-- Complementa el rate limiting de Redis
-- =============================================================================

CREATE TABLE IF NOT EXISTS sys.message_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(100),
    service_name VARCHAR(100),
    topic_name VARCHAR(100),
    rate_per_second INT NOT NULL,
    burst_size INT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_rate_limit UNIQUE (tenant_id, service_name, topic_name)
);

-- Índice para búsquedas rápidas por tenant
CREATE INDEX IF NOT EXISTS idx_rate_limits_tenant 
ON sys.message_rate_limits(tenant_id, enabled);

-- Índice para búsquedas por servicio
CREATE INDEX IF NOT EXISTS idx_rate_limits_service 
ON sys.message_rate_limits(service_name, enabled);

COMMENT ON TABLE sys.message_rate_limits IS 
'Configuración de rate limiting para mensajería por tenant y servicio';


-- =============================================================================
-- TABLA: sys.circuit_breaker_state
-- Propósito: Estado persistente de circuit breakers
-- Permite coordinación entre instancias de consumidores
-- =============================================================================

CREATE TABLE IF NOT EXISTS sys.circuit_breaker_state (
    service_name VARCHAR(100) PRIMARY KEY,
    state VARCHAR(20) CHECK (state IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
    failure_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    last_failure_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sys.circuit_breaker_state IS 
'Estado global de circuit breakers para servicios externos';


-- =============================================================================
-- VISTA: vw_consumer_lag
-- Propósito: Vista de lag de consumidores para monitoreo
-- =============================================================================

CREATE OR REPLACE VIEW sys.vw_consumer_lag AS
SELECT 
    co.consumer_group,
    co.topic,
    co.partition,
    co.committed_offset,
    co.last_updated,
    EXTRACT(EPOCH FROM (NOW() - co.last_updated)) AS seconds_since_commit
FROM sys.consumer_offsets_log co
ORDER BY co.last_updated DESC;

COMMENT ON VIEW sys.vw_consumer_lag IS 
'Vista de lag de consumidores para dashboards de observabilidad';


-- =============================================================================
-- VISTA: vw_dlq_summary
-- Propósito: Resumen de mensajes en DLQ para operaciones
-- =============================================================================

CREATE OR REPLACE VIEW sys.vw_dlq_summary AS
SELECT 
    original_topic,
    consumer_group,
    exception_class,
    replay_status,
    COUNT(*) AS message_count,
    MIN(created_at) AS oldest_message,
    MAX(created_at) AS newest_message,
    AVG(retry_count) AS avg_retry_count
FROM sys.dead_letters
GROUP BY original_topic, consumer_group, exception_class, replay_status
ORDER BY message_count DESC;

COMMENT ON VIEW sys.vw_dlq_summary IS 
'Resumen agregado de mensajes en DLQ por tópico, consumer y error';


-- =============================================================================
-- VISTA: vw_message_throughput
-- Propósito: Métricas de throughput de mensajería
-- =============================================================================

CREATE OR REPLACE VIEW sys.vw_message_throughput AS
SELECT 
    topic,
    consumer_group,
    status,
    DATE_TRUNC('minute', processed_at) AS minute,
    COUNT(*) AS message_count,
    AVG(processing_duration_ms) AS avg_duration_ms,
    MAX(processing_duration_ms) AS max_duration_ms
FROM sys.message_traceability
WHERE processed_at > NOW() - INTERVAL '1 hour'
GROUP BY topic, consumer_group, status, DATE_TRUNC('minute', processed_at)
ORDER BY minute DESC;

COMMENT ON VIEW sys.vw_message_throughput IS 
'Métricas de throughput y latencia por minuto para última hora';


-- =============================================================================
-- FUNCIÓN: fn_record_consumer_offset
-- Propósito: Función helper para registrar offsets de consumidor
-- =============================================================================

CREATE OR REPLACE FUNCTION sys.fn_record_consumer_offset(
    p_consumer_group VARCHAR(100),
    p_topic VARCHAR(100),
    p_partition INT,
    p_offset BIGINT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO sys.consumer_offsets_log (
        consumer_group, topic, partition, committed_offset, last_updated, metadata
    )
    VALUES (
        p_consumer_group, p_topic, p_partition, p_offset, NOW(), p_metadata
    )
    ON CONFLICT (consumer_group, topic, partition) 
    DO UPDATE SET 
        committed_offset = EXCLUDED.committed_offset,
        last_updated = NOW(),
        metadata = EXCLUDED.metadata;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sys.fn_record_consumer_offset IS 
'Registra el offset comprometido por un consumidor (upsert)';


-- =============================================================================
-- FUNCIÓN: fn_get_dlq_statistics
-- Propósito: Estadísticas de DLQ para dashboard
-- =============================================================================

CREATE OR REPLACE FUNCTION sys.fn_get_dlq_statistics(
    p_hours INT DEFAULT 24
)
RETURNS TABLE(
    topic VARCHAR,
    consumer VARCHAR,
    total_messages BIGINT,
    pending_count BIGINT,
    replayed_count BIGINT,
    top_error VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dl.original_topic,
        dl.consumer_group,
        COUNT(*)::BIGINT AS total_messages,
        COUNT(*) FILTER (WHERE replay_status = 'PENDING')::BIGINT AS pending_count,
        COUNT(*) FILTER (WHERE replay_status = 'REPLAYED')::BIGINT AS replayed_count,
        MODE() WITHIN GROUP (ORDER BY dl.exception_class) AS top_error
    FROM sys.dead_letters dl
    WHERE dl.created_at > NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY dl.original_topic, dl.consumer_group
    ORDER BY total_messages DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sys.fn_get_dlq_statistics IS 
'Retorna estadísticas de DLQ para las últimas N horas';


-- =============================================================================
-- FUNCIÓN: fn_replay_dlq_message
-- Propósito: Marca mensaje DLQ para replay
-- =============================================================================

CREATE OR REPLACE FUNCTION sys.fn_replay_dlq_message(
    p_dlq_id UUID,
    p_operator VARCHAR(100),
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_affected INT;
BEGIN
    UPDATE sys.dead_letters
    SET 
        replay_status = 'REPLAYED',
        replay_at = NOW(),
        replay_by = p_operator,
        resolution_notes = p_notes
    WHERE id = p_dlq_id
    AND replay_status = 'PENDING';
    
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    
    RETURN v_affected > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sys.fn_replay_dlq_message IS 
'Marca un mensaje DLQ como REPLAYED para reprocessamiento';


-- =============================================================================
-- POBLACIÓN INICIAL: Metadatos de Tópicos (RFC Section 2.2)
-- =============================================================================

INSERT INTO sys.kafka_topics_metadata (
    topic_name, topic_type, description, partitions, replication_factor, 
    retention_ms, partition_key, owner_service, configuration
) VALUES
(
    'core.commands.v1',
    'COMMAND',
    'Órdenes imperativas del sistema (ej: execute_campaign)',
    12,
    3,
    604800000,  -- 7 días
    'tenant_id',
    'saga-coordinator',
    '{"min_insync_replicas": 2, "compression": "snappy"}'::jsonb
),
(
    'core.events.v1',
    'EVENT',
    'Hechos de dominio del sistema (ej: campaign_created)',
    12,
    3,
    2592000000,  -- 30 días
    'tenant_id',
    'all-services',
    '{"min_insync_replicas": 2, "compression": "snappy"}'::jsonb
),
(
    'sys.deadletter.v1',
    'DLQ',
    'Mensajes fallidos tras reintentos',
    6,
    3,
    2592000000,  -- 30 días
    'original_partition',
    'messaging-infrastructure',
    '{"min_insync_replicas": 2, "compression": "snappy"}'::jsonb
),
(
    'sys.audit.v1',
    'AUDIT',
    'Trazas de auditoría y cumplimiento',
    12,
    3,
    7776000000,  -- 90 días
    'trace_id',
    'audit-service',
    '{"min_insync_replicas": 2, "compression": "snappy"}'::jsonb
)
ON CONFLICT (topic_name) DO NOTHING;


-- =============================================================================
-- POBLACIÓN INICIAL: Rate Limits por Defecto
-- =============================================================================

INSERT INTO sys.message_rate_limits (
    tenant_id, service_name, topic_name, rate_per_second, burst_size
) VALUES
(
    NULL,  -- Global default
    'default',
    'core.commands.v1',
    100,
    200
),
(
    NULL,
    'default',
    'core.events.v1',
    200,
    400
)
ON CONFLICT (tenant_id, service_name, topic_name) DO NOTHING;


-- =============================================================================
-- GRANTS: Permisos para microservicios
-- =============================================================================

-- Permisos de lectura para todos los servicios
GRANT SELECT ON sys.consumer_offsets_log TO leadboost_app;
GRANT SELECT ON sys.message_traceability TO leadboost_app;
GRANT SELECT ON sys.dead_letters TO leadboost_app;
GRANT SELECT ON sys.kafka_topics_metadata TO leadboost_app;
GRANT SELECT ON sys.message_rate_limits TO leadboost_app;
GRANT SELECT ON sys.circuit_breaker_state TO leadboost_app;

-- Permisos de escritura para consumer/producer
GRANT INSERT, UPDATE ON sys.consumer_offsets_log TO leadboost_app;
GRANT INSERT, UPDATE ON sys.message_traceability TO leadboost_app;
GRANT INSERT, UPDATE ON sys.dead_letters TO leadboost_app;
GRANT UPDATE ON sys.circuit_breaker_state TO leadboost_app;

-- Permisos en vistas
GRANT SELECT ON sys.vw_consumer_lag TO leadboost_app;
GRANT SELECT ON sys.vw_dlq_summary TO leadboost_app;
GRANT SELECT ON sys.vw_message_throughput TO leadboost_app;

-- Permisos de ejecución en funciones
GRANT EXECUTE ON FUNCTION sys.fn_record_consumer_offset TO leadboost_app;
GRANT EXECUTE ON FUNCTION sys.fn_get_dlq_statistics TO leadboost_app;
GRANT EXECUTE ON FUNCTION sys.fn_replay_dlq_message TO leadboost_app;


-- =============================================================================
-- VALIDACIÓN: Verificar integridad del schema
-- =============================================================================

DO $$
DECLARE
    v_table_count INT;
    v_view_count INT;
    v_function_count INT;
BEGIN
    -- Contar tablas creadas
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'sys'
    AND table_name IN (
        'consumer_offsets_log',
        'message_traceability',
        'dead_letters',
        'kafka_topics_metadata',
        'message_rate_limits',
        'circuit_breaker_state'
    );
    
    -- Contar vistas creadas
    SELECT COUNT(*) INTO v_view_count
    FROM information_schema.views
    WHERE table_schema = 'sys'
    AND table_name IN (
        'vw_consumer_lag',
        'vw_dlq_summary',
        'vw_message_throughput'
    );
    
    -- Contar funciones creadas
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'sys'
    AND p.proname IN (
        'fn_record_consumer_offset',
        'fn_get_dlq_statistics',
        'fn_replay_dlq_message'
    );
    
    -- Validar
    IF v_table_count != 6 THEN
        RAISE EXCEPTION 'Error: Se esperaban 6 tablas, se encontraron %', v_table_count;
    END IF;
    
    IF v_view_count != 3 THEN
        RAISE EXCEPTION 'Error: Se esperaban 3 vistas, se encontraron %', v_view_count;
    END IF;
    
    IF v_function_count != 3 THEN
        RAISE EXCEPTION 'Error: Se esperaban 3 funciones, se encontraron %', v_function_count;
    END IF;
    
    RAISE NOTICE '✅ FASE 2 Schema Validation: SUCCESS';
    RAISE NOTICE '   - Tablas: %', v_table_count;
    RAISE NOTICE '   - Vistas: %', v_view_count;
    RAISE NOTICE '   - Funciones: %', v_function_count;
END;
$$;


-- =============================================================================
-- FIN DE MIGRACIÓN FASE 2
-- =============================================================================
