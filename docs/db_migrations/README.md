# 🗄️ MIGRACIÓN A POSTGRESQL - RFC-PHOENIX-01

## 📋 Descripción General

Scripts SQL de producción para implementar el núcleo de persistencia distribuida de LeadBoost AI, siguiendo estrictamente el Blueprint RFC-PHOENIX-01.

## 🏗️ Arquitectura de Esquemas

```
PostgreSQL Database: leadboost_ai
│
├── iam/                     # Identity & Access Management
│   └── tenants             # Raíz de integridad referencial
│
├── finanzas/               # Ledger Inmutable
│   └── ledger_entries     # Doble entrada (append-only)
│
├── stock/                  # Control de Inventario
│   └── inventory_items    # Optimistic Locking
│
├── gobernanza/            # Circuit Breakers
│   └── policies           # Reglas y límites configurables
│
├── sys/                   # Fontanería del Sistema
│   ├── request_keys       # Deduplicación (Exactly-Once)
│   └── sagas              # Transacciones distribuidas
│
├── events/                # Event Sourcing
│   ├── event_store        # Log inmutable de eventos
│   └── snapshots          # Optimización de rehidratación
│
└── migration/             # Migración desde Firebase
    ├── raw_signals
    ├── campaigns
    ├── audit_logs
    └── batch_control
```

## 📦 Archivos del Repositorio

| Archivo | Descripción | Ejecución |
|---------|-------------|-----------|
| `000_master_migration.sql` | **Script maestro** - Ejecuta todo en orden | ✅ Empezar aquí |
| `001_schema_iam.sql` | Esquema IAM con tabla tenants | Individual |
| `002_schema_finanzas.sql` | Ledger inmutable con triggers anti-UPDATE | Individual |
| `003_schema_stock.sql` | Inventario con funciones de reserva/liberación | Individual |
| `004_schema_gobernanza.sql` | Políticas con función de validación | Individual |
| `005_schema_sys.sql` | Idempotencia + SAGA Coordinator | Individual |
| `006_schema_events.sql` | Event Store + Snapshots con rehidratación | Individual |
| `007_schema_migration.sql` | Tablas destino para ETL desde Firebase | Individual |
| `008_seed_data.sql` | Datos de prueba (tenants, inventario, eventos) | Testing |
| `999_rollback.sql` | **Rollback completo** - Elimina todo | ⚠️ Solo emergencias |

## 🚀 Ejecución Paso a Paso

### Opción A: Ejecución Automática (Recomendada)

```bash
# Conectar a PostgreSQL y ejecutar todo
psql -U postgres -d leadboost_ai -f 000_master_migration.sql
```

### Opción B: Ejecución Manual (Paso a Paso)

```bash
# 1. Conectar a la base de datos
psql -U postgres -d leadboost_ai

# 2. Ejecutar cada script en orden
\i 001_schema_iam.sql
\i 002_schema_finanzas.sql
\i 003_schema_stock.sql
\i 004_schema_gobernanza.sql
\i 005_schema_sys.sql
\i 006_schema_events.sql
\i 007_schema_migration.sql

# 3. (Opcional) Insertar datos de prueba
\i 008_seed_data.sql
```

### Opción C: Usar Docker Compose (Desarrollo Local)

```bash
# Crear contenedor PostgreSQL con los scripts
docker-compose up -d postgres

# Ejecutar migración
docker exec -i leadboost_postgres psql -U postgres -d leadboost_ai < 000_master_migration.sql
```

## 🔐 Requisitos Previos

- **PostgreSQL**: 15.x o superior
- **Extensiones necesarias**: `uuid-ossp` (instalada automáticamente)
- **Usuario de BD**: Permisos `CREATE SCHEMA`, `CREATE TABLE`, `CREATE FUNCTION`
- **Base de datos**: Debe existir previamente (`CREATE DATABASE leadboost_ai;`)

## 📊 Verificación Post-Migración

Después de ejecutar el script maestro, verificar:

```sql
-- 1. Contar esquemas creados (debe ser 7)
SELECT COUNT(*) FROM information_schema.schemata 
WHERE schema_name IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration');

-- 2. Contar tablas totales (debe ser ~15)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema IN ('iam', 'finanzas', 'stock', 'gobernanza', 'sys', 'events', 'migration');

-- 3. Verificar foreign keys (integridad referencial)
SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';

-- 4. Probar función de reserva de inventario (debe devolver success=true)
SELECT * FROM stock.reserve_inventory(
    '11111111-1111-1111-1111-111111111111', 
    'ACME-WIDGET-001', 
    10, 
    1
);
```

## 🔄 Estrategia de Migración (Fases)

### Fase A: Dual-Write ✅ (Actual)
- Backend escribe en Firebase **Y** PostgreSQL
- Lectura sigue en Firebase
- Validación de consistencia

