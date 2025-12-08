-- =============================================================================
-- ARCHIVO: 002_schema_finanzas.sql
-- PROPOSITO: Ledger inmutable de doble entrada (CORREGIDO FINAL)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS finanzas;

-- 1. TABLA DE GRUPOS (Para Idempotencia)
CREATE TABLE finanzas.transaction_groups (
    transaction_group_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_transaction_groups_tenant FOREIGN KEY (tenant_id) REFERENCES iam.tenants(id) ON DELETE RESTRICT
);
CREATE INDEX idx_transaction_groups_tenant ON finanzas.transaction_groups(tenant_id);

-- 2. TABLA LEDGER
CREATE TABLE finanzas.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    global_sequence BIGSERIAL NOT NULL UNIQUE,
    tenant_id UUID NOT NULL,
    transaction_group_id UUID NOT NULL,
    account_type VARCHAR(32) NOT NULL CHECK (account_type IN ('WALLET', 'SPEND', 'HOLD')),
    amount DECIMAL(18,4) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    direction SMALLINT NOT NULL CHECK (direction IN (1, -1)),
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_ledger_tenant FOREIGN KEY (tenant_id) REFERENCES iam.tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ledger_transaction_group FOREIGN KEY (transaction_group_id) REFERENCES finanzas.transaction_groups(transaction_group_id) ON DELETE RESTRICT
);

-- Indices
CREATE INDEX idx_ledger_tenant_id ON finanzas.ledger_entries(tenant_id);
CREATE INDEX idx_ledger_transaction_group ON finanzas.ledger_entries(transaction_group_id);
CREATE INDEX idx_ledger_reference ON finanzas.ledger_entries(reference_type, reference_id);
CREATE INDEX idx_ledger_created_at ON finanzas.ledger_entries(created_at DESC);

-- 3. TRIGGERS DE INMUTABILIDAD
CREATE OR REPLACE FUNCTION finanzas.prevent_ledger_changes() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'LEDGER VIOLATION: Operations are forbidden on ledger_entries.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ledger_update BEFORE UPDATE ON finanzas.ledger_entries FOR EACH ROW EXECUTE FUNCTION finanzas.prevent_ledger_changes();
CREATE TRIGGER trg_prevent_ledger_delete BEFORE DELETE ON finanzas.ledger_entries FOR EACH ROW EXECUTE FUNCTION finanzas.prevent_ledger_changes();

-- 4. TRIGGER ANTI-INSERT DIRECTO
CREATE OR REPLACE FUNCTION finanzas.prevent_direct_insert() RETURNS TRIGGER AS $$
BEGIN
    IF current_setting('app.bypass_ledger_insert_check', TRUE) = 'true' THEN RETURN NEW; END IF;
    RAISE EXCEPTION 'LEDGER VIOLATION: Use finanzas.post_transaction()';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_direct_insert BEFORE INSERT ON finanzas.ledger_entries FOR EACH ROW EXECUTE FUNCTION finanzas.prevent_direct_insert();

-- 5. FUNCIÓN TRANSACCIONAL (CORE)
CREATE OR REPLACE FUNCTION finanzas.post_transaction(
    p_tenant_id UUID,
    p_transaction_group_id UUID,
    p_entries JSONB
)
RETURNS TABLE (success BOOLEAN, transaction_group_id UUID, entries_created INTEGER, message TEXT) AS $$
DECLARE
    v_entry JSONB;
    v_balance DECIMAL(18,4) := 0;
    v_count INTEGER := 0;
BEGIN
    PERFORM set_config('app.bypass_ledger_insert_check', 'true', TRUE);
    
    -- Check Idempotencia (Con Alias para evitar ambigüedad)
    IF EXISTS (SELECT 1 FROM finanzas.transaction_groups tg WHERE tg.transaction_group_id = p_transaction_group_id) THEN
        SELECT COUNT(*) INTO v_count FROM finanzas.ledger_entries le WHERE le.transaction_group_id = p_transaction_group_id;
        RETURN QUERY SELECT TRUE, p_transaction_group_id, v_count, 'Transaction already processed (idempotent)'::TEXT;
        RETURN;
    END IF;

    IF jsonb_array_length(p_entries) = 0 THEN
        RETURN QUERY SELECT FALSE, p_transaction_group_id, 0, 'ERROR: No entries provided'; RETURN;
    END IF;
    
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
        v_balance := v_balance + (v_entry->>'amount')::DECIMAL(18,4) * (v_entry->>'direction')::SMALLINT;
    END LOOP;
    
    IF v_balance != 0 THEN
        RAISE EXCEPTION 'DOUBLE ENTRY VIOLATION: Balance is %. Expected 0.', v_balance;
    END IF;
    
    INSERT INTO finanzas.transaction_groups (transaction_group_id, tenant_id) VALUES (p_transaction_group_id, p_tenant_id);
    
    FOR v_entry IN SELECT * FROM jsonb_array_elements(p_entries) LOOP
        INSERT INTO finanzas.ledger_entries (
            tenant_id, transaction_group_id, account_type, amount, currency, direction, reference_type, reference_id
        ) VALUES (
            p_tenant_id, p_transaction_group_id, v_entry->>'account_type', (v_entry->>'amount')::DECIMAL(18,4),
            COALESCE(v_entry->>'currency', 'USD'), (v_entry->>'direction')::SMALLINT, v_entry->>'reference_type', (v_entry->>'reference_id')::UUID
        );
        v_count := v_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT TRUE, p_transaction_group_id, v_count, 'Transaction posted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;