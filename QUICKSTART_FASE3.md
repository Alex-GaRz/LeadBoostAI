# FASE 3 - QUICK START GUIDE
**Seguridad, IAM y Gestión de Secretos en 5 minutos**

---

## 🚀 INICIO RÁPIDO

### Paso 1: Instalar Dependencias (30 segundos)

```bash
pip install -r requirements.txt
```

### Paso 2: Generar Certificados (30 segundos)

```bash
python scripts/generate_certificates.py
```

### Paso 3: Configurar Variables (1 minuto)

Copiar el archivo de ejemplo:
```bash
copy .env.security.example .env
```

Editar `.env` y configurar al menos:
```env
SECRET_PROVIDER=local
MTLS_ENABLED=false
MTLS_MODE=permissive
```

### Paso 4: Iniciar Enterprise (STS) (1 minuto)

```bash
cd microservice_enterprise
python main.py
```

Verificar que está corriendo:
```
✅ Enterprise System READY (Secure Mode)
🚀 Starting Enterprise Nervous System (Secure Mode)
```

### Paso 5: Probar el STS (30 segundos)

**Obtener Token:**
```bash
curl -X POST http://localhost:8011/sts/token \
  -H "Content-Type: application/json" \
  -d "{\"service_id\": \"svc.actuator\", \"client_secret\": \"dev_secret_123\"}"
```

**Respuesta esperada:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Paso 6: Iniciar Actuator (1 minuto)

En otra terminal:
```bash
cd microservice_actuator
python main.py
```

### Paso 7: Probar Comunicación Segura (1 minuto)

```python
import asyncio
from core.security import create_secure_client

async def test():
    async with create_secure_client("enterprise") as client:
        response = await client.post(
            "http://localhost:8002/actuate",
            json={
                "action_type": "test",
                "parameters": {}
            }
        )
        print(response.json())

asyncio.run(test())
```

---

## ✅ VERIFICACIÓN

### 1. Certificados Generados

```bash
dir certs
```

Debe mostrar:
- `certs\ca\` (CA raíz)
- `certs\enterprise\`
- `certs\actuator\`
- `certs\sts\`

### 2. Servicios Corriendo

- **Enterprise:** http://localhost:8011/docs
- **Actuator:** http://localhost:8002/docs

### 3. Endpoints STS

- **Token:** POST http://localhost:8011/sts/token
- **JWKS:** GET http://localhost:8011/sts/jwks
- **Rotate:** POST http://localhost:8011/sts/rotate-keys

### 4. Health Checks

```bash
curl http://localhost:8011/health
curl http://localhost:8002/health
```

---

## 🔐 USO BÁSICO

### En tus Servicios

**1. Obtener Secretos:**
```python
from core.security import secret_manager

api_key = secret_manager.get_secret("OPENAI_API_KEY")
```

**2. Proteger Endpoints:**
```python
from fastapi import Depends
from core.security import get_security_context, SecurityContext

@app.post("/protected")
async def my_endpoint(ctx: SecurityContext = Depends(get_security_context)):
    # ctx.service_id = "svc.actuator"
    # ctx.role = "svc.actuator"
    # ctx.scopes = ["execute:external", ...]
    return {"authorized": True}
```

**3. Validar Permisos:**
```python
from core.security import iam_enforcer, Permission

if not iam_enforcer.check_permission(ctx.role, Permission.EXECUTE_EXTERNAL):
    raise HTTPException(403, "Permission denied")
```

**4. Llamar a Otros Servicios:**
```python
from core.security import create_secure_client

async with create_secure_client("my_service") as client:
    response = await client.post("http://other:8000/endpoint", json={...})
```

---

## 🐛 TROUBLESHOOTING

### Error: "Token inválido"
**Solución:** Verificar que Enterprise (STS) esté corriendo en puerto 8011

### Error: "Certificados no encontrados"
**Solución:** Ejecutar `python scripts/generate_certificates.py`

### Error: "Permission denied"
**Solución:** Verificar roles en `config/security/iam_policies.yaml`

### Error: "Module 'core.security' not found"
**Solución:** Ejecutar desde directorio raíz del proyecto

---

## 📚 SIGUIENTE NIVEL

- **Documentación completa:** `README_FASE3.md`
- **RFC completo:** `blue_prints/FASE 3.md`
- **Ejemplos:** `examples/secure_integration_example.py`
- **Configuración:** `config/security/`

---

## ⚡ COMANDOS ÚTILES

```bash
# Generar certificados
python scripts/generate_certificates.py

# Limpiar certificados
python scripts/generate_certificates.py --clean

# Ejecutar ejemplo
python examples/secure_integration_example.py

# Inicialización automática (Windows)
init_security.bat

# Ver logs de auditoría (si Redis está corriendo)
# Los eventos van a topic: security.audit
```

---

## 🎯 CHECKLIST DE PRODUCCIÓN

Antes de desplegar en producción:

- [ ] Cambiar `SECRET_PROVIDER=vault` (o KMS)
- [ ] Cambiar `MTLS_ENABLED=true`
- [ ] Cambiar `MTLS_MODE=strict`
- [ ] Reemplazar certificados self-signed por CA corporativa
- [ ] Rotar todos los `CLIENT_SECRET`
- [ ] Configurar secretos en Vault/KMS
- [ ] Cambiar `TOKEN_EXPIRATION_MINUTES=5` (más corto)
- [ ] Configurar SIEM para auditoría
- [ ] Revisar todas las políticas IAM
- [ ] Ejecutar tests de penetración

---

**¿Necesitas ayuda?** Revisa `README_FASE3.md` o el código en `core/security/`
