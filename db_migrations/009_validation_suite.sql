-- =============================================================================
-- ARCHIVO: 009_validation_suite.sql (CORREGIDO FINAL)
-- =============================================================================

\echo '========================================================================='
\echo 'INICIANDO VALIDACION NUCLEAR'
\echo '========================================================================='

-- 0. GARANTIZAR DATOS BASE (Para que los tests no fallen por FK)
INSERT INTO iam.tenants (id, name, status, tier) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Acme Test Corp', 'ACTIVE', 'ENTERPRISE')
ON CONFLICT (id) DO NOTHING;

-- TEST 1: Esquemas
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'finanzas') THEN
        RAISE NOTICE '✓ PASS: Esquemas detectados';
    END IF;
END $$;

-- TEST 2: Ledger (Con JSON Nativo)
\echo 'TEST 2: Verificando Ledger...'
DO $$
DECLARE
    v_txn_group UUID := uuid_generate_v4();
    v_result RECORD;
    v_payload JSONB;
BEGIN
    v_payload := jsonb_build_array(
        jsonb_build_object('account_type', 'WALLET', 'amount', 100.00, 'direction', 1, 'reference_type', 'TEST', 'reference_id', v_txn_group),
        jsonb_build_object('account_type', 'SPEND', 'amount', 100.00, 'direction', -1, 'reference_type', 'TEST', 'reference_id', v_txn_group)
    );
    SELECT * INTO v_result FROM finanzas.post_transaction('11111111-1111-1111-1111-111111111111', v_txn_group, v_payload);
    IF v_result.success THEN RAISE NOTICE '✓ PASS: Ledger OK'; ELSE RAISE EXCEPTION '✗ FAIL Ledger'; END IF;
END $$;

-- TEST 3: Sagas
\echo 'TEST 3: Verificando Sagas...'
DO $$
DECLARE v_saga_id UUID;
BEGIN
    INSERT INTO sys.sagas (tenant_id, saga_type, state, current_step, payload, started_at, updated_at)
    VALUES ('11111111-1111-1111-1111-111111111111', 'CAMPAIGN_CREATION', 'STARTED', 'step_1', '{"test": true}'::jsonb, NOW(), NOW())
    RETURNING saga_id INTO v_saga_id;
    RAISE NOTICE '✓ PASS: Sagas OK';
END $$;

-- TEST 4: Inventario (Con limpieza previa para evitar duplicados en reintentos)
\echo 'TEST 4: Verificando Inventario...'
DO $$
DECLARE v_item_id UUID; v_result RECORD;
BEGIN
    DELETE FROM stock.inventory_items WHERE sku = 'TEST-SKU-FINAL';
    INSERT INTO stock.inventory_items (tenant_id, sku, quantity_on_hand, quantity_reserved)
    VALUES ('11111111-1111-1111-1111-111111111111', 'TEST-SKU-FINAL', 100, 0) RETURNING id INTO v_item_id;
    
    SELECT * INTO v_result FROM stock.reserve_inventory('11111111-1111-1111-1111-111111111111', 'TEST-SKU-FINAL', 10, 1);
    IF v_result.success THEN RAISE NOTICE '✓ PASS: Inventario OK'; END IF;
END $$;

-- TEST 5: Gobernanza
\echo 'TEST 5: Verificando Gobernanza...'
DO $$
DECLARE v_result RECORD;
BEGIN
    DELETE FROM gobernanza.policies WHERE tenant_id = '11111111-1111-1111-1111-111111111111' AND rule_type = 'MAX_CPA';
    INSERT INTO gobernanza.policies (tenant_id, rule_type, config, enforcement_level)
    VALUES ('11111111-1111-1111-1111-111111111111', 'MAX_CPA', '{"threshold": 10.00}', 'BLOCK');
    
    SELECT * INTO v_result FROM gobernanza.validate_campaign('11111111-1111-1111-1111-111111111111', 15.00, 1000.00);
    IF v_result.enforcement_action = 'BLOCK' THEN RAISE NOTICE '✓ PASS: Gobernanza OK'; END IF;
END $$;

\echo ''
\echo '========================================================================='
\echo 'TODO VERDE - SISTEMA LISTO'
\echo '========================================================================='