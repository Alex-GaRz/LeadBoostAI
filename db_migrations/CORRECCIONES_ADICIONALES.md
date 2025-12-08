# CORRECCIONES ADICIONALES - IDEMPOTENCIA Y VISTAS

**Fecha:** 2024
**RFC:** RFC-PHOENIX-01  
**Status:** ✅ Implementado

---

## 📋 RESUMEN EJECUTIVO

Dos correcciones adicionales para garantizar idempotencia transaccional en el ledger financiero y reparar una vista rota por la normalización del historial de SAGAs.

---

## 🎯 CORRECCIÓN #11: Idempotencia Transaccional en Ledger

### Problema
El sistema actual no tiene protección contra procesamiento duplicado de transacciones financieras. En escenarios de reintento (timeouts, failures, webhooks duplicados), la misma transacción podría insertarse múltiples veces, violando la integridad contable.

### Solución Implementada

#### 1. Nueva Tabla: `finanzas.transaction_groups`
```sql
CREATE TABLE finanzas.transaction_groups (
    transaction_group_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_transaction_groups_tenant FOREIGN KEY (tenant_id)
        REFERENCES iam.tenants(id)
        ON DELETE RESTRICT
);

CREATE INDEX idx_transaction_groups_tenant ON finanzas.transaction_groups(tenant_id);
```

**Propósito:** Actúa como tabla de idempotencia. El PK en `transaction_group_id` garantiza que cada transacción se procese exactamente una vez.

#### 2. Foreign Key desde `ledger_entries`
```sql
ALTER TABLE finanzas.ledger_entries
    ADD CONSTRAINT fk_ledger_transaction_group 
    FOREIGN KEY (transaction_group_id) 
    REFERENCES finanzas.transaction_groups(transaction_group_id)
    ON DELETE RESTRICT;
```

**Garantía:** Todas las entradas en el ledger DEBEN pertenecer a un grupo registrado en `transaction_groups`.

#### 3. Modificación de `finanzas.post_transaction()`

**Lógica de Idempotencia:**
```sql
-- PASO 1: Verificar si ya existe (idempotencia)
IF EXISTS (SELECT 1 FROM finanzas.transaction_groups 
           WHERE transaction_group_id = p_transaction_group_id) THEN
    -- Devolver éxito sin re-procesar
    RETURN 'Transaction already processed (idempotent)';
END IF;

-- PASO 2: Validar balance = 0 (doble entrada)
IF v_balance != 0 THEN
    RAISE EXCEPTION 'DOUBLE ENTRY VIOLATION';
END IF;

-- PASO 3: Registrar transacción (marca como procesada)
INSERT INTO finanzas.transaction_groups (transaction_group_id, tenant_id)
VALUES (p_transaction_group_id, p_tenant_id);

-- PASO 4: Insertar entradas en ledger
-- (si falla aquí, el rollback incluye transaction_groups)
```

### Escenarios Cubiertos

| Escenario | Comportamiento |
|-----------|----------------|
| Primera ejecución | Inserta en `transaction_groups` + `ledger_entries` |
| Reintento inmediato | Detecta UUID duplicado, devuelve éxito sin re-procesar |
| Race condition (doble llamada simultánea) | Una gana el INSERT, la otra falla por PK duplicate (PostgreSQL maneja) |
| Transacción incompleta (crash durante INSERT) | Rollback elimina `transaction_groups`, permite reintentar |

### Archivos Modificados
- `db_migrations/002_schema_finanzas.sql`:
  - Agregada tabla `transaction_groups` (línea ~55)
  - Agregado FK constraint (línea ~80)
  - Modificado `post_transaction()` para verificar/insertar en `transaction_groups` (línea ~155)
  - Actualizada documentación (línea ~325)

---

## 🎯 CORRECCIÓN #12: Vista `sys.active_sagas` Rota

### Problema
La corrección #7 eliminó la columna `sys.sagas.history` (JSONB) y la reemplazó con la tabla normalizada `sys.saga_history_steps`. Sin embargo, la vista `sys.active_sagas` seguía referenciando:
```sql
jsonb_array_length(s.history) AS steps_executed  -- ❌ Columna history no existe
```

