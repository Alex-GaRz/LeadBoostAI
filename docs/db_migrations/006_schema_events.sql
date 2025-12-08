-- =============================================================================
-- ARCHIVO: 006_schema_events.sql
-- PROPOSITO: Event Store y Snapshots para Event Sourcing
-- BLUEPRINT: RFC-PHOENIX-01 - Sección 2
-- =============================================================================

-- Crear esquema events
CREATE SCHEMA IF NOT EXISTS events;

-- =============================================================================
-- TABLA: events.event_store
-- DESCRIPCION: Log inmutable de todos los eventos del sistema (Append-Only)
-- PATRÓN: Event Sourcing - La fuente única de verdad del estado
-- CORRECCIÓN #4: ADVERTENCIA - global_sequence solo es válida en arquitectura SINGLE-WRITER
-- En multi-writer (múltiples instancias escribiendo concurrentemente), usar:
--   - Timestamp + UUID para orden (con resolución de conflictos)
--   - O secuencia por stream (version) en lugar de secuencia global
-- =============================================================================
CREATE TABLE events.event_store (
    -- Orden global absoluto de todos los eventos del sistema
    -- LIMITACIÓN: Solo válido bajo single-writer. No usar en multi-writer sin coordinación externa.
    global_sequence BIGSERIAL PRIMARY KEY,
    
    -- ID de la entidad afectada (ej: CampaignID, SagaID, InventoryID)
    stream_id UUID NOT NULL,
    
    -- Tipo de entidad
    stream_type VARCHAR(50) NOT NULL CHECK (
        stream_type IN ('CAMPAIGN', 'SAGA', 'INVENTORY', 'BUDGET', 'POLICY', 'TENANT')
    ),
    
    -- Secuencia incremental dentro del stream (Control de concurrencia)
    version INTEGER NOT NULL,
    
    -- Verbo en pasado (nombre del evento)
    event_type VARCHAR(100) NOT NULL,
    
    -- Datos inmutables del evento
    payload JSONB NOT NULL,
    
    -- Contexto (ActorID, IP, RequestID, CorrelationID)
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    
    -- Fecha real del evento (negocio)
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Fecha de inserción en BD (técnica)
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint único: Un stream no puede tener dos eventos con la misma versión
    CONSTRAINT uq_event_stream_version UNIQUE (stream_id, version)
);

-- =============================================================================
-- ÍNDICES: events.event_store
-- =============================================================================

-- CORRECCIÓN #9: Índice idx_event_stream_id_version ELIMINADO (redundante con UNIQUE constraint)
-- El constraint UNIQUE(stream_id, version) ya crea un índice automáticamente

-- Índice para consultas por tipo de stream
CREATE INDEX idx_event_stream_type ON events.event_store(stream_type);

-- Índice compuesto para búsquedas por tipo de evento específico
CREATE INDEX idx_event_stream_type_event ON events.event_store(stream_type, event_type);

-- Índice temporal para replay y auditoría
CREATE INDEX idx_event_occurred_at ON events.event_store(occurred_at DESC);

-- Índice para búsqueda por global_sequence (orden total)
CREATE INDEX idx_event_global_sequence ON events.event_store(global_sequence ASC);

-- Índice GIN para búsquedas dentro del payload JSON
CREATE INDEX idx_event_payload_gin ON events.event_store USING GIN (payload);

-- Índice GIN para búsquedas dentro del metadata JSON
CREATE INDEX idx_event_metadata_gin ON events.event_store USING GIN (metadata);

-- =============================================================================
-- REGLAS DE INMUTABILIDAD (Circuit Breakers)
-- =============================================================================

-- Trigger para prevenir UPDATE
CREATE OR REPLACE FUNCTION events.prevent_event_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'EVENT STORE VIOLATION: UPDATE operations are forbidden on event_store. This is an immutable append-only log.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_event_update
    BEFORE UPDATE ON events.event_store
    FOR EACH ROW
    EXECUTE FUNCTION events.prevent_event_update();

-- Trigger para prevenir DELETE
CREATE OR REPLACE FUNCTION events.prevent_event_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'EVENT STORE VIOLATION: DELETE operations are forbidden on event_store. This is an immutable append-only log.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_event_delete
    BEFORE DELETE ON events.event_store
    FOR EACH ROW
    EXECUTE FUNCTION events.prevent_event_delete();

-- =============================================================================
-- TABLA: events.snapshots
-- DESCRIPCION: Fotos del estado para acelerar rehidratación
-- USO: Cada 100 eventos, se guarda una snapshot para evitar replay completo
-- =============================================================================
CREATE TABLE events.snapshots (
    -- Identificador único del snapshot
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- ID del stream al que pertenece
    stream_id UUID NOT NULL,
    
    -- Tipo de entidad
    stream_type VARCHAR(50) NOT NULL CHECK (
        stream_type IN ('CAMPAIGN', 'SAGA', 'INVENTORY', 'BUDGET', 'POLICY', 'TENANT')
    ),
    
    -- Versión del evento en la que se tomó la foto
    version INTEGER NOT NULL,
    
    -- Estado serializado del aggregate root en ese momento
    state JSONB NOT NULL,
    
    -- Timestamp de creación
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraint único: Solo un snapshot por stream/version
    CONSTRAINT uq_snapshot_stream_version UNIQUE (stream_id, version)
);

-- =============================================================================
-- ÍNDICES: events.snapshots
-- =============================================================================

-- Índice principal para búsqueda de snapshot más reciente
CREATE INDEX idx_snapshot_stream_id_version ON events.snapshots(stream_id, version DESC);

-- Índice para búsquedas por tipo de stream
CREATE INDEX idx_snapshot_stream_type ON events.snapshots(stream_type);

