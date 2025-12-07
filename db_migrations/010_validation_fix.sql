-- =============================================================================
-- ARCHIVO: 010_validation_fix.sql
-- PROPOSITO: Suite de validación CORREGIDA y BLINDADA contra Windows
-- INCLUYE: Seed data + Tests unitarios
-- =============================================================================

\echo '========================================================================='
\echo 'INICIANDO VALIDACION NUCLEAR V2'
\echo '========================================================================='

-- 1. GARANTIZAR DATOS DE PRUEBA (SEED)
-- Insertamos el tenant si no existe para evitar errores de Foreign Key
INSERT INTO iam.tenants (id, name, status, tier) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Acme Test Corp', 'ACTIVE', 'ENTERPRISE')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- TEST 1: Verificar esquemas
-- =============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'finanzas') THEN
        RAISE NOTICE '✓ PASS: Esquemas base detectados';
    ELSE
        RAISE EXCEPTION '✗ FAIL: No se encontraron los esquemas';
    END IF;
END $$;

-- =============================================================================
-- TEST 3 (CORREGIDO): Verificar Ledger con JSON Nativo (Sin error de texto)
-- =============================================================================
\echo 'TEST 3: Verificando Ledger...'
DO $$
DECLARE
    v_txn_group UUID := uuid_generate_v4();
    v_result RECORD;
    v_payload JSONB;
BEGIN
    -- Construir JSON con funciones nativas (Inmune a errores de Windows)
    v_payload := jsonb_build_array(
        jsonb_build_object(
            'account_type', 'WALLET', 
            'amount', 100.00, 
            'direction', 1, 
            'reference_type', 'TEST', 
            'reference_id', v_txn_group
        ),
        jsonb_build_object(
            'account_type', 'SPEND', 
            'amount', 100.00, 
            'direction', -1, 
            'reference_type', 'TEST', 
            'reference_id', v_txn_group
        )
    );

    SELECT * INTO v_result FROM finanzas.post_transaction(
        '11111111-1111-1111-1111-111111111111',
        v_txn_group,
        v_payload
    );
    
    IF v_result.success THEN
        RAISE NOTICE '✓ PASS: Transacción financiera insertada correctamente';
    ELSE
        RAISE EXCEPTION '✗ FAIL: Error en transacción: %', v_result.message;
    END IF;
END $$;

-- =============================================================================
-- TEST 3.2 (CORREGIDO): Verificar SAGAs (Con payload obligatorio)
-- =============================================================================
\echo 'TEST 3.2: Verificando SAGAs...'
DO $$
DECLARE
    v_saga_id UUID;
BEGIN
    -- Corregido: Se agrega el campo 'payload' obligatorio
    INSERT INTO sys.sagas (tenant_id, saga_type, state, current_step, payload, started_at, updated_at)
    VALUES (
        '11111111-1111-1111-1111-111111111111', 
        'CAMPAIGN_CREATION', -- Debe coincidir con el CHECK constraint
        'STARTED', 
        'step_1', 
        '{"test": true}'::jsonb, -- Payload agregado
        NOW(), 
        NOW()
    )
    RETURNING saga_id INTO v_saga_id;
    
    IF v_saga_id IS NOT NULL THEN
        RAISE NOTICE '✓ PASS: SAGA creada correctamente';
    END IF;
END $$;

-- =============================================================================
-- TEST 4 & 5: Inventario (Depende del Tenant creado arriba)
-- =============================================================================
\echo 'TEST 4: Verificando Inventario...'
DO $$
DECLARE
    v_item_id UUID;
    v_result RECORD;
BEGIN
    -- Insertar item
    INSERT INTO stock.inventory_items (tenant_id, sku, quantity_on_hand, quantity_reserved)
    VALUES ('11111111-1111-1111-1111-111111111111', 'TEST-SKU-FIX', 100, 0)
    RETURNING id INTO v_item_id;

    -- Probar reserva
    SELECT * INTO v_result FROM stock.reserve_inventory(
        '11111111-1111-1111-1111-111111111111',
        'TEST-SKU-FIX',
        10,
        1 -- Version esperada
    );

    IF v_result.success THEN
        RAISE NOTICE '✓ PASS: Inventario reservado correctamente';
    ELSE
        RAISE EXCEPTION '✗ FAIL: Reserva falló: %', v_result.message;
    END IF;
END $$;

-- =============================================================================
-- TEST 6: Gobernanza
-- =============================================================================
\echo 'TEST 6: Verificando Gobernanza...'
DO $$
DECLARE
    v_result RECORD;
BEGIN
    -- Insertar política
    INSERT INTO gobernanza.policies (tenant_id, rule_type, config, enforcement_level)
    VALUES (
        '11111111-1111-1111-1111-111111111111', 
        'MAX_CPA', 
        '{"threshold": 10.00}', 
        'BLOCK'
    );

    -- Validar (debe bloquear porque CPA 15 > 10)
    SELECT * INTO v_result FROM gobernanza.validate_campaign(
        '11111111-1111-1111-1111-111111111111',
        15.00, 
        1000.00
    );

    IF v_result.enforcement_action = 'BLOCK' THEN
        RAISE NOTICE '✓ PASS: Motor de Gobernanza bloqueó correctamente';
    ELSE
        RAISE EXCEPTION '✗ FAIL: Gobernanza falló en bloquear';
    END IF;
END $$;

\echo ''
\echo '========================================================================='
\echo 'VICTORIA: TODOS LOS SISTEMAS OPERATIVOS'
\echo '========================================================================='