# Microservice Copy

Este microservicio gestiona la generación, validación y cumplimiento de textos publicitarios (copy) en LeadBoostAI, asegurando calidad y compliance.

## Estructura principal

### core/
Módulos centrales para procesamiento y validación:
- **copy_compliance_bridge.py**: Puente para validación de cumplimiento normativo.
- **copy_engine.py**: Motor principal de generación y procesamiento de copy.
- **copy_validators.py**: Validadores de calidad y compliance.

### pipeline/
Procesos y orquestación:
- **copy_pipeline.py**: Pipeline de procesamiento de copy.

## Uso

1. Instala las dependencias necesarias (consultar requirements si aplica).
2. Configura variables de entorno y parámetros según la documentación interna.
3. Ejecuta el microservicio y utiliza el pipeline para procesar textos publicitarios.

## Recomendaciones

- Adapta los validadores y el motor de copy según los requisitos regulatorios y de calidad de tu entorno.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
