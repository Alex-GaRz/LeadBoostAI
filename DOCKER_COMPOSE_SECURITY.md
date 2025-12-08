# ============================================================
# DOCKER-COMPOSE CONFIGURATION SUMMARY - FASE 3 SECURITY
# ============================================================

## 📦 Servicios Configurados:

### 1. **postgres_db** (Base de datos)
- Puerto: 5432
- Sin cambios de seguridad

### 2. **redis_bus** (Event Bus)
- Puerto: 6379
- Sin cambios de seguridad

### 3. **enterprise** (Security Token Service + ENS)
- **Puertos:**
  - 8002: API principal de Enterprise
  - 8011: STS (Security Token Service)
  
- **Volúmenes:**
  - `./certs:/app/certs:ro` → Certificados mTLS y claves RSA del STS (read-only)
  - `./config:/app/config:ro` → Políticas IAM y configuración (read-only)

- **Variables de Entorno STS:**
  - `STS_PRIVATE_KEY_PATH=/app/certs/sts/sts_private.pem`
  - `STS_PUBLIC_KEY_PATH=/app/certs/sts/sts_public.pem`
  - `STS_KEY_ID=key-001`
  - `TOKEN_EXPIRATION_MINUTES=15`
  - `ENTERPRISE_CLIENT_SECRET=${ENTERPRISE_CLIENT_SECRET:-dev_secret_enterprise_001}`

### 4. **actuator** (Actuator Engine)
- **Puerto:** 8003 (cambiado de 8002 para evitar conflicto con Enterprise)
- **Cliente del STS:** `ACTUATOR_CLIENT_SECRET`
- **Autenticación:** Obtiene JWT del STS en `http://enterprise:8011/sts/token`

### 5. **bff** (Backend-for-Frontend Gateway) ✨ NUEVO
- **Puerto:** 8000
- **Build Context:** `./backend` (no raíz del proyecto)
- **Dockerfile:** `microservice_bff/Dockerfile`

- **Variables de Entorno:**
  - `BFF_CLIENT_SECRET=${BFF_CLIENT_SECRET:-dev_secret_bff_006}`
  - `STS_URL=http://enterprise:8011/sts/token`
  - URLs de microservicios internos para proxy

- **Volúmenes:**
  - `./certs:/app/certs:ro` → Certificados (si usa mTLS en el futuro)
  - `./config:/app/config:ro` → Configuración IAM

---

## 🔐 Flujo de Autenticación:

```
1. BFF inicia y carga BFF_CLIENT_SECRET desde env
2. BFF llama a POST http://enterprise:8011/sts/token
   Body: {"service_id": "svc.bff", "client_secret": "<BFF_CLIENT_SECRET>"}
3. Enterprise STS valida client_secret contra SecretManager
4. STS firma JWT con clave privada RSA (/app/certs/sts/sts_private.pem)
5. BFF recibe token JWT válido por 15 minutos
6. BFF usa token en llamadas a otros microservicios:
   - Authorization: Bearer <token>
7. Microservicios validan token con clave pública del STS
```

---

## 📋 Variables de Entorno Requeridas:

Crear archivo `.env` en la raíz del proyecto:

```bash
# Service Client Secrets (generados por setup_security_keys.sh)
ENTERPRISE_CLIENT_SECRET=<generado_por_script>
ACTUATOR_CLIENT_SECRET=<generado_por_script>
BFF_CLIENT_SECRET=<generado_por_script>

# Opcional: Otros servicios
ANALYST_CLIENT_SECRET=<generado_por_script>
OPTIMIZER_CLIENT_SECRET=<generado_por_script>
MEMORY_CLIENT_SECRET=<generado_por_script>
SCOUT_CLIENT_SECRET=<generado_por_script>
```

---

## 🚀 Comandos de Inicio:

### Opción 1: Todos los servicios
```bash
docker-compose up -d
```

### Opción 2: Solo servicios base + Enterprise (STS)
```bash
docker-compose up -d postgres_db redis_bus enterprise
```

### Opción 3: Agregar BFF
```bash
docker-compose up -d bff
```

### Opción 4: Agregar Actuator
```bash
docker-compose up -d actuator
```

---

## 🔍 Verificación de Servicios:

```bash
# Ver logs de Enterprise (STS)
docker-compose logs -f enterprise

# Ver logs de BFF
docker-compose logs -f bff

# Verificar que las claves RSA están montadas
docker exec leadboost_enterprise ls -la /app/certs/sts/

# Probar endpoint STS
curl http://localhost:8011/sts/jwks

# Probar autenticación del BFF (desde dentro del contenedor)
docker exec leadboost_bff curl -X POST http://enterprise:8011/sts/token \
  -H "Content-Type: application/json" \
  -d '{"service_id":"svc.bff","client_secret":"'${BFF_CLIENT_SECRET}'"}'
```

---

## ⚠️ Notas Importantes:

1. **Generar Claves Primero:**
   ```bash
   bash setup_security_keys.sh
   ```
   Esto crea:
   - `certs/sts/sts_private.pem`
   - `certs/sts/sts_public.pem`
   - `.env.security` (copiar a `.env`)

2. **Puerto Enterprise:**
   - El puerto principal de Enterprise cambió a **8002** (antes 8011)
   - El puerto **8011** ahora es exclusivo del STS
   - Actuator cambió a puerto **8003** para evitar conflictos

3. **Contexto de Build del BFF:**
   - Build context: `./backend` (no raíz)
   - Esto permite que el Dockerfile copie `microservice_bff/` correctamente
   - También necesita acceso a `core/` (módulos de seguridad)

4. **Volúmenes Read-Only:**
   - Los certificados y configuración son montados con `:ro`
   - Evita modificaciones accidentales desde contenedores
   - Las claves privadas tienen permisos 600 en el host

5. **Client Secrets:**
   - Cada servicio tiene su propio `{SERVICE}_CLIENT_SECRET`
   - Formato en `.env`: `BFF_CLIENT_SECRET=abc123...`
   - Fallback a valores "dev_secret_*" solo para desarrollo
   - En producción: usar Vault o AWS KMS

---

## 🔄 Próximos Pasos:

1. ✅ Ejecutar `setup_security_keys.sh` para generar claves
2. ✅ Copiar secrets de `.env.security` a `.env`
3. ✅ Construir imágenes: `docker-compose build`
4. ✅ Iniciar servicios: `docker-compose up -d`
5. ✅ Validar configuración: `python scripts/validate_fase3.py`
6. ✅ Probar autenticación entre servicios

---

**Configuración completada por:** Infrastructure Architect  
**Fecha:** Diciembre 2025  
**Versión:** Fase 3 - Security Hardening  