**Error al ejecutar:** `ERROR: column s.history does not exist`

### Solución Implementada

#### Vista Corregida
```sql
CREATE OR REPLACE VIEW sys.active_sagas AS
SELECT 
    s.saga_id,
    s.tenant_id,
    t.name AS tenant_name,
    s.saga_type,
    s.current_step,
    s.state,
    COALESCE(
        (SELECT COUNT(*) 
         FROM sys.saga_history_steps sh 
         WHERE sh.saga_id = s.saga_id),
        0
    ) AS steps_executed,  -- ✅ Ahora usa tabla normalizada
    s.started_at,
    s.updated_at,
    EXTRACT(EPOCH FROM (NOW() - s.started_at)) AS duration_seconds
FROM sys.sagas s
INNER JOIN iam.tenants t ON s.tenant_id = t.id
WHERE s.state IN ('STARTED', 'PENDING', 'COMPENSATING')
ORDER BY s.started_at DESC;
```

**Cambio clave:**
- ❌ `jsonb_array_length(s.history)`  
- ✅ `(SELECT COUNT(*) FROM sys.saga_history_steps WHERE saga_id = s.saga_id)`

### Rendimiento
- **Sin índice:** O(n) scan de `saga_history_steps` por cada SAGA activa  
- **Con índice:** Ya existe `idx_saga_history_saga_id` (creado en corrección #7)  
- **Impacto esperado:** < 1ms para SAGAs con <100 pasos

### Archivos Modificados
- `db_migrations/005_schema_sys.sql`:
  - Vista `active_sagas` reescrita (línea ~245)
  - Documentación actualizada (línea ~278)

---

## 🧪 VALIDACIÓN

### Test Manual - Idempotencia Transaccional

```sql
-- Test de idempotencia
DO $$
DECLARE
    v_tenant_id UUID := (SELECT id FROM iam.tenants LIMIT 1);
    v_txn_id UUID := uuid_generate_v4();
    v_result_1 RECORD;
    v_result_2 RECORD;
BEGIN
    -- Primera ejecución: debe insertar
    SELECT * INTO v_result_1 FROM finanzas.post_transaction(
        v_tenant_id,
        v_txn_id,
        '[{"account_type": "WALLET", "amount": 100.00, "direction": 1, "reference_type": "TEST", "reference_id": "' || uuid_generate_v4() || '"},
          {"account_type": "SPEND", "amount": 100.00, "direction": -1, "reference_type": "TEST", "reference_id": "' || uuid_generate_v4() || '"}]'::JSONB
    );
    
    RAISE NOTICE 'Ejecución 1: % (% entradas)', v_result_1.message, v_result_1.entries_created;
    
    -- Segunda ejecución: debe detectar duplicado
    SELECT * INTO v_result_2 FROM finanzas.post_transaction(
        v_tenant_id,
        v_txn_id,
        '[{"account_type": "WALLET", "amount": 100.00, "direction": 1, "reference_type": "TEST", "reference_id": "' || uuid_generate_v4() || '"}]'::JSONB
    );
    
    RAISE NOTICE 'Ejecución 2: %', v_result_2.message;
    
    -- Verificar que solo hay 2 entradas (de la primera ejecución)
    IF (SELECT COUNT(*) FROM finanzas.ledger_entries WHERE transaction_group_id = v_txn_id) = 2 THEN
        RAISE NOTICE '✅ Idempotencia funciona correctamente';
    ELSE
        RAISE EXCEPTION '❌ Idempotencia falló: entradas duplicadas detectadas';
    END IF;
END $$;
```

### Test Manual - Vista Active SAGAs

```sql
-- Verificar que la vista funciona sin errores
SELECT * FROM sys.active_sagas LIMIT 10;

-- Verificar conteo de pasos
SELECT 
    saga_id,
    steps_executed,
    (SELECT COUNT(*) FROM sys.saga_history_steps sh WHERE sh.saga_id = s.saga_id) AS actual_steps
FROM sys.active_sagas s
WHERE steps_executed != (SELECT COUNT(*) FROM sys.saga_history_steps sh WHERE sh.saga_id = s.saga_id);
-- Debe devolver 0 filas (sin discrepancias)
```

---

## 📦 COMPATIBILIDAD

### Migración Requerida
✅ **Segura** - No requiere migración de datos existentes.

**Razones:**
1. `transaction_groups` es una tabla nueva (vacía al inicio)
2. `ledger_entries` puede tener entradas sin grupo correspondiente (datos legacy)
3. FK solo se verifica en INSERTs nuevos (no afecta datos existentes)
4. Vista `active_sagas` funciona con SAGAs antiguas (COUNT devuelve 0 si no hay steps)

### Plan de Rollback

```sql
-- Si necesitas revertir corrección #11
ALTER TABLE finanzas.ledger_entries DROP CONSTRAINT fk_ledger_transaction_group;
DROP TABLE finanzas.transaction_groups;
-- Restaurar post_transaction() original (sin check de idempotencia)

-- Si necesitas revertir corrección #12
-- Restaurar vista original (fallará si ejecutas con correction #7 aplicada)
CREATE OR REPLACE VIEW sys.active_sagas AS
SELECT 
    s.saga_id,
    jsonb_array_length(s.history) AS steps_executed,  -- ⚠️ Solo funciona si history existe
    ...
FROM sys.sagas s;
```

---

## 🔥 IMPACTO EN PRODUCCIÓN

### Corrección #11 (Idempotencia)
- ✅ **Previene:** Transacciones financieras duplicadas por reintentos
- ✅ **Protege:** Integridad contable en webhooks Meta Ads (frecuentemente duplicados)
- ⚠️ **Overhead:** +1 query SELECT antes de cada transacción (~0.5ms)
- ⚠️ **Almacenamiento:** +16 bytes por transacción (UUID + tenant_id + timestamp)

### Corrección #12 (Vista SAGAs)
- ✅ **Repara:** Error crítico que impedía monitorear SAGAs activas
- ✅ **Dashboard:** Permite visualizar SAGAs en ejecución nuevamente
- ⚠️ **Rendimiento:** Subquery por SAGA (mitigado con índice existente)

---

## 📊 MÉTRICAS POST-IMPLEMENTACIÓN

### KPIs a Monitorear

| Métrica | Query | Esperado |
|---------|-------|----------|
| Transacciones duplicadas evitadas | `SELECT COUNT(*) FROM finanzas.transaction_groups WHERE created_at > NOW() - INTERVAL '1 day'` - `COUNT(DISTINCT transaction_group_id FROM ledger_entries WHERE created_at > NOW() - INTERVAL '1 day')` | > 0 si hay reintentos |
| Tamaño de transaction_groups | `SELECT pg_size_pretty(pg_table_size('finanzas.transaction_groups'))` | < 1% del tamaño de ledger_entries |
| Rendimiento de active_sagas | `EXPLAIN ANALYZE SELECT * FROM sys.active_sagas` | < 50ms con 1000 SAGAs activas |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [x] Tabla `transaction_groups` creada con PK
- [x] FK desde `ledger_entries` agregado
- [x] `post_transaction()` modificado con lógica de idempotencia
- [x] Vista `active_sagas` corregida para usar `saga_history_steps`
- [x] Documentación actualizada en comments SQL
- [x] Tests de validación agregados
- [ ] Ejecutar migración en entorno de staging
- [ ] Monitorear logs de transacciones duplicadas detectadas (24h)
- [ ] Validar dashboard de SAGAs funciona sin errores
- [ ] Deploy a producción

---

## 🔗 REFERENCIAS

- **RFC-PHOENIX-01:** Blueprint principal
- **Corrección #1:** Doble entrada en ledger (complementa esta corrección)
- **Corrección #7:** Normalización de SAGA history (razón de corrección #12)
- **Idempotency Patterns:** https://microservices.io/patterns/communication-style/idempotent-consumer.html

---

**Generado automáticamente - No editar manualmente**  
**Archivo:** `CORRECCIONES_ADICIONALES.md`  
**Última actualización:** 2024
