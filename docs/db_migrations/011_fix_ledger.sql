-- =============================================================================
-- ARCHIVO: 011_fix_ledger_v2.sql
-- PROPOSITO: Reparación quirúrgica de la función financiera (V2 - Sin ambigüedad)
-- =============================================================================

\echo 'APLICANDO PARCHE FINANCIERO V2...'

CREATE OR REPLACE FUNCTION finanzas.post_transaction(
    p_tenant_id UUID,
    p_transaction_group_id UUID,
    p_entries JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    transaction_group_id UUID,
    entries_created INTEGER,
    message TEXT
) AS $$
DECLARE
    v_entry JSONB;
    v_balance DECIMAL(18,4) := 0;
    v_count INTEGER := 0;
BEGIN
    -- 1. Habilitar bypass de seguridad
    PERFORM set_config('app.bypass_ledger_insert_check', 'true', TRUE);
    
    -- 2. IDEMPOTENCIA (Con alias 'tg' para evitar ambigüedad)
    IF EXISTS (SELECT 1 FROM finanzas.transaction_groups tg WHERE tg.transaction_group_id = p_transaction_group_id) THEN
        -- Con alias 'le'
        SELECT COUNT(*) INTO v_count FROM finanzas.ledger_entries le WHERE le.transaction_group_id = p_transaction_group_id;
        RETURN QUERY SELECT TRUE, p_transaction_group_id, v_count, 'Transaction already processed (idempotent)'::TEXT;
        RETURN;
    END IF;

    -- 3. Validar entrada
    IF jsonb_array_length(p_entries) = 0 THEN
        RETURN QUERY SELECT FALSE, p_transaction_group_id, 0, 'ERROR: No entries provided';
        RETURN;
    END IF;
    
    -- 4. Calcular balance
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        v_balance := v_balance + 
            (v_entry->>'amount')::DECIMAL(18,4) * (v_entry->>'direction')::SMALLINT;
    END LOOP;
    
    IF v_balance != 0 THEN
        RAISE EXCEPTION 'DOUBLE ENTRY VIOLATION: Transaction balance is %. Expected 0.', v_balance;
    END IF;
    
    -- 5. Crear el Grupo de Transacción
    INSERT INTO finanzas.transaction_groups (transaction_group_id, tenant_id)
    VALUES (p_transaction_group_id, p_tenant_id);
    
    -- 6. Insertar las entradas
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries)
    LOOP
        INSERT INTO finanzas.ledger_entries (
            tenant_id,
            transaction_group_id,
            account_type,
            amount,
            currency,
            direction,
            reference_type,
            reference_id
        ) VALUES (
            p_tenant_id,
            p_transaction_group_id,
            v_entry->>'account_type',
            (v_entry->>'amount')::DECIMAL(18,4),
            COALESCE(v_entry->>'currency', 'USD'),
            (v_entry->>'direction')::SMALLINT,
            v_entry->>'reference_type',
            (v_entry->>'reference_id')::UUID
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT TRUE, p_transaction_group_id, v_count, 'Transaction posted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

\echo 'PARCHE V2 APLICADO CORRECTAMENTE.'