# Fase 3: Seguridad, IAM y Gestión de Secretos

## RFC-PHOENIX-03 Implementation Summary

Esta implementación completa establece una infraestructura de seguridad enterprise-grade basada en el principio de **Zero Trust**.

---

## 🎯 Objetivos Cumplidos

✅ **Secret Management**: Sistema de abstracción completo con soporte multi-backend  
✅ **Security Token Service (STS)**: Emisión y validación de JWTs con rotación de claves  
✅ **mTLS**: Mutual TLS con certificados X.509 por servicio  
✅ **IAM/RBAC**: Control de acceso basado en roles con políticas granulares  
✅ **Auditoría**: Registro inmutable de eventos de seguridad  
✅ **Middlewares**: Validación automática de tokens en FastAPI  
✅ **Secure HTTP Client**: Cliente con autenticación y mTLS automáticos  

---

## 📁 Estructura de Archivos

```
LeadBoostAI/
├── core/security/
│   ├── __init__.py                 # Exportaciones del módulo
│   ├── secrets.py                  # Secret Management (Local/Vault/KMS)
│   ├── sts.py                      # Security Token Service
│   ├── mtls_config.py              # Configuración mTLS
│   ├── iam_policy.py               # IAM/RBAC Engine
│   ├── audit_logger.py             # Security Audit Logger
│   ├── security_middleware.py      # FastAPI Middleware
│   └── secure_client.py            # HTTP Client con mTLS/JWT
│
├── config/security/
│   ├── iam_policies.yaml           # Definición de roles y permisos
│   └── service_identities.yaml     # Identidades de servicios
│
├── certs/                          # Certificados X.509 (generados)
│   ├── ca/                         # Certificate Authority
│   ├── enterprise/                 # Certificados de Enterprise
│   ├── actuator/                   # Certificados de Actuator
│   └── sts/                        # Claves de firma STS
│
├── scripts/
│   └── generate_certificates.py   # Generador de certificados
│
└── examples/
    └── secure_integration_example.py
```

---

## 🚀 Quick Start

### 1. Instalar Dependencias

```bash
pip install -r requirements.txt
```

**Nuevas dependencias:**
- `PyJWT>=2.8.0` - JSON Web Tokens
- `cryptography>=41.0.0` - Criptografía y X.509
- `httpx>=0.25.0` - Cliente HTTP async
- `PyYAML>=6.0.1` - Configuración YAML

### 2. Generar Certificados

```bash
python scripts/generate_certificates.py
```

Esto genera:
- CA raíz (Certificate Authority)
- Certificados de servidor y cliente para cada servicio
- Claves de firma para el STS

**Estructura generada:**
```
certs/
├── ca/
│   ├── ca.key
│   └── ca.crt
├── enterprise/
│   ├── ca.crt
│   ├── server.crt
│   ├── server.key
│   ├── client.crt
│   └── client.key
└── actuator/
    └── (similar)
```

### 3. Configurar Variables de Entorno

Crear/actualizar `.env`:

```env
# Secret Management
SECRET_PROVIDER=local  # local | vault | aws_kms
VAULT_ADDR=http://vault:8200  # Si usas Vault
VAULT_TOKEN=your_token

# mTLS
MTLS_ENABLED=false  # true en producción
MTLS_MODE=permissive  # permissive | strict

# STS
STS_URL=http://enterprise:8011/sts/token

# Service Secrets (ejemplo)
ACTUATOR_CLIENT_SECRET=dev_secret_123
ANALYST_CLIENT_SECRET=dev_secret_456
```

### 4. Iniciar Servicios

#### Enterprise (con STS):
```bash
cd microservice_enterprise
python main.py
```

#### Actuator (con validación):
```bash
cd microservice_actuator
python main.py
```

---

## 🔐 Flujo de Autenticación

### 1. Obtención de Token

```python
from core.security import create_secure_client

async with create_secure_client("actuator") as client:
    # El cliente automáticamente:
    # 1. Solicita token al STS
    # 2. Adjunta token en cada request
    # 3. Renueva token antes de expirar
    
    response = await client.post(
        "http://other-service:8000/endpoint",
        json={"data": "value"}
    )
```

