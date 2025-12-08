**RFC-PHOENIX-03: Seguridad, IAM y Gestión de Secretos**

| Metadatos | Detalle |
| :--- | :--- |
| **Proyecto** | LeadBoostAI - Re-Plataforma Enterprise |
| **Fase** | FASE 3 - Seguridad, IAM y Gestión de Secretos |
| **Autor** | Principal Systems Architect |
| **Estado** | `DRAFT` (Pendiente de Aprobación) |
| **Dependencias** | RFC-PHOENIX-01 (Persistencia), RFC-PHOENIX-02 (Mensajería) |
| **Alineación** | DMC v1.0 (Capítulo 9: Modelo de Seguridad e IAM) |

---

## 1. Resumen Ejecutivo

### 1.1 El Problema
Actualmente, el sistema LeadBoostAI opera con un modelo de confianza implícita entre microservicios o dependencias de variables de entorno estáticas (`.env`). No existe un mecanismo robusto de autenticación *servicio-a-servicio* que garantice que una petición al `Actuator` provenga legítimamente del `Enterprise`. Además, la gestión de secretos (API Keys de OpenAI, Meta, Google) está descentralizada y carece de rotación automática o auditoría de acceso, lo que representa un riesgo crítico de seguridad y fuga de datos en un entorno de producción.

### 1.2 La Solución (Fase 3)
Esta fase establece la infraestructura de **Identidad y Gestión de Accesos (IAM)** tanto para humanos como para máquinas. Implementaremos un sistema donde:
1.  Ningún microservicio confía en otro por defecto (**Zero Trust**).
2.  Los secretos se inyectan en tiempo de ejecución desde un gestor seguro, nunca residen en el código.
3.  La comunicación crítica se autentica mediante tokens de corta duración y mTLS (mutual TLS).
4.  Todas las acciones sensibles quedan registradas en un log de auditoría inmutable.

---

## 2. Estado Actual (Análisis del Repositorio `lite-contexto-ia`)

### 2.1 Gestión de Secretos
* **Estado:** Dependencia total de archivos `.env` locales y variables de entorno cargadas al inicio (`python-dotenv`).
* **Archivos implicados:** `backend/.env`, `microservice_*/.env`.
* **Riesgo:** Si un contenedor es comprometido, todas las credenciales estáticas son expuestas. No hay capacidad de rotación sin reinicio.

### 2.2 Autenticación de Servicios
* **Estado:** Inexistente o basada en red (confianza por estar en la misma docker network).
* **Backend BFF:** Valida tokens de usuario (Firebase) en `auth_middleware.py`, pero la comunicación interna (ej. BFF -> Analyst) ocurre vía HTTP directo sin validación criptográfica fuerte de la identidad del llamante.
* **Riesgo:** Un atacante dentro de la red podría invocar directamente endpoints de `Actuator` para gastar presupuesto sin pasar por `Enterprise`.

### 2.3 Autorización
* **Estado:** Lógica dispersa. `Enterprise` tiene un `governance_engine.py`, pero actúa como validador de reglas de negocio, no como un sistema de control de acceso (RBAC) formal para la infraestructura.

---

## 3. Diseño Propuesto (Arquitectura Fase 3)

### 3.1 Arquitectura de Gestión de Secretos (Secret Manager Abstraction)
Se implementará un patrón de **"Secret Provider"** agnóstico. El sistema no debe saber si los secretos vienen de HashiCorp Vault, AWS KMS o un archivo encriptado local (para desarrollo).

* **Componente Nuevo:** `SecretManagerService` (librería compartida o sidecar).
* **Flujo:** Al arrancar, cada microservicio solicita sus secretos al `SecretManager` usando su propia identidad.
* **Invariante:** Prohibido acceder a `os.environ` directamente para claves críticas en lógica de negocio.

### 3.2 Autenticación Servicio-a-Servicio (mTLS & Tokens)
Para cumplir con el **Capítulo 9 del DMC (Zero Trust)**:

1.  **Nivel Transporte (mTLS):**
    * Cada microservicio tendrá su propio certificado X.509 firmado por una CA interna del proyecto.
    * El tráfico HTTP/gRPC solo se acepta si el cliente presenta un certificado válido.
    * Esto garantiza la identidad de la máquina.

2.  **Nivel Aplicación (Service Tokens - JWT):**
    * Se implementará un **Servicio de Emisión de Tokens (STS - Security Token Service)** interno (parte del dominio Backend/Enterprise).
    * Los microservicios obtienen un JWT de corta duración (ej. 15 min) firmado por el STS.
    * Cada petición interna debe llevar el header `Authorization: Bearer <service_token>`.
    * El token incluye "claims" de rol: `role: actuator`, `scope: execute`.

### 3.3 Flujo de Autenticación
1.  **Boot:** `Microservice_Actuator` inicia.
2.  **Auth:** Solicita token al STS presentando su certificado mTLS o Client Credentials.
3.  **STS:** Valida y emite JWT firmado: `{ sub: "actuator", role: "executor", exp: time+15m }`.
4.  **Request:** `Enterprise` llama a `Actuator` enviando su propio token.
5.  **Validación:** `Actuator` verifica la firma del token de `Enterprise` y sus permisos antes de procesar.

