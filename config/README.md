# LeadBoostAI - Configuración

Esta carpeta contiene los archivos de configuración esenciales para la plataforma LeadBoostAI, incluyendo integración con sistemas de mensajería, seguridad y control de acceso.

## Archivos principales

- **kafka_acls.sh**: Script para gestionar listas de control de acceso (ACL) en Apache Kafka.
- **kafka_config.yml**: Archivo de configuración para la integración y parámetros de Kafka.

## Subcarpetas

### security/
Contiene configuraciones de seguridad y control de identidades:
- **iam_policies.yaml**: Políticas de acceso y permisos para los servicios.
- **service_identities.yaml**: Identidades y roles de los servicios dentro de la plataforma.

## Uso

1. Revisa y adapta los archivos de configuración según tu entorno y necesidades de seguridad.
2. Ejecuta los scripts y aplica las políticas antes de iniciar los servicios principales.

## Recomendaciones

- Mantén estos archivos protegidos y actualizados.
- Consulta la documentación interna para detalles sobre la integración y parámetros específicos.