### 2. Validación en Endpoint

```python
from fastapi import Depends
from core.security import get_security_context, SecurityContext, Permission

@app.post("/protected")
async def protected_endpoint(ctx: SecurityContext = Depends(get_security_context)):
    # ctx contiene:
    # - service_id: "svc.actuator"
    # - role: "svc.actuator"
    # - scopes: ["execute:external", ...]
    
    # Validación automática por middleware
    return {"authorized": True}
```

### 3. Control de Permisos

```python
from core.security import iam_enforcer, Permission

# Verificar permiso
has_permission = iam_enforcer.check_permission(
    "svc.actuator", 
    Permission.EXECUTE_EXTERNAL
)

if not has_permission:
    raise HTTPException(403, "Permission denied")
```

---

## 🛡️ Matriz de Permisos (IAM)

| Servicio | Puede Leer | Puede Escribir | Puede Ejecutar | Restricciones |
|----------|-----------|---------------|---------------|---------------|
| **Analyst** | Signals | Insights | Analysis | ❌ No puede ejecutar acciones externas |
| **Optimizer** | Insights, Budget | Plans | Optimization | ❌ No puede ejecutar ni modificar budget |
| **Enterprise** | Plans, Budget | Approvals, Rules, Budget | - | ⚠️ No ejecuta directamente (delega) |
| **Actuator** | Approvals | - | External Actions | ✅ Solo con token de aprobación |
| **Memory** | Context | Context | - | ❌ No ejecuta acciones |
| **BFF** | Proxy | - | - | 🔄 Solo retransmite, no ejecuta |

---

## 📊 Endpoints del STS

### POST `/sts/token`
Emite un token JWT para un servicio.

**Request:**
```json
{
  "service_id": "svc.actuator",
  "client_secret": "dev_secret_123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI1MDEwMSJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### GET `/sts/jwks`
Retorna las claves públicas para validación de tokens (JWKS).

**Response:**
```json
{
  "keys": [
    {
      "kid": "key-20250101",
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "key": "-----BEGIN PUBLIC KEY-----\n..."
    }
  ]
}
```

### POST `/sts/rotate-keys`
Rota las claves de firma (solo admin).

---

## 🔍 Auditoría

Todos los eventos de seguridad se registran automáticamente:

### Eventos Auditados:
- ✅ Token emitido
- ✅ Token validado
- ⛔ Token inválido/expirado
- ✅ Permiso concedido
- ⛔ Permiso denegado
- ✅ Acción ejecutada
- ⛔ Acción rechazada
- 🔐 Certificado validado (mTLS)
- 🔄 Rotación de claves

### Consultar Auditoría:

Los eventos se publican al Event Bus (Redis Streams) bajo el topic `security.audit`.

```python
from core.security import audit_logger

# Los eventos se envían automáticamente
# También se registran localmente en logs
```

---

## 🧪 Testing

### Ejecutar Ejemplo de Integración:

```bash
python examples/secure_integration_example.py
```

**Output esperado:**
```
🔐 DEMOSTRACIÓN DE SEGURIDAD - RFC-PHOENIX-03
=============================================================

EJEMPLO: Validación de Tokens
1️⃣  Emitiendo token para 'svc.actuator'...
✅ Token emitido: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZ...

2️⃣  Validando token...
✅ Token válido:
   - Subject: svc.actuator
   - Role: svc.actuator
   - Scopes: read:approvals execute:external

EJEMPLO: Verificación de Políticas IAM
1️⃣  ¿Actuator puede EXECUTE_EXTERNAL?
   ✅ SÍ

2️⃣  ¿Analyst puede EXECUTE_EXTERNAL?
   ⛔ NO (correcto)
