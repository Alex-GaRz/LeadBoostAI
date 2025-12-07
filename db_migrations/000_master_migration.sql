-- =============================================================================
-- ARCHIVO: 000_master_migration.sql
-- PROPOSITO: Script maestro para ejecutar toda la migración en orden
-- BLUEPRINT: RFC-PHOENIX-01 - Ejecución Secuencial Completa
-- =============================================================================

\echo '========================================================================='
\echo 'LEADBOOST AI - MIGRACIÓN A POSTGRESQL (RFC-PHOENIX-01)'
\echo 'Inicio de ejecución de scripts SQL'
\echo '========================================================================='
\echo ''

-- Configuración de sesión
SET client_min_messages = NOTICE;
SET statement_timeout = 0;
SET lock_timeout = '10s';

\timing on

-- =============================================================================
-- VERIFICACIÓN PRE-MIGRACIÓN
-- =============================================================================
\echo 'VERIFICACIÓN: Comprobando versión de PostgreSQL...'
SELECT version();

\echo ''
\echo 'VERIFICACIÓN: Comprobando base de datos actual...'
SELECT current_database(), current_user;

\echo ''
\echo 'VERIFICACIÓN: Listando esquemas existentes...'
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
ORDER BY schema_name;

\echo ''
\echo '¿Desea continuar con la migración? (Presione Ctrl+C para cancelar)'
\echo 'Esperando 5 segundos...'
SELECT pg_sleep(5);

-- =============================================================================
-- EJECUCIÓN DE SCRIPTS EN ORDEN
-- =============================================================================

\echo ''
\echo '========================================================================='
\echo 'PASO 1/7: Creando esquema IAM (Identity & Access Management)'
\echo '========================================================================='
\i 001_schema_iam.sql

\echo ''
\echo '========================================================================='
\echo 'PASO 2/7: Creando esquema FINANZAS (Ledger Inmutable)'
\echo '========================================================================='
\i 002_schema_finanzas.sql

\echo ''
\echo '========================================================================='
\echo 'PASO 3/7: Creando esquema STOCK (Control de Inventario)'
\echo '========================================================================='
\i 003_schema_stock.sql

\echo ''
\echo '========================================================================='
\echo 'PASO 4/7: Creando esquema GOBERNANZA (Políticas y Límites)'
\echo '========================================================================='
\i 004_schema_gobernanza.sql

\echo ''
\echo '========================================================================='
\echo 'PASO 5/7: Creando esquema SYS (Idempotencia y SAGAs)'
\echo '========================================================================='
\i 005_schema_sys.sql

\echo ''
\echo '========================================================================='
\echo 'PASO 6/7: Creando esquema EVENTS (Event Store y Snapshots)'
\echo '========================================================================='
\i 006_schema_events.sql

\echo ''
\echo '========================================================================='
\echo 'PASO 7/7: Creando esquema MIGRATION (Tablas de Migración)'
\echo '========================================================================='
\i 007_schema_migration.sql

-- =============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =============================================================================

\echo ''
\echo '========================================================================='
\echo 'VERIFICACIÓN POST-MIGRACIÓN'
\echo '========================================================================='

\echo ''
\echo 'Esquemas creados:'
SELECT schema_name, 
       (SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = s.schema_name) as table_count
FROM information_schema.schemata s
WHERE schema_name IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
ORDER BY schema_name;

\echo ''
\echo 'Tablas creadas por esquema:'
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_schema IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
ORDER BY table_schema, table_name;

\echo ''
\echo 'Funciones creadas:'
SELECT n.nspname as schema, p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
ORDER BY n.nspname, p.proname;

\echo ''
\echo 'Vistas creadas:'
SELECT table_schema, table_name
FROM information_schema.views
WHERE table_schema IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
ORDER BY table_schema, table_name;

\echo ''
\echo 'Índices creados (resumen por tabla):'
SELECT 
    schemaname,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;

\echo ''
\echo 'Foreign Keys (integridad referencial):'
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration')
ORDER BY tc.table_schema, tc.table_name;

\echo ''
\echo '========================================================================='
\echo 'MIGRACIÓN COMPLETADA EXITOSAMENTE'
\echo '========================================================================='
\echo ''
\echo 'Siguientes pasos:'
\echo '1. Insertar tenant de prueba en iam.tenants'
\echo '2. Configurar dual-write en la aplicación'
\echo '3. Ejecutar script de backfill desde Firebase'
\echo '4. Validar datos migrados'
\echo '5. Cambiar lectura a PostgreSQL (Fase C)'
\echo ''
\echo 'Para rollback en caso de problemas críticos:'
\echo '  psql -U postgres -d leadboost_ai -f 999_rollback.sql'
\echo ''
\echo '========================================================================='

\timing off
