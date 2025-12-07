-- =============================================================================
-- ARCHIVO: 003_schema_stock.sql
-- PROPOSITO: Control de inventario con Optimistic Locking
-- BLUEPRINT: RFC-PHOENIX-01 - Sección 1.2
-- =============================================================================

-- Crear esquema stock
CREATE SCHEMA IF NOT EXISTS stock;

-- =============================================================================
-- TABLA: stock.inventory_items
-- DESCRIPCION: Prevención de sobreventa mediante bloqueo optimista
-- CONCURRENCY: Utiliza columna 'version' para Optimistic Locking
-- =============================================================================
CREATE TABLE stock.inventory_items (
    -- ID interno del item
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Aislamiento multi-tenant
    tenant_id UUID NOT NULL,
    
    -- Código de producto del cliente
    sku VARCHAR(100) NOT NULL,
    
    -- Stock físico real
    quantity_on_hand INTEGER NOT NULL CHECK (quantity_on_hand >= 0),
    
    -- Stock comprometido en campañas activas
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    
    -- Columna calculada virtual: stock disponible = on_hand - reserved
    available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    
    -- Optimistic Locking: Se incrementa en cada UPDATE
    version BIGINT NOT NULL DEFAULT 1,
    
    -- Auditoría de actualización
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Key a tenants
    CONSTRAINT fk_inventory_tenant FOREIGN KEY (tenant_id) 
        REFERENCES iam.tenants(id) 
        ON DELETE RESTRICT,
    
    -- Un tenant no puede tener SKUs duplicados
    CONSTRAINT uq_inventory_tenant_sku UNIQUE (tenant_id, sku),
    
    -- Constraint de negocio: no se puede reservar más de lo que existe
    CONSTRAINT chk_inventory_reservation_valid CHECK (quantity_reserved <= quantity_on_hand)
);

-- =============================================================================
-- ÍNDICES DE ALTO RENDIMIENTO
-- =============================================================================

-- Índice principal para consultas por tenant
CREATE INDEX idx_inventory_tenant_id ON stock.inventory_items(tenant_id);

-- CORRECCIÓN #10: Índice idx_inventory_tenant_sku ELIMINADO (redundante)
-- El constraint UNIQUE(tenant_id, sku) ya crea un índice automáticamente

-- Índice para detectar items con bajo stock (alertas de reabastecimiento)
CREATE INDEX idx_inventory_low_stock ON stock.inventory_items(tenant_id, available) 
    WHERE available < 10;

-- Índice para auditoría temporal
CREATE INDEX idx_inventory_last_updated ON stock.inventory_items(last_updated DESC);

-- =============================================================================
-- FUNCIÓN: Actualización con Optimistic Locking
-- =============================================================================
CREATE OR REPLACE FUNCTION stock.update_inventory_with_version_check()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementar automáticamente la versión en cada UPDATE
    NEW.version = OLD.version + 1;
    
    -- Actualizar timestamp
    NEW.last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_version_increment
    BEFORE UPDATE ON stock.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION stock.update_inventory_with_version_check();

-- =============================================================================
-- FUNCIÓN AUXILIAR: Reservar stock con verificación atómica
-- PROPOSITO: Uso típico desde la capa de aplicación con manejo de concurrencia
-- =============================================================================
CREATE OR REPLACE FUNCTION stock.reserve_inventory(
    p_tenant_id UUID,
    p_sku VARCHAR,
    p_quantity INTEGER,
    p_expected_version BIGINT
)
RETURNS TABLE (
    success BOOLEAN,
    new_version BIGINT,
    available_now INTEGER,
    message TEXT
) AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Bloqueo de fila para escritura (SELECT FOR UPDATE NOWAIT) - CORRECCIÓN #5
    -- NOWAIT evita deadlocks: si la fila está bloqueada, falla inmediatamente
    SELECT * INTO v_item
    FROM stock.inventory_items
    WHERE tenant_id = p_tenant_id 
      AND sku = p_sku
    FOR UPDATE NOWAIT;
    
    -- Verificar si el item existe
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'SKU not found';
        RETURN;
    END IF;
    
    -- Verificar versión (Optimistic Locking)
    IF v_item.version != p_expected_version THEN
        RETURN QUERY SELECT FALSE, v_item.version, v_item.available, 
            'Version mismatch - concurrent modification detected';
        RETURN;
    END IF;
    
    -- Verificar disponibilidad
    IF v_item.available < p_quantity THEN
        RETURN QUERY SELECT FALSE, v_item.version, v_item.available, 
            'Insufficient stock';
        RETURN;
    END IF;
    
    -- Actualizar reserva
    UPDATE stock.inventory_items
    SET quantity_reserved = quantity_reserved + p_quantity
    WHERE id = v_item.id;
    
    -- Retornar éxito
    RETURN QUERY 
        SELECT TRUE, v_item.version + 1, v_item.available - p_quantity, 
            'Reservation successful'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN AUXILIAR: Liberar stock reservado
-- =============================================================================
CREATE OR REPLACE FUNCTION stock.release_inventory(
    p_tenant_id UUID,
    p_sku VARCHAR,
    p_quantity INTEGER
)
RETURNS TABLE (
    success BOOLEAN,
    new_available INTEGER,
    message TEXT
) AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Bloqueo de fila (NOWAIT para evitar deadlocks) - CORRECCIÓN #5
    SELECT * INTO v_item
    FROM stock.inventory_items
    WHERE tenant_id = p_tenant_id 
      AND sku = p_sku
    FOR UPDATE NOWAIT;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 'SKU not found';
        RETURN;
    END IF;
    
    -- Verificar que no se libere más de lo reservado
    IF v_item.quantity_reserved < p_quantity THEN
        RETURN QUERY SELECT FALSE, v_item.available, 
            'Cannot release more than reserved';
        RETURN;
    END IF;
    
    -- Liberar reserva
    UPDATE stock.inventory_items
    SET quantity_reserved = quantity_reserved - p_quantity
    WHERE id = v_item.id;
    
    RETURN QUERY 
        SELECT TRUE, v_item.available + p_quantity, 
            'Release successful'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =============================================================================
COMMENT ON TABLE stock.inventory_items IS 'Control de inventario con Optimistic Locking para prevenir sobreventa';
COMMENT ON COLUMN stock.inventory_items.quantity_on_hand IS 'Stock físico real disponible en almacén';
COMMENT ON COLUMN stock.inventory_items.quantity_reserved IS 'Stock comprometido en campañas activas (pendiente de despacho)';
COMMENT ON COLUMN stock.inventory_items.available IS 'Columna calculada: on_hand - reserved (stock realmente disponible para nuevas ventas)';
COMMENT ON COLUMN stock.inventory_items.version IS 'Control de concurrencia optimista - se incrementa en cada UPDATE';
COMMENT ON FUNCTION stock.reserve_inventory IS 'Reserva stock atómicamente con verificación de versión y disponibilidad';
COMMENT ON FUNCTION stock.release_inventory IS 'Libera stock previamente reservado (usado en compensaciones de SAGA)';
