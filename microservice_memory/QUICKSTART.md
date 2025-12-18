# 🚀 QUICKSTART - Memory Service FASE 6.1

## Inicio Rápido (5 minutos)

### 1️⃣ Instalar Dependencias

#### Windows
```bash
cd c:\Dev\LeadBoostAI\microservice_memory
init_service.bat
```

#### Linux/Mac
```bash
cd /path/to/LeadBoostAI/microservice_memory
chmod +x init_service.sh
./init_service.sh
```

### 2️⃣ Configurar OpenAI API Key (Opcional)

Edita el archivo `.env`:
```bash
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Nota**: Si no tienes API key, el servicio usará embeddings locales automáticamente.

### 3️⃣ Iniciar el Servicio

#### Windows
```bash
venv\Scripts\activate
python main.py
```

#### Linux/Mac
```bash
source venv/bin/activate
python main.py
```

El servicio estará disponible en: **http://localhost:8006**

### 4️⃣ Verificar que Funciona

Abre en tu navegador:
- **API Docs**: http://localhost:8006/docs
- **Health Check**: http://localhost:8006/api/v1/memory/health

---

## 🧪 Tests Rápidos

### Test 1: Ingestar una Memoria

```bash
curl -X POST http://localhost:8006/api/v1/memory/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "tenant_id": "test-tenant-123",
      "campaign_id": "campaign-001",
      "execution_id": "exec-001",
      "platform": "LINKEDIN",
      "objective": "LEADS",
      "state": "LEARN",
      "metrics": {
        "roas": 3.5,
        "spend": 1500,
        "quality_score": 85
      },
      "strategy_brief": {
        "audience": {
          "target_roles": ["CTO", "VP Engineering"],
          "industries": ["Technology"]
        }
      }
    }
  }'
```

**Respuesta Esperada**:
```json
{
  "status": "success",
  "memory_id": "550e8400-...",
  "tenant_id": "test-tenant-123",
  "message": "Memory stored successfully"
}
```

### Test 2: Recuperar Memorias

```bash
curl -X POST http://localhost:8006/api/v1/memory/retrieve \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "test-tenant-123",
    "query_text": "Campañas exitosas de LinkedIn para CTOs",
    "limit": 3
  }'
```

**Respuesta Esperada**:
```json
{
  "results": [
    {
      "memory_id": "550e8400-...",
      "platform": "LINKEDIN",
      "metrics": {
        "roas": 3.5,
        "quality_score": 85
      }
    }
  ],
  "count": 1
}
```

---

## 🐛 Troubleshooting

### Error: "ChromaDB failed to initialize"
**Solución**: Verificar que el directorio `chroma_db/` existe:
```bash
mkdir chroma_db
```

### Error: "OpenAI API error"
**Solución**: 
1. Verifica tu API key en `.env`
2. O deja que use embeddings locales (automático)

### Error: "Import could not be resolved"
**Solución**: Activar el entorno virtual:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### El servicio inicia pero falla en /ingest
**Solución**: Asegúrate de que el payload incluya `state: "LEARN"` o `"FAILED"` (estados terminales).

---

## 📖 Más Información

- **Documentación Completa**: `README_FASE6.md`
- **Blueprint**: `../blue_prints/FASE 6/FASE 6.1.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Next Steps

Una vez que el servicio esté corriendo:

1. **Integrar con Orchestrator**: Ver `IMPLEMENTATION_SUMMARY.md` sección "Integración"
2. **Ejecutar Tests**: `pytest tests/ -v`
3. **Revisar Logs**: Ver salida del servicio para debugging

---

**¿Problemas?** Revisa los logs del servicio. Log level configurable en `.env`:
```bash
LOG_LEVEL=DEBUG  # Para más detalle
```
