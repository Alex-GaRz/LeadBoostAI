
# 🏛️ BLUEPRINT TÉCNICO: NÚCLEO DE PERSISTENCIA DISTRIBUIDA (RFC-PHOENIX-01)

**Proyecto:** LeadBoost AI Enterprise Re-Platform
**Versión:** 1.0.0
**Estado:** ESPECIFICACIÓN APROBADA PARA EJECUCIÓN
**Objetivo:** Establecer PostgreSQL como la fuente única de verdad (Single Source of Truth - SSOT), garantizando integridad transaccional, auditabilidad forense y resiliencia ante fallos en flujos distribuidos.

---

## 1. ARQUITECTURA DE DATOS (ESQUEMA POSTGRESQL)

El diseño utiliza esquemas lógicos para aislar dominios. Se impone el uso de tipos de datos estrictos para evitar corrupción silenciosa.

### 1.1 Esquema: `finanzas` (Ledger Inmutable)
*Propósito: Registro de movimientos económicos con integridad de doble entrada.*

| Tabla | Columna | Tipo de Dato | Constraints / Índices | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **`ledger_entries`** | `id` | `UUIDv7` | `PK` | Identificador único ordenable por tiempo. |
| | `tenant_id` | `UUID` | `FK`, `NOT NULL`, `INDEX` | Aislamiento del cliente. |
| | `transaction_group_id` | `UUID` | `INDEX` | Agrupa movimientos (Debe/Haber) de una misma operación. |
| | `account_type` | `VARCHAR(32)` | `CHECK IN ('WALLET', 'SPEND', 'HOLD')` | Tipo de cuenta afectada. |
| | `amount` | `DECIMAL(18,4)` | `NOT NULL` | Alta precisión financiera (4 decimales). |
| | `currency` | `CHAR(3)` | `DEFAULT 'USD'` | Código ISO 4217. |
| | `direction` | `SMALLINT` | `CHECK IN (1, -1)` | 1 = Crédito (Ingreso), -1 = Débito (Gasto). |
| | `reference_type` | `VARCHAR(50)` | `NOT NULL` | Origen: 'CAMPAIGN_SPEND', 'DEPOSIT'. |
| | `reference_id` | `UUID` | `INDEX` | ID de la campaña o factura externa. |
| | `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Inmutable. |

### 1.2 Esquema: `stock` (Control de Inventario)
*Propósito: Prevención de sobreventa mediante bloqueo optimista.*

| Tabla | Columna | Tipo de Dato | Constraints / Índices | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **`inventory_items`** | `id` | `UUID` | `PK` | ID interno del item. |
| | `tenant_id` | `UUID` | `FK`, `INDEX` | Aislamiento. |
| | `sku` | `VARCHAR(100)` | `NOT NULL` | Código de producto del cliente. |
| | `quantity_on_hand` | `INTEGER` | `CHECK (quantity_on_hand >= 0)` | Stock físico real. |
| | `quantity_reserved` | `INTEGER` | `DEFAULT 0` | Stock comprometido en campañas activas. |
| | `available` | `GENERATED` | `(on_hand - reserved)` | Columna calculada virtual. |
| | `version` | `BIGINT` | `DEFAULT 1` | **Optimistic Locking**: Se incrementa en cada UPDATE. |
| | `last_updated` | `TIMESTAMPTZ` | | Auditoría de actualización. |

### 1.3 Esquema: `gobernanza` (Reglas y Límites)
*Propósito: Configuración de los fusibles de seguridad (Circuit Breakers).*

| Tabla | Columna | Tipo de Dato | Constraints / Índices | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **`policies`** | `id` | `UUID` | `PK` | |
| | `tenant_id` | `UUID` | `FK`, `INDEX` | |
| | `rule_type` | `VARCHAR(50)` | `CHECK IN ('MAX_CPA', 'DAILY_BUDGET', 'BRAND_SAFETY')` | Tipo de regla. |
| | `config` | `JSONB` | `NOT NULL` | Parámetros de la regla (ej: `{ "threshold": 15.50 }`). |
| | `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Interruptor lógico. |
| | `enforcement_level` | `VARCHAR(20)` | `CHECK IN ('BLOCK', 'WARNING')` | Acción al violar la regla. |

