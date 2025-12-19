# Microservice Visual

Este microservicio implementa la generación, validación y orquestación de contenido visual para LeadBoostAI, integrando motores de generación, pipelines, adaptadores y utilidades de procesamiento de imágenes.

## Estructura principal

- **main.py**: Punto de entrada principal del microservicio.
- **requirements.txt** / **pyproject.toml**: Dependencias Python necesarias.

## Subcarpetas y módulos

### adapters/
Adaptadores para servicios externos:
- **controlnet_client.py**: Cliente para ControlNet.
- **diffusion_client.py**: Cliente para motores de difusión.
- **storage_client.py**: Cliente para almacenamiento de imágenes.

### api/
Rutas y endpoints de la API:
- **routes.py**: Definición de rutas y endpoints.

### configuration/
Configuración del microservicio:
- **settings.py**: Parámetros y settings.

### core/
Módulos centrales de lógica y procesamiento visual:
- **content_assembly/**: Ensamblaje y validación de contenido visual.
- **engines/**: Motores de generación, armonización, layout y tipografía.
- **observability/**: Monitoreo, logging y trazabilidad.
- **orchestration/**: Orquestación y gestión de estados.
- **pipeline/**: Pipelines de procesamiento visual.
- **compliance_bridge.py**: Validación de compliance visual.

### utils/
Utilidades de procesamiento de imágenes:
- **hashing.py**: Funciones de hashing.
- **image_ops.py**: Operaciones sobre imágenes.
- **validation.py**: Validaciones adicionales.

### test/
Pruebas unitarias y de integración (carpeta vacía).

## Uso

1. Instala las dependencias:
	```bash
	pip install -r requirements.txt
	```
2. Configura variables de entorno y parámetros según la documentación interna.
3. Ejecuta el microservicio:
	```bash
	python main.py
	```

## Recomendaciones

- Revisa y adapta los motores de generación y pipelines según los requisitos del entorno.
- Utiliza los adaptadores y utilidades para integración con servicios externos y procesamiento avanzado de imágenes.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
