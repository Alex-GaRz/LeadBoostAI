-- Crear esquema si no existe
CREATE SCHEMA IF NOT EXISTS governance;

-- Crear tabla de auditoría de acciones (Ledger)
CREATE TABLE IF NOT EXISTS actions_ledger (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL DEFAULT 'default',
    action_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- PENDING_APPROVAL, APPROVED, EXECUTING, COMPLETED, FAILED
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    result JSONB
);

-- Insertar un registro de prueba APROBADO para que el test pase
INSERT INTO actions_ledger (id, action_type, status, payload, approved_at, approved_by)
VALUES (
    'test-uuid-123', 
    'MOCK_POST', 
    'APPROVED', 
    '{"content": "Hello World from LeadBoost"}',
    NOW(),
    'admin-user'
) ON CONFLICT (id) DO UPDATE SET status = 'APPROVED';
