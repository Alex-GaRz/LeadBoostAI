# Microservice Memory

Este microservicio implementa la gestión avanzada de memoria, almacenamiento vectorial y trazabilidad para LeadBoostAI, integrando motores de embeddings y recuperación de información.

## Estructura principal

- **main.py**: Punto de entrada principal del microservicio.
- **requirements.txt**: Dependencias Python necesarias.
- **database.py**: Configuración y acceso a la base de datos local.
- **memory.db** / **chroma_db/**: Almacenamiento de datos y vectores.
- **Dockerfile**: Contenedor para despliegue.
- **init_service.bat / init_service.sh**: Scripts de inicialización.
- **verify_patches.py**: Verificación de parches de seguridad.

## Subcarpetas y módulos

### api/
Rutas y endpoints de la API:
- **routes.py**: Definición de rutas y endpoints.

### chroma_db/
Almacenamiento vectorial y bases de datos:
- **chroma.sqlite3**: Base de datos de vectores.
- Subcarpetas con identificadores únicos para almacenamiento distribuido.

### core/
Módulos centrales de lógica y procesamiento:
- **config.py**: Configuración del microservicio.
- **embedding_engine.py**: Motor de embeddings.
- **retrieval_engine.py**: Motor de recuperación de información.
- **vector_store.py**: Almacenamiento y gestión de vectores.

### models/
Modelos de datos:
- **memory_models.py**: Modelos y esquemas de memoria.

### services/
Servicios y lógica de negocio:
- **canonizer.py**: Canonización de datos.
- **learning_core.py**: Núcleo de aprendizaje.
- **traceability.py**: Trazabilidad y seguimiento de datos.

### tests/
Pruebas unitarias y de integración:
- **test_memory_live.py**: Pruebas en vivo del servicio de memoria.
- **test_memory_service.py**: Pruebas del servicio principal.

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

- Revisa y adapta los motores de embeddings y recuperación según los requisitos del entorno.
- Utiliza los scripts de inicialización y verificación para asegurar la integridad y seguridad del servicio.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
