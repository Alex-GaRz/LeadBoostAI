-- =============================================================================
-- ARCHIVO: 999_rollback.sql
-- PROPOSITO: Script de rollback completo para deshacer toda la migración
-- BLUEPRINT: RFC-PHOENIX-01 - Plan de Contingencia
-- USO: Ejecutar este script SOLO si hay problemas críticos en producción
-- =============================================================================

-- =============================================================================
-- ADVERTENCIA CRÍTICA
-- =============================================================================
-- Este script eliminará TODOS los esquemas y datos creados por la migración.
-- NO ES REVERSIBLE. Asegúrese de tener backups completos antes de ejecutar.
-- Se recomienda ejecutar en una transacción para poder hacer rollback si es necesario:
--
-- BEGIN;
-- \i 999_rollback.sql
-- -- Verificar que todo está correcto
-- ROLLBACK; -- o COMMIT; si todo está bien
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'INICIANDO ROLLBACK COMPLETO DE RFC-PHOENIX-01';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- PASO 1: Eliminar esquema de migración (PRIMERO - dependencias)
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'PASO 1: Eliminando esquema migration...';
    
    -- Eliminar funciones
    DROP FUNCTION IF EXISTS migration.validate_migrated_data();
    DROP FUNCTION IF EXISTS migration.get_tenant_migration_stats(UUID);
    
    -- Eliminar tablas
    DROP TABLE IF EXISTS migration.batch_control CASCADE;
    DROP TABLE IF EXISTS migration.audit_logs CASCADE;
    DROP TABLE IF EXISTS migration.campaigns CASCADE;
    DROP TABLE IF EXISTS migration.raw_signals CASCADE;
    
    -- Eliminar esquema
    DROP SCHEMA IF EXISTS migration CASCADE;
    
    RAISE NOTICE 'COMPLETADO: Esquema migration eliminado';
END $$;

-- =============================================================================
-- PASO 2: Eliminar esquema events (Event Store y Snapshots)
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'PASO 2: Eliminando esquema events...';
    
    -- Eliminar funciones
    DROP FUNCTION IF EXISTS events.get_stream_state(UUID);
    DROP FUNCTION IF EXISTS events.create_snapshot(UUID, VARCHAR, INTEGER, JSONB);
    DROP FUNCTION IF EXISTS events.cleanup_old_snapshots();
    
    -- Eliminar vistas
    DROP VIEW IF EXISTS events.stream_summary CASCADE;
    
    -- Eliminar triggers y funciones de triggers
    DROP TRIGGER IF EXISTS trg_prevent_event_update ON events.event_store;
    DROP TRIGGER IF EXISTS trg_prevent_event_delete ON events.event_store;
    DROP FUNCTION IF EXISTS events.prevent_event_update();
    DROP FUNCTION IF EXISTS events.prevent_event_delete();
    
    -- Eliminar tablas
    DROP TABLE IF EXISTS events.snapshots CASCADE;
    DROP TABLE IF EXISTS events.event_store CASCADE;
    
    -- Eliminar esquema
    DROP SCHEMA IF EXISTS events CASCADE;
    
    RAISE NOTICE 'COMPLETADO: Esquema events eliminado';
END $$;

-- =============================================================================
-- PASO 3: Eliminar esquema sys (Idempotencia y SAGAs)
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'PASO 3: Eliminando esquema sys...';
    
    -- Eliminar funciones
    DROP FUNCTION IF EXISTS sys.cleanup_expired_request_keys();
    DROP FUNCTION IF EXISTS sys.saga_add_step(UUID, VARCHAR, VARCHAR, JSONB);
    DROP FUNCTION IF EXISTS sys.saga_complete(UUID, JSONB);
    DROP FUNCTION IF EXISTS sys.saga_fail(UUID, JSONB);
    
    -- Eliminar vistas
    DROP VIEW IF EXISTS sys.active_sagas CASCADE;
    
    -- Eliminar triggers y funciones de triggers
    DROP TRIGGER IF EXISTS trg_sagas_update_timestamp ON sys.sagas;
    DROP FUNCTION IF EXISTS sys.update_saga_timestamp();
    
    -- Eliminar tablas
    DROP TABLE IF EXISTS sys.sagas CASCADE;
    DROP TABLE IF EXISTS sys.request_keys CASCADE;
    
    -- Eliminar esquema
    DROP SCHEMA IF EXISTS sys CASCADE;
    
    RAISE NOTICE 'COMPLETADO: Esquema sys eliminado';
END $$;

-- =============================================================================
-- PASO 4: Eliminar esquema gobernanza
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'PASO 4: Eliminando esquema gobernanza...';
    
    -- Eliminar funciones
    DROP FUNCTION IF EXISTS gobernanza.validate_campaign(UUID, DECIMAL, DECIMAL);
    
    -- Eliminar vistas
    DROP VIEW IF EXISTS gobernanza.active_policies CASCADE;
    
    -- Eliminar triggers y funciones de triggers
    DROP TRIGGER IF EXISTS trg_policies_update_timestamp ON gobernanza.policies;
    DROP FUNCTION IF EXISTS gobernanza.update_policy_timestamp();
    
    -- Eliminar tablas
    DROP TABLE IF EXISTS gobernanza.policies CASCADE;
    
    -- Eliminar esquema
    DROP SCHEMA IF EXISTS gobernanza CASCADE;
    
    RAISE NOTICE 'COMPLETADO: Esquema gobernanza eliminado';