### 1.4 Esquema: `idempotencia` (Deduplicación)
*Propósito: Garantizar ejecución única "Exactly-Once".*

| Tabla | Columna | Tipo de Dato | Constraints / Índices | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **`request_keys`** | `key` | `VARCHAR(256)` | `PK` | Hash del payload o ID de evento externo (Webhook ID). |
| | `tenant_id` | `UUID` | `FK` | |
| | `scope` | `VARCHAR(50)` | `NOT NULL` | Contexto (ej: 'WEBHOOK_META', 'API_PAYMENT'). |
| | `locked_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Inicio del procesamiento. |
| | `expires_at` | `TIMESTAMPTZ` | `NOT NULL`, `INDEX` | TTL para limpieza automática. |
| | `response_payload` | `JSONB` | `NULLABLE` | Resultado almacenado para devolver en reintentos. |
| | `status` | `VARCHAR(20)` | `CHECK IN ('PROCESSING', 'COMPLETED', 'FAILED')` | Estado de la operación. |

---

## 2. DISEÑO DEL EVENT STORE (`event_log`)

El sistema no destruye datos, solo anexa hechos. Este log es la base para la rehidratación del estado y auditoría.

### 2.1 Estructura de Tabla (`public.event_store`)

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `global_sequence` | `BIGSERIAL` (PK) | Orden global absoluto de todos los eventos del sistema. |
| `stream_id` | `UUID` (Index) | ID de la entidad afectada (ej: CampaignID, SagaID). |
| `stream_type` | `VARCHAR(50)` | Tipo de entidad ('CAMPAIGN', 'SAGA', 'INVENTORY'). |
| `version` | `INTEGER` | Secuencia incremental dentro del stream (Control de concurrencia). |
| `event_type` | `VARCHAR(100)` | Verbo en pasado ('BudgetAllocated', 'CampaignPaused'). |
| `payload` | `JSONB` | Datos inmutables del evento. |
| `metadata` | `JSONB` | Contexto (ActorID, IP, RequestID, CorrelationID). |
| `occurred_at` | `TIMESTAMPTZ` | Fecha real del evento. |

### 2.2 Políticas de Retención y Replay
* **Retención:** Permanente (Archivado a almacenamiento en frío S3/Glacier tras 12 meses, pero la tabla caliente mantiene 12 meses).
* **Mecanismo de Replay (Rehidratación):**
    1.  Leer todos los eventos para un `stream_id` ordenados por `version ASC`.
    2.  Aplicar secuencialmente a una clase modelo vacía (`Aggregate Root`).
    3.  El estado resultante en memoria es la verdad actual.
    4.  *Snapshotting:* Cada 100 eventos, se guarda una foto del estado en una tabla `snapshots` para acelerar la carga.

---

## 3. DISEÑO DEL SAGA COORDINATOR

Orquestación de procesos de larga duración que tocan múltiples dominios (Analyst, Governance, Actuator).

### 3.1 Modelo de Datos (`sys.sagas`)

| Columna | Descripción |
| :--- | :--- |
| `saga_id` | UUID único de la transacción de negocio. |
| `current_step` | Nombre del paso actual. |
| `state` | `STARTED`, `PENDING`, `COMPLETED`, `ABORTED`, `COMPENSATING`. |
| `history` | JSONB Array con logs de cada paso: `[{step: 'ReserveStock', status: 'OK', payload: {...}}]`. |
| `payload` | Datos de entrada originales. |

### 3.2 Máquina de Estados: Flujo Crítico (Analyst → Actuator)

El flujo se modela como una secuencia de pasos con **Transacciones Compensatorias** (Deshacer) en caso de fallo.

| Paso | Acción (Forward) | Compensación (Rollback) | Servicio Responsable |
| :--- | :--- | :--- | :--- |
| **1. Propuesta** | Analyst genera estrategia. Se reserva ID. | Marcar estrategia como descartada. | `Microservice_Analyst` |
| **2. Validación** | Governance verifica presupuesto y políticas. | Liberar bloqueo de presupuesto. | `Microservice_Enterprise` |
| **3. Reserva** | Stock Service reserva inventario (`quantity_reserved` + X). | Liberar inventario (`quantity_reserved` - X). | `Microservice_Enterprise` |
| **4. Ejecución** | Actuator crea anuncios en Meta/Google. | Pausar/Borrar anuncios creados. | `Microservice_Actuator` |
| **5. Cierre** | Finance registra gasto estimado. | Crear contra-asiento en Ledger. | `Microservice_Enterprise` |

**Lógica de Fallo:** Si el Paso 4 (Actuador) falla (ej: API caída), el SAGA Coordinator ejecuta automáticamente las compensaciones 3, 2 y 1 en orden inverso para dejar el sistema limpio.

---

## 4. ESTRATEGIA DE MIGRACIÓN Y CORTE

Para pasar de Firebase/SQLite a este núcleo sin detener el servicio.

### Fase A: Dual-Write (Escritura Doble)
* **Acción:** Los servicios actuales se modifican para escribir en Firebase (como siempre) **Y** enviar un mensaje asíncrono a una cola de migración.
* **Consumer:** Un worker lee esa cola e inserta en el nuevo PostgreSQL.
* **Validación:** Se comparan conteos de registros diariamente. El sistema sigue leyendo de Firebase.

### Fase B: Backfill (Relleno Histórico)
* **Acción:** Script ETL que lee todo el historial de Firebase, lo transforma al esquema relacional definido y lo inserta en PostgreSQL.
* **Idempotencia:** El script usa los IDs originales de Firebase como llaves de idempotencia para no duplicar si se corre dos veces.

### Fase C: Read-Through (Cambio de Lectura)
* **Acción:** Se despliega una versión del Backend donde las lecturas (`GET`) consultan primero PostgreSQL. Si no encuentran el dato (lag), consultan Firebase (fallback).
* **Escritura:** Sigue siendo dual.

### Fase D: Kill-Switch (Corte Final)
* **Acción:** Se elimina la escritura a Firebase. PostgreSQL es la única fuente de verdad. Se apagan los servicios legacy.

---

## 5. FLUJOS DE CONSISTENCIA Y CONCURRENCIA

### 5.1 Garantía de Consistencia bajo Alta Concurrencia
* **Problema:** Dos campañas intentan gastar el último $100 del presupuesto simultáneamente.
* **Solución (Database-Level):**
    * Uso de **`SELECT ... FOR UPDATE`** en la tabla de presupuestos/stock dentro de la transacción.
    * Esto bloquea la fila específica a nivel de motor de BD hasta que la transacción termina (commit/rollback).
    * La segunda transacción esperará.

### 5.2 Manejo de Webhooks Duplicados (Meta Ads)
1.  Llega Webhook con `event_id: xyz`.
2.  Middleware consulta tabla `sys.idempotency_keys` con clave `meta_webhook_xyz`.
3.  **Caso A (Existe y Completed):** Devuelve 200 OK inmediatamente (sin procesar).
4.  **Caso B (Existe y Processing):** Devuelve 429 (Wait) o espera (Lock).
5.  **Caso C (No existe):** Inserta clave con status `PROCESSING`. Ejecuta lógica. Actualiza a `COMPLETED`.

---

## 6. RIESGOS TÉCNICOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación Técnica |
| :--- | :--- | :--- | :--- |
| **Latencia en SAGA** | Media | Medio | El coordinador SAGA debe ser asíncrono (basado en eventos), no bloqueante. El usuario ve "Procesando..." en la UI. |
| **Bloqueos (Deadlocks)** | Baja | Alto | Definir orden estricto de actualización de tablas (siempre Tabla A, luego Tabla B). Timeouts de transacción cortos (5s). |
| **Dual-Write Drift** | Alta | Medio | Monitoreo en tiempo real de discrepancias entre Firebase y Postgres. Alertas si el desfase supera 1%. |
| **Fallo de Compensación** | Baja | Crítico | Si una compensación falla (ej: no se puede borrar anuncio), se escala a una cola de "Intervención Humana" (Dead Letter Queue). |

---