-- Índice temporal para mantenimiento
CREATE INDEX idx_snapshot_created_at ON events.snapshots(created_at DESC);

-- =============================================================================
-- FUNCIÓN AUXILIAR: Obtener último snapshot + eventos delta
-- PROPOSITO: Rehidratación optimizada
-- =============================================================================
CREATE OR REPLACE FUNCTION events.get_stream_state(
    p_stream_id UUID
)
RETURNS TABLE (
    has_snapshot BOOLEAN,
    snapshot_version INTEGER,
    snapshot_state JSONB,
    delta_events JSONB
) AS $$
DECLARE
    v_snapshot RECORD;
    v_events JSONB;
BEGIN
    -- Buscar snapshot más reciente
    SELECT * INTO v_snapshot
    FROM events.snapshots
    WHERE stream_id = p_stream_id
    ORDER BY version DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Obtener eventos desde el snapshot hasta ahora
        SELECT jsonb_agg(
            jsonb_build_object(
                'version', version,
                'event_type', event_type,
                'payload', payload,
                'occurred_at', occurred_at
            ) ORDER BY version ASC
        ) INTO v_events
        FROM events.event_store
        WHERE stream_id = p_stream_id
          AND version > v_snapshot.version;
        
        RETURN QUERY SELECT 
            TRUE,
            v_snapshot.version,
            v_snapshot.state,
            COALESCE(v_events, '[]'::JSONB);
    ELSE
        -- No hay snapshot, devolver todos los eventos
        SELECT jsonb_agg(
            jsonb_build_object(
                'version', version,
                'event_type', event_type,
                'payload', payload,
                'occurred_at', occurred_at
            ) ORDER BY version ASC
        ) INTO v_events
        FROM events.event_store
        WHERE stream_id = p_stream_id;
        
        RETURN QUERY SELECT 
            FALSE,
            0,
            NULL::JSONB,
            COALESCE(v_events, '[]'::JSONB);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN AUXILIAR: Crear snapshot
-- =============================================================================
CREATE OR REPLACE FUNCTION events.create_snapshot(
    p_stream_id UUID,
    p_stream_type VARCHAR,
    p_version INTEGER,
    p_state JSONB
)
RETURNS UUID AS $$
DECLARE
    v_snapshot_id UUID;
BEGIN
    INSERT INTO events.snapshots (stream_id, stream_type, version, state)
    VALUES (p_stream_id, p_stream_type, p_version, p_state)
    RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN: Limpieza de snapshots antiguos (Mantener solo últimos 3)
-- =============================================================================
CREATE OR REPLACE FUNCTION events.cleanup_old_snapshots()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    WITH ranked_snapshots AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY stream_id ORDER BY version DESC) AS rn
        FROM events.snapshots
    )
    DELETE FROM events.snapshots
    WHERE id IN (
        SELECT id FROM ranked_snapshots WHERE rn > 3
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VISTA: Resumen de streams activos
-- =============================================================================
CREATE OR REPLACE VIEW events.stream_summary AS
SELECT 
    e.stream_id,
    e.stream_type,
    COUNT(*) AS total_events,
    MIN(e.version) AS first_version,
    MAX(e.version) AS latest_version,
    MIN(e.occurred_at) AS first_event_at,
    MAX(e.occurred_at) AS last_event_at,
    EXISTS(
        SELECT 1 FROM events.snapshots s 
        WHERE s.stream_id = e.stream_id
    ) AS has_snapshot,
    (
        SELECT MAX(version) 
        FROM events.snapshots s 
        WHERE s.stream_id = e.stream_id
    ) AS latest_snapshot_version
FROM events.event_store e
GROUP BY e.stream_id, e.stream_type
ORDER BY last_event_at DESC;

-- =============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================================================
COMMENT ON TABLE events.event_store IS 'Event Store inmutable - Append-Only Log de todos los eventos del sistema. PROHIBIDO: UPDATE/DELETE.';
COMMENT ON COLUMN events.event_store.global_sequence IS 'Orden global absoluto para procesamiento secuencial y garantías de ordenamiento';
COMMENT ON COLUMN events.event_store.stream_id IS 'ID del agregado (entity) al que pertenece el evento';
COMMENT ON COLUMN events.event_store.stream_type IS 'Tipo de entidad: CAMPAIGN, SAGA, INVENTORY, BUDGET, etc.';
COMMENT ON COLUMN events.event_store.version IS 'Secuencia incremental dentro del stream - usado para control de concurrencia optimista';
COMMENT ON COLUMN events.event_store.event_type IS 'Nombre del evento en pasado: BudgetAllocated, CampaignPaused, StockReserved';
COMMENT ON COLUMN events.event_store.payload IS 'Datos del evento (inmutables)';
COMMENT ON COLUMN events.event_store.metadata IS 'Contexto: {"actor_id": "...", "correlation_id": "...", "ip": "..."}';

COMMENT ON TABLE events.snapshots IS 'Snapshots de estado para acelerar rehidratación - Evita replay de millones de eventos';
COMMENT ON COLUMN events.snapshots.version IS 'Versión del stream en el momento del snapshot';
COMMENT ON COLUMN events.snapshots.state IS 'Estado completo del agregado serializado en JSON';

COMMENT ON FUNCTION events.get_stream_state IS 'Rehidratación optimizada - Devuelve último snapshot + eventos delta';
COMMENT ON FUNCTION events.create_snapshot IS 'Crea un snapshot del estado actual de un stream';
COMMENT ON FUNCTION events.cleanup_old_snapshots IS 'Mantenimiento - Mantiene solo los 3 snapshots más recientes por stream';
COMMENT ON VIEW events.stream_summary IS 'Resumen de actividad por stream - útil para monitoreo y debugging';