END $$;

-- =============================================================================
-- PASO 5: Eliminar esquema stock
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'PASO 5: Eliminando esquema stock...';
    
    -- Eliminar funciones
    DROP FUNCTION IF EXISTS stock.reserve_inventory(UUID, VARCHAR, INTEGER, BIGINT);
    DROP FUNCTION IF EXISTS stock.release_inventory(UUID, VARCHAR, INTEGER);
    
    -- Eliminar triggers y funciones de triggers
    DROP TRIGGER IF EXISTS trg_inventory_version_increment ON stock.inventory_items;
    DROP FUNCTION IF EXISTS stock.update_inventory_with_version_check();
    
    -- Eliminar tablas
    DROP TABLE IF EXISTS stock.inventory_items CASCADE;
    
    -- Eliminar esquema
    DROP SCHEMA IF EXISTS stock CASCADE;
    
    RAISE NOTICE 'COMPLETADO: Esquema stock eliminado';
END $$;

-- =============================================================================
-- PASO 6: Eliminar esquema finanzas
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'PASO 6: Eliminando esquema finanzas...';
    
    -- Eliminar triggers y funciones de triggers
    DROP TRIGGER IF EXISTS trg_prevent_ledger_update ON finanzas.ledger_entries;
    DROP TRIGGER IF EXISTS trg_prevent_ledger_delete ON finanzas.ledger_entries;
    DROP FUNCTION IF EXISTS finanzas.prevent_ledger_update();
    DROP FUNCTION IF EXISTS finanzas.prevent_ledger_delete();
    
    -- Eliminar tablas
    DROP TABLE IF EXISTS finanzas.ledger_entries CASCADE;
    
    -- Eliminar esquema
    DROP SCHEMA IF EXISTS finanzas CASCADE;
    
    RAISE NOTICE 'COMPLETADO: Esquema finanzas eliminado';
END $$;

-- =============================================================================
-- PASO 7: Eliminar esquema iam (ÚLTIMO - es la raíz de dependencias)
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE 'PASO 7: Eliminando esquema iam...';
    
    -- Eliminar tablas
    DROP TABLE IF EXISTS iam.tenants CASCADE;
    
    -- Eliminar esquema
    DROP SCHEMA IF EXISTS iam CASCADE;
    
    RAISE NOTICE 'COMPLETADO: Esquema iam eliminado';
END $$;

-- =============================================================================
-- PASO 8: Eliminar extensiones (si no son usadas por otros sistemas)
-- =============================================================================
-- NOTA: Solo ejecutar si está seguro de que ningún otro esquema usa estas extensiones
-- Comentado por seguridad - descomentar si es necesario
-- DO $$
-- BEGIN
--     RAISE NOTICE 'PASO 8: Eliminando extensiones...';
--     DROP EXTENSION IF EXISTS "uuid-ossp";
--     RAISE NOTICE 'COMPLETADO: Extensiones eliminadas';
-- END $$;

-- =============================================================================
-- VERIFICACIÓN FINAL
-- =============================================================================
DO $$
DECLARE
    v_remaining_schemas INTEGER;
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'VERIFICACIÓN FINAL';
    RAISE NOTICE '=============================================================================';
    
    -- Contar esquemas que deberían haber sido eliminados
    SELECT COUNT(*) INTO v_remaining_schemas
    FROM information_schema.schemata
    WHERE schema_name IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration');
    
    IF v_remaining_schemas > 0 THEN
        RAISE WARNING 'ADVERTENCIA: Todavía existen % esquemas del sistema.', v_remaining_schemas;
        RAISE WARNING 'Esquemas restantes:';
        
        FOR rec IN 
            SELECT schema_name 
            FROM information_schema.schemata
            WHERE schema_name IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
        LOOP
            RAISE WARNING '  - %', rec.schema_name;
        END LOOP;
    ELSE
        RAISE NOTICE 'ÉXITO: Todos los esquemas fueron eliminados correctamente.';
    END IF;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'ROLLBACK COMPLETADO';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '=============================================================================';
END $$;

-- =============================================================================
-- INSTRUCCIONES POST-ROLLBACK
-- =============================================================================
-- 
-- Después de ejecutar este rollback:
-- 
-- 1. Verificar que los servicios de aplicación estén apuntando de vuelta a Firebase
-- 2. Restaurar configuraciones de conexión anteriores
-- 3. Revisar logs de aplicación para confirmar que no hay errores de conexión
-- 4. Si es necesario, restaurar el backup de la base de datos al estado pre-migración
-- 5. Documentar el motivo del rollback para análisis post-mortem
-- 6. Planificar correcciones antes de reintentar la migración
-- 
-- Para restaurar desde backup (ejemplo):
-- pg_restore -U postgres -d leadboost_ai -c -F c /ruta/al/backup_pre_migration.dump
-- 
-- =============================================================================