```

### Unit Tests:

```bash
pytest tests/security/
```

---

## 🔧 Configuración de Producción

### Habilitar mTLS Estricto:

```env
MTLS_ENABLED=true
MTLS_MODE=strict
```

### Usar Vault para Secretos:

```env
SECRET_PROVIDER=vault
VAULT_ADDR=https://vault.company.com:8200
VAULT_TOKEN=s.xxxxxxxxxxxxxxxxxxxxxxxx
```

### Configurar Certificados Reales:

1. Reemplazar certificados self-signed por certificados de CA corporativa
2. Colocar certificados en `certs/<service>/`
3. Reiniciar servicios

---

## 📝 Migración desde Fase 2

### Cambios Necesarios en Código Existente:

#### 1. Reemplazar `os.getenv()` por `secret_manager`

**Antes:**
```python
import os
api_key = os.getenv("OPENAI_API_KEY")
```

**Después:**
```python
from core.security import secret_manager
api_key = secret_manager.get_secret("OPENAI_API_KEY")
```

#### 2. Agregar Middleware de Seguridad

**En `main.py` de cada servicio:**
```python
from core.security import create_security_middleware

security_middleware = create_security_middleware(
    service_name="my_service",
    exclude_paths=["/health", "/docs"]
)
app.middleware("http")(security_middleware)
```

#### 3. Actualizar Llamadas HTTP entre Servicios

**Antes:**
```python
import httpx
response = await httpx.post("http://other:8000/endpoint", json={...})
```

**Después:**
```python
from core.security import create_secure_client

async with create_secure_client("my_service") as client:
    response = await client.post("http://other:8000/endpoint", json={...})
```

---

## ⚠️ Consideraciones de Seguridad

### Desarrollo vs. Producción:

| Feature | Desarrollo | Producción |
|---------|-----------|-----------|
| **mTLS** | Opcional (`permissive`) | ✅ Obligatorio (`strict`) |
| **Certificados** | Self-signed | CA corporativa |
| **Secrets** | Variables entorno | Vault/KMS |
| **Client Secrets** | Hardcoded | Rotación automática |
| **Token Expiration** | 15 min | 5-15 min |
| **Auditoría** | Local logs | SIEM centralizado |

### Buenas Prácticas:

1. ✅ **Nunca** commits secretos al repositorio
2. ✅ Rotar claves del STS cada 30-90 días
3. ✅ Renovar certificados antes de expirar
4. ✅ Revisar logs de auditoría regularmente
5. ✅ Usar `MTLS_MODE=strict` en producción
6. ✅ Limitar scopes al mínimo necesario

---

## 🐛 Troubleshooting

### Error: "Token inválido"
- Verificar que el STS esté corriendo
- Verificar conectividad de red
- Revisar logs del STS

### Error: "Certificado cliente requerido"
- Generar certificados: `python scripts/generate_certificates.py`
- Verificar que `MTLS_ENABLED=true`
- Revisar paths en `certs/<service>/`

### Error: "Permission denied"
- Verificar rol del servicio en `config/security/iam_policies.yaml`
- Verificar que el token contenga los scopes necesarios
- Revisar logs de auditoría

---

## 📚 Referencias

- **RFC-PHOENIX-03**: `blue_prints/FASE 3.md`
- **DMC Capítulo 9**: Modelo de Seguridad e IAM
- **JWT RFC 7519**: https://datatracker.ietf.org/doc/html/rfc7519
- **mTLS Best Practices**: https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/

---

## ✅ Checklist de Implementación

- [x] Módulo de Secret Management
- [x] Security Token Service (STS)
- [x] Configuración mTLS
- [x] IAM/RBAC Engine
- [x] Audit Logger
- [x] Security Middleware (FastAPI)
- [x] Secure HTTP Client
- [x] Políticas IAM (YAML)
- [x] Script de generación de certificados
- [x] Integración en Enterprise
- [x] Integración en Actuator
- [x] Ejemplos de uso
- [x] Documentación completa

---

## 🚀 Próximos Pasos (Post-Fase 3)

1. **Integrar Vault real** para gestión de secretos en producción
2. **Implementar refresh tokens** para sesiones largas
3. **Agregar rate limiting** por servicio
4. **Configurar SIEM** para análisis de auditoría
5. **Implementar revocación de tokens** (blacklist)
6. **Agregar autenticación de usuarios** (OAuth2/OIDC)

---

**Estado:** ✅ **COMPLETO**  
**Versión:** 3.0.0  
**RFC:** PHOENIX-03  
**Fecha:** Diciembre 2025  
