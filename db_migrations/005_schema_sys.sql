-- =============================================================================
-- ARCHIVO: 005_schema_sys.sql
-- PROPOSITO: Fontanería del sistema (Idempotencia y SAGA Coordinator)
-- BLUEPRINT: RFC-PHOENIX-01 - Sección 1.4 y Sección 3
-- =============================================================================

-- Crear esquema sys
CREATE SCHEMA IF NOT EXISTS sys;

-- Habilitar extensión citext para comparaciones case-insensitive (CORRECCIÓN #2)
CREATE EXTENSION IF NOT EXISTS citext;

-- =============================================================================
-- TABLA: sys.request_keys (Deduplicación Exactly-Once)
-- DESCRIPCION: Garantiza ejecución única de operaciones idempotentes
-- USO TÍPICO: Webhooks, reintentos de API, procesamiento de pagos
-- CORRECCIÓN #2: key es CITEXT para evitar duplicados por case (webhook_123 = WEBHOOK_123)
-- =============================================================================
CREATE TABLE sys.request_keys (
    -- Hash del payload o ID de evento externo (Webhook ID) - CITEXT para case-insensitive
    key CITEXT PRIMARY KEY,
    
    -- Aislamiento multi-tenant
    tenant_id UUID NOT NULL,
    
    -- Contexto de la operación
    scope VARCHAR(50) NOT NULL CHECK (
        scope IN ('WEBHOOK_META', 'API_PAYMENT', 'WEBHOOK_GOOGLE', 'SAGA_STEP', 'API_CAMPAIGN')
    ),
    
    -- Inicio del procesamiento
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- TTL para limpieza automática
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Resultado almacenado para devolver en reintentos
    response_payload JSONB,
    
    -- Estado de la operación
    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING' CHECK (
        status IN ('PROCESSING', 'COMPLETED', 'FAILED')
    ),
    
    -- Metadata adicional
    metadata JSONB,
    
    -- Foreign Key a tenants
    CONSTRAINT fk_request_keys_tenant FOREIGN KEY (tenant_id) 
        REFERENCES iam.tenants(id) 
        ON DELETE RESTRICT
);

-- =============================================================================
-- ÍNDICES: sys.request_keys
-- =============================================================================
CREATE INDEX idx_request_keys_tenant_scope ON sys.request_keys(tenant_id, scope);
CREATE INDEX idx_request_keys_expires_at ON sys.request_keys(expires_at);
CREATE INDEX idx_request_keys_status ON sys.request_keys(status);
CREATE INDEX idx_request_keys_locked_at ON sys.request_keys(locked_at DESC);

-- =============================================================================
-- FUNCIÓN: Limpieza automática de claves expiradas (Mantenimiento)
-- =============================================================================
CREATE OR REPLACE FUNCTION sys.cleanup_expired_request_keys()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM sys.request_keys
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLA: sys.sagas (SAGA Coordinator)
-- DESCRIPCION: Orquestación de procesos de larga duración multi-dominio
-- PATRÓN: Transacciones distribuidas con compensación automática
-- CORRECCIÓN #7: history eliminado de JSONB, ahora en tabla separada sys.saga_history_steps
-- =============================================================================
CREATE TABLE sys.sagas (
    -- UUID único de la transacción de negocio
    saga_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Aislamiento multi-tenant
    tenant_id UUID NOT NULL,
    
    -- Tipo de SAGA (para clasificación y monitoreo)
    saga_type VARCHAR(50) NOT NULL CHECK (
        saga_type IN ('CAMPAIGN_CREATION', 'INVENTORY_RESERVATION', 'BUDGET_ALLOCATION')
    ),
    
    -- Nombre del paso actual
    current_step VARCHAR(100) NOT NULL,
    
    -- Estado de la SAGA
    state VARCHAR(20) NOT NULL DEFAULT 'STARTED' CHECK (
        state IN ('STARTED', 'PENDING', 'COMPLETED', 'ABORTED', 'COMPENSATING', 'FAILED')
    ),
    
    -- Datos de entrada originales
    payload JSONB NOT NULL,
    
    -- Resultado final (si completed)
    result JSONB,
    
    -- Error capturado (si failed/aborted)
    error_details JSONB,
    
    -- Timestamps
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Foreign Key a tenants
    CONSTRAINT fk_sagas_tenant FOREIGN KEY (tenant_id) 
        REFERENCES iam.tenants(id) 
        ON DELETE RESTRICT
);

-- =============================================================================
-- ÍNDICES: sys.sagas
-- =============================================================================
CREATE INDEX idx_sagas_tenant_id ON sys.sagas(tenant_id);
CREATE INDEX idx_sagas_state ON sys.sagas(state);
CREATE INDEX idx_sagas_tenant_state ON sys.sagas(tenant_id, state);
CREATE INDEX idx_sagas_started_at ON sys.sagas(started_at DESC);
CREATE INDEX idx_sagas_updated_at ON sys.sagas(updated_at DESC);
CREATE INDEX idx_sagas_saga_type ON sys.sagas(saga_type);

