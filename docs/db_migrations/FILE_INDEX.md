# 📑 ÍNDICE DE ARCHIVOS SQL - RFC-PHOENIX-01

## 🎯 Orden de Ejecución Obligatorio

```
000_master_migration.sql  ← EMPEZAR AQUÍ (ejecuta todo automáticamente)
  ↓
  ├── 001_schema_iam.sql
  ├── 002_schema_finanzas.sql
  ├── 003_schema_stock.sql
  ├── 004_schema_gobernanza.sql
  ├── 005_schema_sys.sql
  ├── 006_schema_events.sql
  └── 007_schema_migration.sql
  
008_seed_data.sql         ← [OPCIONAL] Solo para testing
009_validation_suite.sql  ← [RECOMENDADO] Después de migración
999_rollback.sql         ← [EMERGENCIA] Solo si hay problemas críticos
```

---

## 📂 Detalle de Archivos

### 🟢 Scripts de Esquemas (PRODUCCIÓN)

#### `001_schema_iam.sql` - Identity & Access Management
- **Tablas:** `iam.tenants`
- **Propósito:** Raíz de integridad referencial multi-tenant
- **Características:** Base de todos los Foreign Keys del sistema
- **Dependencias:** Ninguna (se ejecuta primero)

#### `002_schema_finanzas.sql` - Ledger Inmutable
- **Tablas:** `finanzas.ledger_entries`
- **Propósito:** Registro de movimientos económicos (doble entrada)
- **Características:** 
  - Triggers anti-UPDATE/DELETE
  - Columna `global_sequence` para orden total
  - 6 índices de alto rendimiento
- **Dependencias:** `iam.tenants`

#### `003_schema_stock.sql` - Control de Inventario
- **Tablas:** `stock.inventory_items`
- **Funciones:** `reserve_inventory()`, `release_inventory()`
- **Propósito:** Prevención de sobreventa con optimistic locking
- **Características:**
  - Columna `version` para control de concurrencia
  - Columna calculada `available` (GENERATED)
  - Funciones atómicas para reserva/liberación
- **Dependencias:** `iam.tenants`

#### `004_schema_gobernanza.sql` - Políticas y Límites
- **Tablas:** `gobernanza.policies`
- **Funciones:** `validate_campaign()`
- **Vistas:** `active_policies`
- **Propósito:** Circuit Breakers configurables
- **Características:**
  - Tipos: MAX_CPA, DAILY_BUDGET, BRAND_SAFETY
  - Enforcement: BLOCK o WARNING
  - Config en JSONB (flexible)
- **Dependencias:** `iam.tenants`

#### `005_schema_sys.sql` - Fontanería del Sistema
- **Tablas:** `sys.request_keys`, `sys.sagas`
- **Funciones:** `saga_add_step()`, `saga_complete()`, `saga_fail()`, `cleanup_expired_request_keys()`
- **Vistas:** `active_sagas`
- **Propósito:** Idempotencia (Exactly-Once) + SAGA Coordinator
- **Características:**
  - Deduplicación de webhooks/API
  - Transacciones distribuidas con compensación
  - Historial de pasos en JSONB
- **Dependencias:** `iam.tenants`

#### `006_schema_events.sql` - Event Sourcing
- **Tablas:** `events.event_store`, `events.snapshots`
- **Funciones:** `get_stream_state()`, `create_snapshot()`, `cleanup_old_snapshots()`
- **Vistas:** `stream_summary`
- **Propósito:** Log inmutable de eventos + optimización de rehidratación
- **Características:**
  - Triggers anti-UPDATE/DELETE
  - Columna `global_sequence` para orden absoluto
  - Snapshots cada N eventos
  - Función de replay optimizado
- **Dependencias:** Ninguna (independiente)

#### `007_schema_migration.sql` - ETL desde Firebase
- **Tablas:** `migration.raw_signals`, `migration.campaigns`, `migration.audit_logs`, `migration.batch_control`
- **Funciones:** `validate_migrated_data()`, `get_tenant_migration_stats()`
- **Propósito:** Destino para datos migrados desde Firebase
- **Características:**
  - Campo `firebase_id` para idempotencia
  - Status de validación (PENDING/VALIDATED/FAILED)
  - Tracking de lotes (batch_control)
- **Dependencias:** `iam.tenants`

---

### 🟡 Scripts de Soporte (TESTING/DESARROLLO)

#### `008_seed_data.sql` - Datos de Prueba
- **Contenido:**
  - 3 tenants de ejemplo
  - 5 políticas de gobernanza
  - 6 items de inventario
  - 2 depósitos financieros
  - 4 eventos en event store
  - 1 SAGA completada
  - 3 claves de idempotencia
