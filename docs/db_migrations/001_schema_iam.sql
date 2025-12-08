-- =============================================================================
-- ARCHIVO: 001_schema_iam.sql
-- PROPOSITO: Esquema de Identity & Access Management (IAM)
-- BLUEPRINT: RFC-PHOENIX-01 - Sección Complementaria (Pregunta 1)
-- =============================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear esquema IAM
CREATE SCHEMA IF NOT EXISTS iam;

-- =============================================================================
-- TABLA: iam.tenants
-- DESCRIPCION: Raíz de la integridad referencial multi-tenant
-- =============================================================================
CREATE TABLE iam.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('ENTERPRISE', 'STANDARD')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT tenants_name_unique UNIQUE (name)
);

-- Índices
CREATE INDEX idx_tenants_status ON iam.tenants(status);
CREATE INDEX idx_tenants_tier ON iam.tenants(tier);
CREATE INDEX idx_tenants_created_at ON iam.tenants(created_at DESC);

-- Comentarios de documentación
COMMENT ON TABLE iam.tenants IS 'Tabla raíz de multi-tenancy. Todos los datos del sistema se vinculan a un tenant específico.';
COMMENT ON COLUMN iam.tenants.id IS 'Identificador único del tenant (UUIDv4)';
COMMENT ON COLUMN iam.tenants.status IS 'Estado operativo: ACTIVE (operando normalmente), SUSPENDED (bloqueado por impago/violación)';
COMMENT ON COLUMN iam.tenants.tier IS 'Nivel de servicio contratado: ENTERPRISE (funcionalidades completas), STANDARD (limitado)';
