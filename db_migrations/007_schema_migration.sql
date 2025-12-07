-- =============================================================================
-- ARCHIVO: 007_schema_migration.sql
-- PROPOSITO: Tablas destino para migración desde Firebase/SQLite
-- BLUEPRINT: RFC-PHOENIX-01 - Sección 4 (Estrategia de Migración)
-- FASE: Dual-Write + Backfill
-- =============================================================================

-- Crear esquema migration para aislar tablas de transición
CREATE SCHEMA IF NOT EXISTS migration;

-- =============================================================================
-- TABLA: migration.raw_signals
-- DESCRIPCION: Migración de señales de mercado desde Firebase
-- ORIGEN: Colección 'signals' en Firebase
-- =============================================================================
CREATE TABLE migration.raw_signals (
    -- ID original de Firebase (para idempotencia)
    firebase_id VARCHAR(255) PRIMARY KEY,
    
    -- Datos migrados
    tenant_id UUID NOT NULL,
    signal_type VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    
    -- Timestamps originales
    original_created_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata de migración
    migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    migration_batch_id VARCHAR(100),
    validation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        validation_status IN ('PENDING', 'VALIDATED', 'FAILED')
    ),
    validation_errors JSONB,
    
    -- Foreign Key a tenants
    CONSTRAINT fk_raw_signals_tenant FOREIGN KEY (tenant_id) 
        REFERENCES iam.tenants(id) 
        ON DELETE RESTRICT
);

-- Índices para migration.raw_signals
CREATE INDEX idx_raw_signals_tenant_id ON migration.raw_signals(tenant_id);
CREATE INDEX idx_raw_signals_signal_type ON migration.raw_signals(signal_type);
CREATE INDEX idx_raw_signals_migrated_at ON migration.raw_signals(migrated_at DESC);
CREATE INDEX idx_raw_signals_validation_status ON migration.raw_signals(validation_status);
CREATE INDEX idx_raw_signals_batch_id ON migration.raw_signals(migration_batch_id);
CREATE INDEX idx_raw_signals_payload_gin ON migration.raw_signals USING GIN (payload);

-- =============================================================================
-- TABLA: migration.campaigns
-- DESCRIPCION: Migración de campañas desde Firebase
-- ORIGEN: Colección 'campaigns' en Firebase
-- =============================================================================
CREATE TABLE migration.campaigns (
    -- ID original de Firebase (para idempotencia)
    firebase_id VARCHAR(255) PRIMARY KEY,
    
    -- Datos migrados
    tenant_id UUID NOT NULL,
    campaign_name VARCHAR(500) NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (
        platform IN ('META', 'GOOGLE', 'TIKTOK', 'LINKEDIN')
    ),
    status VARCHAR(50) NOT NULL,
    budget_allocated DECIMAL(18,4),
    budget_spent DECIMAL(18,4),
    configuration JSONB NOT NULL,
    
    -- Timestamps originales
    original_created_at TIMESTAMPTZ NOT NULL,
    original_updated_at TIMESTAMPTZ,
    
    -- Metadata de migración
    migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    migration_batch_id VARCHAR(100),
    validation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        validation_status IN ('PENDING', 'VALIDATED', 'FAILED')
    ),
    validation_errors JSONB,
    
    -- ID transformado en el nuevo sistema (si ya se procesó)
    new_system_id UUID,
    
    -- Foreign Key a tenants
    CONSTRAINT fk_campaigns_tenant FOREIGN KEY (tenant_id) 
        REFERENCES iam.tenants(id) 
        ON DELETE RESTRICT,
    
    -- CORRECCIÓN #3: Evitar duplicados de UUID en el nuevo sistema
    CONSTRAINT uq_campaigns_new_system_id UNIQUE (new_system_id)
);

-- Índices para migration.campaigns
CREATE INDEX idx_campaigns_tenant_id ON migration.campaigns(tenant_id);
CREATE INDEX idx_campaigns_platform ON migration.campaigns(platform);
CREATE INDEX idx_campaigns_status ON migration.campaigns(status);
CREATE INDEX idx_campaigns_migrated_at ON migration.campaigns(migrated_at DESC);
CREATE INDEX idx_campaigns_validation_status ON migration.campaigns(validation_status);
CREATE INDEX idx_campaigns_batch_id ON migration.campaigns(migration_batch_id);
CREATE INDEX idx_campaigns_new_system_id ON migration.campaigns(new_system_id);
CREATE INDEX idx_campaigns_config_gin ON migration.campaigns USING GIN (configuration);

-- =============================================================================
-- TABLA: migration.audit_logs
-- DESCRIPCION: Migración de logs de auditoría desde Firebase
-- ORIGEN: Colección 'audit_logs' en Firebase (si existe)
-- =============================================================================
CREATE TABLE migration.audit_logs (
    -- ID original de Firebase (para idempotencia)
    firebase_id VARCHAR(255) PRIMARY KEY,
    
    -- Datos migrados
    tenant_id UUID NOT NULL,
    actor_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    payload JSONB,
    
    -- Timestamps originales
    original_created_at TIMESTAMPTZ NOT NULL,
    
    -- Metadata de migración
    migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    migration_batch_id VARCHAR(100),
    validation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        validation_status IN ('PENDING', 'VALIDATED', 'FAILED')
    ),
    validation_errors JSONB,
    
    -- Foreign Key a tenants
    CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) 
        REFERENCES iam.tenants(id) 
        ON DELETE RESTRICT
);

