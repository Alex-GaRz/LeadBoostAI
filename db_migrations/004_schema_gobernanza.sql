-- =============================================================================
-- ARCHIVO: 004_schema_gobernanza.sql
-- PROPOSITO: Configuración de fusibles de seguridad (Circuit Breakers)
-- BLUEPRINT: RFC-PHOENIX-01 - Sección 1.3
-- =============================================================================

-- Crear esquema gobernanza
CREATE SCHEMA IF NOT EXISTS gobernanza;

-- =============================================================================
-- TABLA: gobernanza.policies
-- DESCRIPCION: Reglas y límites configurables del sistema
-- USO: Validación de presupuestos, CPA máximo, Brand Safety
-- =============================================================================
CREATE TABLE gobernanza.policies (
    -- Identificador único de la política
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Aislamiento multi-tenant
    tenant_id UUID NOT NULL,
    
    -- Tipo de regla
    rule_type VARCHAR(50) NOT NULL CHECK (
        rule_type IN ('MAX_CPA', 'DAILY_BUDGET', 'BRAND_SAFETY')
    ),
    
    -- Parámetros de la regla en formato JSONB
    -- Ejemplo: {"threshold": 15.50, "currency": "USD"}
    -- Ejemplo: {"max_daily_spend": 1000.00}
    -- Ejemplo: {"blocked_keywords": ["violence", "hate"]}
    config JSONB NOT NULL,
    
    -- Interruptor lógico (permite desactivar sin borrar)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Acción al violar la regla
    enforcement_level VARCHAR(20) NOT NULL CHECK (
        enforcement_level IN ('BLOCK', 'WARNING')
    ),
    
    -- Metadata de auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(255),
    
    -- Foreign Key a tenants
    CONSTRAINT fk_policies_tenant FOREIGN KEY (tenant_id) 
        REFERENCES iam.tenants(id) 
        ON DELETE RESTRICT
);

-- =============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- =============================================================================

-- Índice principal para consultas por tenant
CREATE INDEX idx_policies_tenant_id ON gobernanza.policies(tenant_id);

-- Índice compuesto para búsqueda rápida de políticas activas por tipo
CREATE INDEX idx_policies_tenant_type_active ON gobernanza.policies(tenant_id, rule_type, is_active);

-- CORRECCIÓN #6: Índice único parcial para evitar políticas duplicadas activas
-- Un tenant NO puede tener dos políticas del mismo tipo activas simultáneamente
CREATE UNIQUE INDEX uq_policies_tenant_type_active 
    ON gobernanza.policies(tenant_id, rule_type) 
    WHERE is_active = TRUE;

-- Índice para políticas activas (filtro más común)
CREATE INDEX idx_policies_active ON gobernanza.policies(is_active) WHERE is_active = TRUE;

-- Índice GIN para búsquedas dentro del JSON config
CREATE INDEX idx_policies_config_gin ON gobernanza.policies USING GIN (config);

-- Índice temporal para auditoría
CREATE INDEX idx_policies_updated_at ON gobernanza.policies(updated_at DESC);

-- =============================================================================
-- FUNCIÓN: Actualizar timestamp automáticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION gobernanza.update_policy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_policies_update_timestamp
    BEFORE UPDATE ON gobernanza.policies
    FOR EACH ROW
    EXECUTE FUNCTION gobernanza.update_policy_timestamp();

-- =============================================================================
-- FUNCIÓN AUXILIAR: Validar campaña contra políticas
-- PROPOSITO: Verificar si una acción viola alguna política activa
-- =============================================================================
CREATE OR REPLACE FUNCTION gobernanza.validate_campaign(
    p_tenant_id UUID,
    p_cpa DECIMAL,
    p_daily_spend DECIMAL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    violated_policies JSONB,
    enforcement_action VARCHAR
) AS $$
DECLARE
    v_policy RECORD;
    v_violations JSONB := '[]'::JSONB;
    v_blocked BOOLEAN := FALSE;
BEGIN
    -- Verificar políticas de CPA máximo
    FOR v_policy IN 
        SELECT * FROM gobernanza.policies
        WHERE tenant_id = p_tenant_id
          AND rule_type = 'MAX_CPA'
          AND is_active = TRUE
    LOOP
        IF p_cpa > (v_policy.config->>'threshold')::DECIMAL THEN
            v_violations := v_violations || jsonb_build_object(
                'policy_id', v_policy.id,
                'rule_type', 'MAX_CPA',
                'threshold', v_policy.config->>'threshold',
                'actual', p_cpa,
                'enforcement', v_policy.enforcement_level
            );
            
            IF v_policy.enforcement_level = 'BLOCK' THEN
                v_blocked := TRUE;
            END IF;
        END IF;
    END LOOP;
    
    -- Verificar políticas de presupuesto diario
    FOR v_policy IN 
        SELECT * FROM gobernanza.policies
        WHERE tenant_id = p_tenant_id
          AND rule_type = 'DAILY_BUDGET'
          AND is_active = TRUE
    LOOP
        IF p_daily_spend > (v_policy.config->>'max_daily_spend')::DECIMAL THEN
            v_violations := v_violations || jsonb_build_object(
                'policy_id', v_policy.id,
                'rule_type', 'DAILY_BUDGET',
                'threshold', v_policy.config->>'max_daily_spend',
                'actual', p_daily_spend,
                'enforcement', v_policy.enforcement_level
            );
            
            IF v_policy.enforcement_level = 'BLOCK' THEN
                v_blocked := TRUE;
            END IF;
        END IF;
    END LOOP;
    
    -- Retornar resultado
    RETURN QUERY SELECT 
        NOT v_blocked,
        v_violations,
        CASE 
            WHEN v_blocked THEN 'BLOCK'::VARCHAR
            WHEN jsonb_array_length(v_violations) > 0 THEN 'WARNING'::VARCHAR
            ELSE 'PASS'::VARCHAR
        END;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VISTA: Políticas activas por tenant
-- PROPOSITO: Simplificar consultas desde la capa de aplicación
-- =============================================================================
CREATE OR REPLACE VIEW gobernanza.active_policies AS
SELECT 
    p.id,
    p.tenant_id,
    t.name AS tenant_name,
    p.rule_type,
    p.config,
    p.enforcement_level,
    p.created_at,
    p.updated_at
FROM gobernanza.policies p
INNER JOIN iam.tenants t ON p.tenant_id = t.id
WHERE p.is_active = TRUE
ORDER BY p.tenant_id, p.rule_type;

-- =============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================================================
COMMENT ON TABLE gobernanza.policies IS 'Configuración de fusibles de seguridad (Circuit Breakers) y límites del sistema';
COMMENT ON COLUMN gobernanza.policies.rule_type IS 'Tipo de regla: MAX_CPA (costo por adquisición máximo), DAILY_BUDGET (presupuesto diario), BRAND_SAFETY (protección de marca)';
COMMENT ON COLUMN gobernanza.policies.config IS 'Parámetros en JSONB - Estructura varía según rule_type. Ejemplos: {"threshold": 15.50} para MAX_CPA';
COMMENT ON COLUMN gobernanza.policies.is_active IS 'Interruptor lógico - permite desactivar temporalmente sin borrar la política';
COMMENT ON COLUMN gobernanza.policies.enforcement_level IS 'BLOCK: rechaza la operación, WARNING: permite pero registra alerta';
COMMENT ON FUNCTION gobernanza.validate_campaign IS 'Valida una campaña contra todas las políticas activas del tenant';
COMMENT ON VIEW gobernanza.active_policies IS 'Vista simplificada de políticas activas con nombre del tenant';
