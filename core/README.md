# LeadBoostAI - Core

La carpeta core contiene los módulos centrales y utilidades fundamentales para la plataforma LeadBoostAI, especialmente relacionados con la seguridad y la gestión de identidades.

## Archivos principales

- **__init__.py**: Inicialización del paquete core.

## Subcarpetas

### security/
Módulos de seguridad y gestión de credenciales:
- **audit_logger.py**: Registro de auditoría de eventos y accesos.
- **iam_policy.py**: Gestión de políticas de acceso e identidades.
- **mtls_config.py**: Configuración de seguridad mTLS (mutual TLS).
- **secrets.py**: Manejo seguro de secretos y credenciales.
- **secure_client.py**: Cliente seguro para comunicación entre servicios.
- **security_middleware.py**: Middleware de seguridad para aplicaciones.
- **sts.py**: Servicio de tokens de seguridad.
- **__init__.py**: Inicialización del paquete de seguridad.

## Uso

1. Importa los módulos necesarios en tus servicios para aplicar seguridad y gestión de identidades.
2. Configura las políticas y credenciales según los requerimientos de tu entorno.

## Recomendaciones

- Mantén los módulos de seguridad actualizados y revisa los logs de auditoría periódicamente.
- Consulta la documentación interna para detalles sobre la integración y configuración avanzada.
