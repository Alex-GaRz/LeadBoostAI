-- =============================================================================
-- ARCHIVO: 008_seed_data.sql
-- PROPOSITO: Datos iniciales para testing y desarrollo
-- BLUEPRINT: RFC-PHOENIX-01 - Datos de prueba
-- =============================================================================

-- =============================================================================
-- TENANTS DE PRUEBA
-- =============================================================================
INSERT INTO iam.tenants (id, name, status, tier) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Acme Corporation', 'ACTIVE', 'ENTERPRISE'),
    ('22222222-2222-2222-2222-222222222222', 'Beta Industries', 'ACTIVE', 'STANDARD'),
    ('33333333-3333-3333-3333-333333333333', 'Test Tenant (Suspended)', 'SUSPENDED', 'STANDARD')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- POLÍTICAS DE GOBERNANZA (TENANTS DE PRUEBA)
-- =============================================================================

-- Acme Corporation - Políticas Enterprise
INSERT INTO gobernanza.policies (tenant_id, rule_type, config, enforcement_level) VALUES
    ('11111111-1111-1111-1111-111111111111', 'MAX_CPA', '{"threshold": 25.00, "currency": "USD"}', 'WARNING'),
    ('11111111-1111-1111-1111-111111111111', 'DAILY_BUDGET', '{"max_daily_spend": 5000.00, "currency": "USD"}', 'BLOCK'),
    ('11111111-1111-1111-1111-111111111111', 'BRAND_SAFETY', '{"blocked_keywords": ["violence", "hate", "adult"]}', 'BLOCK')
ON CONFLICT DO NOTHING;

-- Beta Industries - Políticas Standard
INSERT INTO gobernanza.policies (tenant_id, rule_type, config, enforcement_level) VALUES
    ('22222222-2222-2222-2222-222222222222', 'MAX_CPA', '{"threshold": 15.00, "currency": "USD"}', 'BLOCK'),
    ('22222222-2222-2222-2222-222222222222', 'DAILY_BUDGET', '{"max_daily_spend": 1000.00, "currency": "USD"}', 'BLOCK')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- INVENTARIO DE PRUEBA
-- =============================================================================

-- Acme Corporation - Productos
INSERT INTO stock.inventory_items (tenant_id, sku, quantity_on_hand, quantity_reserved) VALUES
    ('11111111-1111-1111-1111-111111111111', 'ACME-WIDGET-001', 1000, 50),
    ('11111111-1111-1111-1111-111111111111', 'ACME-WIDGET-002', 500, 0),
    ('11111111-1111-1111-1111-111111111111', 'ACME-WIDGET-003', 250, 100),
    ('11111111-1111-1111-1111-111111111111', 'ACME-SERVICE-GOLD', 999999, 0)
ON CONFLICT (tenant_id, sku) DO NOTHING;

-- Beta Industries - Productos
INSERT INTO stock.inventory_items (tenant_id, sku, quantity_on_hand, quantity_reserved) VALUES
    ('22222222-2222-2222-2222-222222222222', 'BETA-PROD-A', 100, 10),
    ('22222222-2222-2222-2222-222222222222', 'BETA-PROD-B', 50, 5)
ON CONFLICT (tenant_id, sku) DO NOTHING;

-- =============================================================================
-- LEDGER INICIAL (DEPÓSITOS DE PRUEBA)
-- CORRECCIÓN #1: Usar finanzas.post_transaction() en lugar de INSERT directo
-- =============================================================================

-- Acme Corporation - Depósito inicial
DO $$
DECLARE
    v_txn_group UUID := uuid_generate_v4();
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM finanzas.post_transaction(
        '11111111-1111-1111-1111-111111111111',
        v_txn_group,
        '[
            {"account_type": "WALLET", "amount": 10000.00, "direction": 1, "reference_type": "DEPOSIT", "reference_id": "' || v_txn_group || '"}
        ]'::JSONB
    );
    
    IF NOT v_result.success THEN
        RAISE EXCEPTION 'Failed to create initial deposit for Acme: %', v_result.message;
    END IF;
END $$;

-- Beta Industries - Depósito inicial
DO $$
DECLARE
    v_txn_group UUID := uuid_generate_v4();
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM finanzas.post_transaction(
        '22222222-2222-2222-2222-222222222222',
        v_txn_group,
        '[
            {"account_type": "WALLET", "amount": 5000.00, "direction": 1, "reference_type": "DEPOSIT", "reference_id": "' || v_txn_group || '"}
        ]'::JSONB
    );
    
    IF NOT v_result.success THEN
        RAISE EXCEPTION 'Failed to create initial deposit for Beta: %', v_result.message;
    END IF;
END $$;

-- =============================================================================
-- EVENTOS DE PRUEBA (EVENT STORE)
-- =============================================================================

-- Stream de ejemplo: Creación de tenant Acme
DO $$
DECLARE
    v_stream_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
    INSERT INTO events.event_store 
        (stream_id, stream_type, version, event_type, payload, metadata)
    VALUES
        (v_stream_id, 'TENANT', 1, 'TenantCreated', 
         '{"name": "Acme Corporation", "tier": "ENTERPRISE"}',
         '{"actor_id": "system", "ip": "127.0.0.1"}'),
        
        (v_stream_id, 'TENANT', 2, 'TenantActivated', 
         '{"status": "ACTIVE"}',
         '{"actor_id": "admin", "ip": "127.0.0.1"}');
END $$;