-- =============================================================================
-- TABLA: sys.saga_history_steps (CORRECCIÓN #7 - Evitar bloat de JSONB)
-- DESCRIPCION: Historial de pasos de SAGA como filas individuales
-- VENTAJA: Sin UPDATE acumulativo de JSONB, solo INSERT (append-only)
-- =============================================================================
CREATE TABLE sys.saga_history_steps (
    id BIGSERIAL PRIMARY KEY,
    saga_id UUID NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OK', 'FAILED', 'COMPENSATED')),
    payload JSONB,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Key a sagas
    CONSTRAINT fk_saga_history_saga FOREIGN KEY (saga_id)
        REFERENCES sys.sagas(saga_id)
        ON DELETE CASCADE
);

-- Índices para saga_history_steps
CREATE INDEX idx_saga_history_saga_id ON sys.saga_history_steps(saga_id, executed_at DESC);
CREATE INDEX idx_saga_history_status ON sys.saga_history_steps(status);

-- =============================================================================
-- FUNCIÓN: Actualizar timestamp de SAGA automáticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION sys.update_saga_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Si la SAGA se completa o falla, registrar completed_at
    IF NEW.state IN ('COMPLETED', 'FAILED', 'ABORTED') AND OLD.state NOT IN ('COMPLETED', 'FAILED', 'ABORTED') THEN
        NEW.completed_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sagas_update_timestamp
    BEFORE UPDATE ON sys.sagas
    FOR EACH ROW
    EXECUTE FUNCTION sys.update_saga_timestamp();

-- =============================================================================
-- FUNCIÓN AUXILIAR: Agregar paso al historial de SAGA (CORRECCIÓN #7)
-- Ahora inserta en sys.saga_history_steps en lugar de actualizar JSONB
-- =============================================================================
CREATE OR REPLACE FUNCTION sys.saga_add_step(
    p_saga_id UUID,
    p_step_name VARCHAR,
    p_status VARCHAR,
    p_step_payload JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insertar paso en tabla de historial (append-only, sin bloat)
    INSERT INTO sys.saga_history_steps (saga_id, step_name, status, payload)
    VALUES (p_saga_id, p_step_name, p_status, p_step_payload);
    
    -- Actualizar current_step en la tabla principal
    UPDATE sys.sagas
    SET current_step = p_step_name
    WHERE saga_id = p_saga_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN AUXILIAR: Marcar SAGA como completada
-- =============================================================================
CREATE OR REPLACE FUNCTION sys.saga_complete(
    p_saga_id UUID,
    p_result JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sys.sagas
    SET 
        state = 'COMPLETED',
        result = p_result
    WHERE saga_id = p_saga_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN AUXILIAR: Marcar SAGA como fallida
-- =============================================================================
CREATE OR REPLACE FUNCTION sys.saga_fail(
    p_saga_id UUID,
    p_error_details JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE sys.sagas
    SET 
        state = 'FAILED',
        error_details = p_error_details
    WHERE saga_id = p_saga_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VISTA: SAGAs activas por tenant (CORRECCIÓN #12)
-- =============================================================================
-- NOTA: Corregida para usar saga_history_steps en vez de history JSONB (eliminado en corrección #7)
CREATE OR REPLACE VIEW sys.active_sagas AS
SELECT 
    s.saga_id,
    s.tenant_id,
    t.name AS tenant_name,
    s.saga_type,
    s.current_step,
    s.state,
    COALESCE(
        (SELECT COUNT(*) 
         FROM sys.saga_history_steps sh 
         WHERE sh.saga_id = s.saga_id),
        0
    ) AS steps_executed,
    s.started_at,
    s.updated_at,
    EXTRACT(EPOCH FROM (NOW() - s.started_at)) AS duration_seconds
FROM sys.sagas s
INNER JOIN iam.tenants t ON s.tenant_id = t.id
WHERE s.state IN ('STARTED', 'PENDING', 'COMPENSATING')
ORDER BY s.started_at DESC;

-- =============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================================================
COMMENT ON TABLE sys.request_keys IS 'Deduplicación Exactly-Once - Previene ejecución duplicada de webhooks y reintentos de API';
COMMENT ON COLUMN sys.request_keys.key IS 'Hash del payload o ID externo (ej: meta_webhook_xyz, payment_txn_abc)';
COMMENT ON COLUMN sys.request_keys.scope IS 'Contexto de la operación para aislar espacios de nombres de claves';
COMMENT ON COLUMN sys.request_keys.expires_at IS 'TTL para limpieza automática - típicamente 24-72 horas después de locked_at';
COMMENT ON COLUMN sys.request_keys.response_payload IS 'Respuesta almacenada para devolver en reintentos sin re-ejecutar';

COMMENT ON TABLE sys.sagas IS 'SAGA Coordinator - Orquestación de transacciones distribuidas con compensación automática';
COMMENT ON COLUMN sys.sagas.saga_type IS 'Tipo de proceso: CAMPAIGN_CREATION, INVENTORY_RESERVATION, BUDGET_ALLOCATION';
COMMENT ON COLUMN sys.sagas.state IS 'STARTED: iniciada, PENDING: esperando respuesta externa, COMPLETED: exitosa, COMPENSATING: ejecutando rollback, ABORTED/FAILED: error';
COMMENT ON COLUMN sys.sagas.current_step IS 'Nombre del último paso ejecutado o en ejecución';

COMMENT ON TABLE sys.saga_history_steps IS 'Historial normalizado de pasos de SAGA - reemplaza history JSONB para escalabilidad (corrección #7)';

COMMENT ON FUNCTION sys.cleanup_expired_request_keys IS 'Mantenimiento - Elimina claves de idempotencia expiradas (ejecutar diariamente)';
COMMENT ON FUNCTION sys.saga_add_step IS 'Agrega un paso al historial de una SAGA en saga_history_steps y actualiza current_step';
COMMENT ON FUNCTION sys.saga_complete IS 'Marca una SAGA como completada exitosamente';
COMMENT ON FUNCTION sys.saga_fail IS 'Marca una SAGA como fallida con detalles del error';
COMMENT ON VIEW sys.active_sagas IS 'Vista de SAGAs actualmente en ejecución o esperando - corregida para usar saga_history_steps (corrección #12)';