---

## 4. Modelo IAM / RBAC

Definición formal de roles basada en la Matriz de Permisos del DMC (Capítulo 9.4).

### 4.1 Roles de Servicio (Service Accounts)

| Servicio | Rol IAM | Permisos (Scopes) | Restricciones |
| :--- | :--- | :--- | :--- |
| **Analyst** | `svc.analyst` | `read:signals`, `write:insights` | No puede escribir en `rules` ni ejecutar `actions`. |
| **Optimizer** | `svc.optimizer` | `read:insights`, `write:plans` | No puede ejecutar `actions` ni modificar `budget`. |
| **Enterprise** | `svc.enterprise` | `read:plans`, `write:approvals`, `write:rules` | Único autorizado para emitir `approval`. |
| **Actuator** | `svc.actuator` | `read:approvals`, `execute:external` | Solo ejecuta si recibe token válido con claim `approval`. |
| **Memory** | `svc.memory` | `read:context`, `write:context` | Acceso exclusivo a vectores. |
| **BFF** | `svc.bff` | `proxy:all` | Solo retransmite, no tiene permisos de ejecución directa. |

### 4.2 Roles Humanos (Usuarios)
* **Admin:** Acceso total a configuración y logs de auditoría.
* **Manager:** Puede aprobar presupuestos y ver dashboards.
* **Viewer:** Solo lectura de métricas.

### 4.3 Auditoría (Audit Trail)
Cada validación de token exitosa o fallida debe generar un evento de auditoría asíncrono (vía Redis Streams, Fase 2) hacia el servicio de Logs.
* **Estructura:** `{ timestamp, actor_service, target_service, action, result, trace_id }`.

---

## 5. Plan de Implementación (Paso a Paso)

1.  **Paso 1: Abstracción de Secretos.** Crear librería `core.security.secrets` en Python y Node.js. Refactorizar todos los accesos a `os.getenv` para usar esta librería.
2.  **Paso 2: Definición de Identidades.** Crear certificados locales (self-signed) para cada microservicio y configurar docker-compose para montarlos.
3.  **Paso 3: Servicio STS Mínimo.** Implementar un endpoint en `microservice_enterprise` (o servicio dedicado) que emita JWTs firmados basados en credenciales estáticas (fase de transición).
4.  **Paso 4: Middleware de Validación JWT.** Implementar middleware en FastAPI (Python) y Express (Node) que rechace peticiones sin token válido firmado por el STS.
5.  **Paso 5: Integración Cliente.** Actualizar los clientes HTTP internos (ej. `AnalystServiceBridge`) para solicitar y adjuntar tokens automáticamente.
6.  **Paso 6: mTLS en Gateway.** Configurar un proxy inverso (ej. Nginx o Traefik en Docker) o configuración de servidor web para exigir certificados cliente entre contenedores (Opcional para MVP, obligatorio para Prod).
7.  **Paso 7: Auditoría.** Conectar los middlewares de autenticación al bus de eventos de auditoría (Fase 2).
8.  **Paso 8: Barrido de Secretos.** Escanear el código para asegurar que no quedan claves hardcodeadas.

---

## 6. Criterios de Aceptación

* **[Seguridad]** Ningún secreto (API Key, DB password) existe en texto plano en el código fuente.
* **[IAM]** Si el servicio `Analyst` intenta llamar a un endpoint protegido de `Actuator` sin el token correcto, recibe `401 Unauthorized` o `403 Forbidden`.
* **[IAM]** Si `Actuator` recibe una petición con token válido pero sin el scope `execute`, la rechaza.
* **[Resiliencia]** La rotación del secreto de firma del STS no tira el sistema (soporte para múltiples claves de firma activas).
* **[Auditoría]** Existe un log centralizado que dice: "El servicio X intentó la acción Y sobre el servicio Z a las HH:MM".
* **[Alineación DMC]** Se cumple estrictamente que `Optimizer` no puede ejecutar acciones directamente (validado por RBAC).

---

## 7. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Mitigación |
| :--- | :--- | :--- |
| **Latencia por Auth:** La validación de tokens en cada petición añade overhead. | Media | Usar validación de firma local (sin llamar al STS en cada request) y cacheo de claves públicas. |
| **Complejidad de Certificados:** Gestión de mTLS compleja en desarrollo local. | Alta | Usar una herramienta de gestión de PKI simplificada o modo "permissive" en desarrollo, "strict" en producción. |
| **Fallo del STS:** Si el emisor de tokens cae, nadie puede hablar. | Baja (Crítica) | Alta disponibilidad del STS y tokens con tiempo de vida suficiente para sobrevivir reinicios breves (grace period). |
| **Fuga de Token:** Robo de un token de servicio. | Baja | Tiempos de expiración cortos (15 min) y rotación forzada. |

---

**FIN DEL RFC-PHOENIX-03**