### Fase B: Backfill (Siguiente)
- Script ETL lee historial de Firebase
- Inserta en `migration.*` usando `firebase_id` como idempotencia
- Se ejecuta fuera de horas pico

### Fase C: Read-Through
- Backend lee de PostgreSQL primero
- Fallback a Firebase si no encuentra dato

### Fase D: Kill-Switch
- Eliminar escritura a Firebase
- PostgreSQL = fuente única de verdad

## 🧪 Testing con Datos de Prueba

```bash
# Insertar datos de prueba
psql -U postgres -d leadboost_ai -f 008_seed_data.sql

# Verificar tenants insertados
psql -U postgres -d leadboost_ai -c "SELECT * FROM iam.tenants;"

# Verificar balance financiero
psql -U postgres -d leadboost_ai -c "
SELECT 
    t.name, 
    SUM(l.amount * l.direction) as balance 
FROM finanzas.ledger_entries l 
JOIN iam.tenants t ON l.tenant_id = t.id 
GROUP BY t.name;
"
```

## 🛡️ Características de Seguridad Implementadas

### 1. Inmutabilidad (Ledger y Event Store)
- ❌ **UPDATE prohibido** vía triggers
- ❌ **DELETE prohibido** vía triggers
- ✅ Solo operaciones **INSERT** (append-only)

### 2. Optimistic Locking (Inventario)
- Columna `version` incrementa en cada UPDATE
- Detecta conflictos de concurrencia
- Funciones `reserve_inventory()` / `release_inventory()`

### 3. Idempotencia (Webhooks/API)
- Tabla `sys.request_keys` con hash de payload
- TTL automático para limpieza
- Status: `PROCESSING` → `COMPLETED` / `FAILED`

### 4. Integridad Referencial
- Todos los esquemas tienen FK a `iam.tenants`
- `ON DELETE RESTRICT` (no se puede borrar tenant con datos)
- Constraints CHECK para valores válidos

## ⚠️ Rollback de Emergencia

**SOLO ejecutar si hay problemas críticos en producción:**

```bash
# Opción 1: Rollback SQL (elimina esquemas pero no restaura backup)
psql -U postgres -d leadboost_ai -f 999_rollback.sql

# Opción 2: Restaurar backup completo
pg_restore -U postgres -d leadboost_ai -c -F c /ruta/backup_pre_migration.dump
```

**Checklist post-rollback:**
- [ ] Aplicación apunta de vuelta a Firebase
- [ ] Variables de entorno restauradas
- [ ] Logs de aplicación sin errores
- [ ] Documentar causa del rollback
- [ ] Plan de corrección antes de reintentar

## 📈 Monitoreo y Mantenimiento

### Scripts de Mantenimiento (Ejecutar semanalmente)

```sql
-- Limpiar claves de idempotencia expiradas
SELECT sys.cleanup_expired_request_keys();

-- Limpiar snapshots antiguos (mantiene últimos 3)
SELECT events.cleanup_old_snapshots();

-- Reporte de SAGAs fallidas
SELECT * FROM sys.sagas WHERE state = 'FAILED' AND completed_at > NOW() - INTERVAL '7 days';

-- Reporte de validación de migración
SELECT * FROM migration.validate_migrated_data();
```

### Queries de Diagnóstico

```sql
-- Ver SAGAs activas
SELECT * FROM sys.active_sagas;

-- Ver políticas activas
SELECT * FROM gobernanza.active_policies;

-- Resumen de streams (Event Sourcing)
SELECT * FROM events.stream_summary;

-- Balance financiero consolidado
SELECT 
    tenant_id,
    account_type,
    SUM(amount * direction) as balance
FROM finanzas.ledger_entries
GROUP BY tenant_id, account_type;
```

## 🐛 Troubleshooting

### Error: "extension uuid-ossp does not exist"
```sql
-- Ejecutar como superusuario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: "permission denied for schema iam"
```bash
# Otorgar permisos al usuario de aplicación
psql -U postgres -d leadboost_ai -c "
GRANT USAGE ON SCHEMA iam, finanzas, stock, gobernanza, sys, events TO leadboost_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA iam, finanzas, stock, gobernanza, sys, events TO leadboost_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA iam, finanzas, stock, gobernanza, sys, events TO leadboost_app;
"
```

### Performance: Queries lentas en event_store
```sql
-- Crear índice adicional si hay muchos eventos
CREATE INDEX CONCURRENTLY idx_event_store_custom 
ON events.event_store(stream_type, occurred_at DESC) 
WHERE stream_type = 'CAMPAIGN';
```

## 📞 Soporte

Para preguntas sobre implementación:
- **Blueprint**: Ver archivo `FASE 1.md` en `/blue_prints/`
- **Arquitectura**: Consultar diagramas de sistema
- **Issues**: Documentar en sistema de tracking

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2025  
**Aprobado por**: RFC-PHOENIX-01  
**Estado**: ✅ Listo para Producción