-- Índices para migration.audit_logs
CREATE INDEX idx_audit_logs_tenant_id ON migration.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_action ON migration.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON migration.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_migrated_at ON migration.audit_logs(migrated_at DESC);
CREATE INDEX idx_audit_logs_validation_status ON migration.audit_logs(validation_status);
CREATE INDEX idx_audit_logs_batch_id ON migration.audit_logs(migration_batch_id);
CREATE INDEX idx_audit_logs_payload_gin ON migration.audit_logs USING GIN (payload);

-- =============================================================================
-- TABLA: migration.batch_control
-- DESCRIPCION: Control de ejecución de lotes de migración
-- USO: Tracking del progreso de backfill
-- =============================================================================
CREATE TABLE migration.batch_control (
    batch_id VARCHAR(100) PRIMARY KEY,
    batch_type VARCHAR(50) NOT NULL CHECK (
        batch_type IN ('SIGNALS', 'CAMPAIGNS', 'AUDIT_LOGS', 'MANUAL')
    ),
    total_records INTEGER NOT NULL DEFAULT 0,
    processed_records INTEGER NOT NULL DEFAULT 0,
    failed_records INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'RUNNING' CHECK (
        status IN ('RUNNING', 'COMPLETED', 'FAILED', 'PAUSED')
    ),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_summary JSONB,
    metadata JSONB
);

-- Índices para migration.batch_control
CREATE INDEX idx_batch_control_type ON migration.batch_control(batch_type);
CREATE INDEX idx_batch_control_status ON migration.batch_control(status);
CREATE INDEX idx_batch_control_started_at ON migration.batch_control(started_at DESC);

-- =============================================================================
-- FUNCIÓN: Validar integridad de datos migrados
-- =============================================================================
CREATE OR REPLACE FUNCTION migration.validate_migrated_data()
RETURNS TABLE (
    table_name VARCHAR,
    total_records BIGINT,
    pending_validation BIGINT,
    validated BIGINT,
    failed BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'raw_signals'::VARCHAR,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'PENDING')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'FAILED')::BIGINT
    FROM migration.raw_signals
    UNION ALL
    SELECT 
        'campaigns'::VARCHAR,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'PENDING')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'FAILED')::BIGINT
    FROM migration.campaigns
    UNION ALL
    SELECT 
        'audit_logs'::VARCHAR,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'PENDING')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'FAILED')::BIGINT
    FROM migration.audit_logs;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN: Obtener estadísticas de migración por tenant
-- =============================================================================
CREATE OR REPLACE FUNCTION migration.get_tenant_migration_stats(p_tenant_id UUID)
RETURNS TABLE (
    source VARCHAR,
    total_migrated BIGINT,
    validated BIGINT,
    failed BIGINT,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'raw_signals'::VARCHAR,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'FAILED')::BIGINT,
        ROUND(
            (COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100), 2
        )
    FROM migration.raw_signals
    WHERE tenant_id = p_tenant_id
    UNION ALL
    SELECT 
        'campaigns'::VARCHAR,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'FAILED')::BIGINT,
        ROUND(
            (COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100), 2
        )
    FROM migration.campaigns
    WHERE tenant_id = p_tenant_id
    UNION ALL
    SELECT 
        'audit_logs'::VARCHAR,
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::BIGINT,
        COUNT(*) FILTER (WHERE validation_status = 'FAILED')::BIGINT,
        ROUND(
            (COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100), 2
        )
    FROM migration.audit_logs
    WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================================================
COMMENT ON SCHEMA migration IS 'Esquema temporal para migración de datos desde Firebase/SQLite a PostgreSQL';
COMMENT ON TABLE migration.raw_signals IS 'Datos migrados de señales de mercado - Origen: Firebase collection "signals"';
COMMENT ON TABLE migration.campaigns IS 'Datos migrados de campañas - Origen: Firebase collection "campaigns"';
COMMENT ON TABLE migration.audit_logs IS 'Datos migrados de logs de auditoría - Origen: Firebase collection "audit_logs"';
COMMENT ON TABLE migration.batch_control IS 'Control de ejecución de lotes de migración (Backfill ETL)';

COMMENT ON COLUMN migration.raw_signals.firebase_id IS 'ID original de Firebase - usado para idempotencia en dual-write';
COMMENT ON COLUMN migration.raw_signals.validation_status IS 'PENDING: no validado, VALIDATED: datos correctos, FAILED: errores detectados';
COMMENT ON COLUMN migration.campaigns.new_system_id IS 'UUID generado en el nuevo sistema tras transformación exitosa';

COMMENT ON FUNCTION migration.validate_migrated_data IS 'Reporte de integridad de datos migrados por tabla';
COMMENT ON FUNCTION migration.get_tenant_migration_stats IS 'Estadísticas de migración específicas de un tenant';