-- Stream de ejemplo: Creación de tenant Beta
DO $$
DECLARE
    v_stream_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    INSERT INTO events.event_store 
        (stream_id, stream_type, version, event_type, payload, metadata)
    VALUES
        (v_stream_id, 'TENANT', 1, 'TenantCreated', 
         '{"name": "Beta Industries", "tier": "STANDARD"}',
         '{"actor_id": "system", "ip": "127.0.0.1"}'),
        
        (v_stream_id, 'TENANT', 2, 'TenantActivated', 
         '{"status": "ACTIVE"}',
         '{"actor_id": "admin", "ip": "127.0.0.1"}');
END $$;

-- =============================================================================
-- SAGA DE PRUEBA (Ejemplo de flujo completo exitoso)
-- CORRECCIÓN #7: Usar tabla sys.saga_history_steps en lugar de JSONB
-- =============================================================================
DO $$
DECLARE
    v_saga_id UUID := uuid_generate_v4();
    v_campaign_id UUID := uuid_generate_v4();
BEGIN
    -- Crear SAGA
    INSERT INTO sys.sagas 
        (saga_id, tenant_id, saga_type, current_step, state, payload)
    VALUES
        (v_saga_id, 
         '11111111-1111-1111-1111-111111111111',
         'CAMPAIGN_CREATION',
         'Cierre',
         'COMPLETED',
         jsonb_build_object(
             'campaign_id', v_campaign_id,
             'campaign_name', 'Test Campaign',
             'budget', 1000.00,
             'sku', 'ACME-WIDGET-001',
             'quantity', 10
         ));
    
    -- Agregar pasos al historial (usando la nueva tabla)
    INSERT INTO sys.saga_history_steps (saga_id, step_name, status, payload, executed_at)
    VALUES
        (v_saga_id, 'Propuesta', 'OK', '{"phase": "initial"}'::JSONB, NOW() - INTERVAL '5 minutes'),
        (v_saga_id, 'Validación', 'OK', '{"checks_passed": true}'::JSONB, NOW() - INTERVAL '4 minutes'),
        (v_saga_id, 'Reserva', 'OK', '{"quantity_reserved": 10}'::JSONB, NOW() - INTERVAL '3 minutes'),
        (v_saga_id, 'Ejecución', 'OK', '{"ads_created": 5}'::JSONB, NOW() - INTERVAL '2 minutes'),
        (v_saga_id, 'Cierre', 'OK', '{"transaction_posted": true}'::JSONB, NOW() - INTERVAL '1 minute');
         
    -- Actualizar completed_at manualmente (trigger lo hace normalmente)
    UPDATE sys.sagas SET completed_at = NOW() WHERE saga_id = v_saga_id;
END $$;

-- =============================================================================
-- CLAVES DE IDEMPOTENCIA (Ejemplos de webhooks procesados)
-- =============================================================================
INSERT INTO sys.request_keys 
    (key, tenant_id, scope, status, expires_at, response_payload)
VALUES
    ('meta_webhook_abc123', '11111111-1111-1111-1111-111111111111', 'WEBHOOK_META', 
     'COMPLETED', NOW() + INTERVAL '24 hours',
     '{"status": "success", "message": "Campaign created"}'),
    
    ('meta_webhook_def456', '22222222-2222-2222-2222-222222222222', 'WEBHOOK_META', 
     'COMPLETED', NOW() + INTERVAL '24 hours',
     '{"status": "success", "message": "Budget updated"}'),
    
    ('payment_txn_xyz789', '11111111-1111-1111-1111-111111111111', 'API_PAYMENT', 
     'PROCESSING', NOW() + INTERVAL '2 hours',
     NULL)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- VERIFICACIÓN DE DATOS INSERTADOS
-- =============================================================================
\echo ''
\echo '========================================================================='
\echo 'DATOS DE PRUEBA INSERTADOS'
\echo '========================================================================='

\echo ''
\echo 'Tenants:'
SELECT id, name, status, tier FROM iam.tenants ORDER BY name;

\echo ''
\echo 'Políticas por tenant:'
SELECT 
    t.name as tenant,
    p.rule_type,
    p.enforcement_level,
    p.is_active
FROM gobernanza.policies p
JOIN iam.tenants t ON p.tenant_id = t.id
ORDER BY t.name, p.rule_type;

\echo ''
\echo 'Inventario por tenant:'
SELECT 
    t.name as tenant,
    i.sku,
    i.quantity_on_hand,
    i.quantity_reserved,
    i.available
FROM stock.inventory_items i
JOIN iam.tenants t ON i.tenant_id = t.id
ORDER BY t.name, i.sku;

\echo ''
\echo 'Balance financiero por tenant:'
SELECT 
    t.name as tenant,
    l.account_type,
    SUM(l.amount * l.direction) as balance
FROM finanzas.ledger_entries l
JOIN iam.tenants t ON l.tenant_id = t.id
GROUP BY t.name, l.account_type
ORDER BY t.name, l.account_type;

\echo ''
\echo 'Eventos en Event Store:'
SELECT 
    stream_type,
    event_type,
    COUNT(*) as count
FROM events.event_store
GROUP BY stream_type, event_type
ORDER BY stream_type, event_type;

\echo ''
\echo 'SAGAs creadas:'
SELECT 
    t.name as tenant,
    s.saga_type,
    s.state,
    s.current_step
FROM sys.sagas s
JOIN iam.tenants t ON s.tenant_id = t.id
ORDER BY s.started_at DESC;

\echo ''
\echo '========================================================================='
\echo 'DATOS DE PRUEBA LISTOS'
\echo '========================================================================='
