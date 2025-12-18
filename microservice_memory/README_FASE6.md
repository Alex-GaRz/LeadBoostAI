# Memory Service - FASE 6.1

## Descripción

Servicio de **Memoria Corporativa** con capacidades RAG (Retrieval-Augmented Generation) para LeadBoostAI. Implementa el almacenamiento y recuperación de experiencias basado en **Triadas Contexto-Acción-Resultado**.

### Stack Tecnológico

- **Framework**: FastAPI 0.104+
- **Vector Store**: ChromaDB (Persistente)
- **Embeddings**: OpenAI `text-embedding-3-small` (con fallback a `sentence-transformers`)
- **Python**: 3.11+

## Estructura del Proyecto

```
microservice_memory/
├── api/
│   ├── __init__.py
│   └── routes.py              # Endpoints /ingest y /retrieve
├── core/
│   ├── __init__.py
│   ├── config.py              # Configuración centralizada
│   ├── vector_store.py        # Gestor de ChromaDB (Singleton)
│   └── embedding_engine.py    # Motor de embeddings con fallback
├── models/
│   ├── __init__.py
│   └── memory_models.py       # Pydantic schemas (MemoryEntry, ContextCard, etc)
├── services/
│   ├── __init__.py
│   └── canonizer.py           # Conversor Payload → Context Card
├── main.py                    # Entrypoint FastAPI
├── requirements.txt
├── .env.example
└── README.md
```

## Instalación

### 1. Instalar Dependencias

```bash
cd microservice_memory
pip install -r requirements.txt
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env y agregar tu OPENAI_API_KEY
```

### 3. Ejecutar el Servicio

```bash
python main.py
```

El servicio estará disponible en: `http://localhost:8006`

## Endpoints

### `POST /api/v1/memory/ingest`

Ingesta una campaña finalizada en la memoria corporativa.

**Request Body:**
```json
{
  "payload": {
    "tenant_id": "tenant-123",
    "campaign_id": "camp-456",
    "state": "LEARN",
    "platform": "LINKEDIN",
    "objective": "LEADS",
    "metrics": {
      "roas": 3.5,
      "spend": 1500.50,
      "quality_score": 87
    }
  }
}
```

**Response:**
```json
{
  "status": "success",
  "memory_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant_id": "tenant-123",
  "message": "Memory stored successfully"
}
```

### `POST /api/v1/memory/retrieve`

Recupera memorias relevantes para informar una nueva estrategia.

**Request Body:**
```json
{
  "tenant_id": "tenant-123",
  "query_text": "Campañas exitosas de LinkedIn para audiencias técnicas",
  "filters": {
    "platform": "LINKEDIN",
    "min_quality": "PASS"
  },
  "limit": 3
}
```

**Response:**
```json
{
  "results": [
    {
      "memory_id": "...",
      "tenant_id": "tenant-123",
      "platform": "LINKEDIN",
      "metrics": {
        "roas": 3.5,
        "quality_score": 87
      },
      "context_card": {
        "summary_text": "Campaña B2B exitosa...",
        "tags": ["B2B", "High-Performance"]
      }
    }
  ],
  "count": 3
}
```

### `GET /api/v1/memory/health`

Health check del servicio.

### `GET /api/v1/memory/stats`

Estadísticas del vector store.

## Conceptos Clave

### Context Card (Canonización)

La **Context Card** es una narrativa densa que encapsula una campaña completa:

> "CAMPAÑA B2B. Tenant: TechCorp. Objetivo: Leads. Audiencia: CTOs en Latam. Tono: Autoritario. Canal: LinkedIn Ads. Resultado: ROAS 3.5 (Alto). Calidad: PASS."

Este texto se vectoriza y permite búsquedas semánticas como:
- "Campañas exitosas en LinkedIn"
- "Estrategias para audiencias técnicas"
- "Tácticas de alto ROAS"

### Aislamiento de Tenants

**CRÍTICO**: Todas las búsquedas incluyen obligatoriamente `tenant_id` en los filtros para garantizar que un cliente nunca vea las estrategias de otro.

### Fallback de Embeddings

Si OpenAI no está disponible:
1. **Intenta** usar modelo local (`sentence-transformers`)
2. **Último recurso**: Vector dummy de ceros (solo desarrollo)

## Desarrollo

### Ejecutar con Hot Reload

```bash
uvicorn main:app --reload --port 8006
```

### Documentación Interactiva

- Swagger UI: `http://localhost:8006/docs`
- ReDoc: `http://localhost:8006/redoc`

## Testing

```bash
# Test de ingesta
curl -X POST http://localhost:8006/api/v1/memory/ingest \
  -H "Content-Type: application/json" \
  -d '{"payload": {"tenant_id": "test", "campaign_id": "c1", "state": "LEARN", "platform": "LINKEDIN"}}'

# Test de recuperación
curl -X POST http://localhost:8006/api/v1/memory/retrieve \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "test", "query_text": "campañas exitosas"}'
```

## Integración con Orchestrator

### Diagrama de Flujo: Recuperación (Pre-Strategy)

```
Orchestrator [STRATEGY_GEN]
    ↓
POST /retrieve (query contextual)
    ↓
Memory Service → ChromaDB
    ↓
Retorna Top-3 campañas similares
    ↓
Orchestrator inyecta en Payload
    ↓
Analyst Service (genera estrategia informada)
```

### Diagrama de Flujo: Aprendizaje (Post-Publish)

```
Orchestrator [PUBLISH → LEARN]
    ↓
POST /ingest (payload final + métricas)
    ↓
Memory Service:
  1. Canoniza (Context Card)
  2. Vectoriza (OpenAI)
  3. Persiste (ChromaDB)
    ↓
Retorna memory_id
    ↓
Orchestrator → DONE
```

## Seguridad

- ✅ Aislamiento de tenants por filtro obligatorio
- ✅ No hay credenciales hardcodeadas
- ✅ Variables de entorno para API keys
- ⚠️ CORS configurado como `allow_origins=["*"]` (ajustar en producción)

## Mantenimiento

### Verificar Estado

```bash
curl http://localhost:8006/api/v1/memory/health
```

### Ver Estadísticas

```bash
curl http://localhost:8006/api/v1/memory/stats
```

### Reset Collection (PELIGRO - Solo Dev)

```python
from core.vector_store import VectorStoreManager

store = VectorStoreManager()
store.reset_collection()  # ELIMINA TODAS LAS MEMORIAS
```

## Roadmap

- [ ] Tests unitarios (pytest)
- [ ] Tests de integración
- [ ] Migración a pgvector para producción
- [ ] Rate limiting en endpoints
- [ ] Autenticación JWT
- [ ] Métricas con Prometheus
- [ ] Logs estructurados (JSON)

## Autor

LeadBoostAI - Fase 6.1  
Blueprint aprobado: `BLUEPRINT_FASE6_MEMORY.md`