- **Uso:** Solo en entornos de desarrollo/staging
- **NO ejecutar en producción**

#### `009_validation_suite.sql` - Testing Automatizado
- **Tests:** 10 pruebas automatizadas
- **Cobertura:**
  - Verificación de esquemas
  - Integridad referencial
  - Inmutabilidad de ledger y event store
  - Optimistic locking
  - Funciones de reserva
  - Validación de políticas
  - Constraints CHECK
- **Uso:** Ejecutar después de cada migración
- **Salida:** ✓ PASS / ✗ FAIL por cada test

---

### 🔴 Scripts de Emergencia

#### `999_rollback.sql` - Rollback Completo
- **Acción:** Elimina TODOS los esquemas creados
- **Orden:** Inverso (migration → events → sys → gobernanza → stock → finanzas → iam)
- **Verificación:** Confirma eliminación exitosa al final
- **⚠️ ADVERTENCIA:** NO es reversible. Requiere backup para restaurar datos.
- **Uso:** SOLO en caso de problemas críticos en producción

---

### 🔵 Scripts Maestros

#### `000_master_migration.sql` - Orquestador
- **Acción:** Ejecuta todos los esquemas en orden correcto
- **Características:**
  - Verificación pre-migración
  - Ejecución secuencial con logs
  - Verificación post-migración (resumen)
  - Muestra tablas, funciones, vistas, índices creados
- **Uso:** Punto de entrada principal

---

## 🛠️ Herramientas Auxiliares

### `migrate.bat` - Script Windows
- **Tipo:** Batch script interactivo
- **Funciones:**
  1. Migración completa
  2. Migración + datos de prueba
  3. Solo datos de prueba
  4. Verificación de estado
  5. Rollback de emergencia
- **Requisitos:** `psql` en PATH

### `docker-compose.yml` - Entorno Local
- **Servicios:**
  - PostgreSQL 15-alpine
  - pgAdmin 4 (opcional)
- **Puertos:**
  - 5432: PostgreSQL
  - 5050: pgAdmin
- **Volúmenes:** Persistencia de datos

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Archivos SQL** | 11 |
| **Esquemas creados** | 7 |
| **Tablas principales** | 13 |
| **Funciones** | 15+ |
| **Vistas** | 5 |
| **Triggers** | 8 |
| **Líneas de SQL** | 2,390+ |
| **Tests automatizados** | 10 |
| **Índices** | 50+ |
| **Foreign Keys** | 9+ |

---

## 🚀 Quick Start

### Desarrollo Local (Docker)
```bash
cd db_migrations
docker-compose up -d
docker exec -i leadboost_postgres psql -U postgres -d leadboost_ai < 000_master_migration.sql
docker exec -i leadboost_postgres psql -U postgres -d leadboost_ai < 008_seed_data.sql
docker exec -i leadboost_postgres psql -U postgres -d leadboost_ai < 009_validation_suite.sql
```

### Producción (PostgreSQL existente)
```bash
cd db_migrations
psql -U postgres -d leadboost_ai -f 000_master_migration.sql
psql -U postgres -d leadboost_ai -f 009_validation_suite.sql
```

### Windows (Script interactivo)
```cmd
cd db_migrations
migrate.bat
```

---

## 📖 Documentación

- **`README.md`**: Guía completa de implementación
- **`EXECUTIVE_SUMMARY.md`**: Resumen ejecutivo del proyecto
- **`FILE_INDEX.md`**: Este documento

---

## ✅ Checklist de Ejecución

### Pre-Migración
- [ ] Leer `EXECUTIVE_SUMMARY.md`
- [ ] Leer `README.md` sección "Requisitos Previos"
- [ ] Hacer backup completo de BD actual
- [ ] Verificar versión PostgreSQL ≥15
- [ ] Confirmar permisos de usuario

### Ejecución
- [ ] Ejecutar `000_master_migration.sql`
- [ ] Verificar que no hay errores críticos
- [ ] Ejecutar `009_validation_suite.sql`
- [ ] Confirmar que todos los tests pasan (10/10 ✓)

### Post-Migración
- [ ] Insertar tenant de producción
- [ ] Configurar dual-write en Backend
- [ ] Monitorear logs (primeras 2 horas)
- [ ] Comparar conteos con Firebase

### Mantenimiento
- [ ] Ejecutar `sys.cleanup_expired_request_keys()` semanalmente
- [ ] Ejecutar `events.cleanup_old_snapshots()` semanalmente
- [ ] Revisar `sys.active_sagas` diariamente
- [ ] Monitorear balance financiero

---

**Última actualización:** Diciembre 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Listo para Producción
