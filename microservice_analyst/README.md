# Microservice Analyst

Este microservicio implementa el motor de análisis y estrategia de LeadBoostAI, integrando lógica de gobernanza, simulación, optimización y asesoría.

## Estructura principal

- **main.py**: Punto de entrada principal del microservicio.
- **requirements.txt**: Dependencias Python necesarias.
- **test_strategy_engine.py**: Pruebas del motor de estrategia.

## Subcarpetas y módulos

### api/
Rutas y endpoints de la API:
- **routes/**: Endpoints para advisor, governance, search y simulation.

### core/
Módulos centrales de lógica y procesamiento:
- **audit_publisher.py**: Publicación de auditorías.
- **config.py**: Configuración del microservicio.
- **db_adapter.py**: Adaptador de base de datos.
- **engine.py**: Motor principal de análisis.
- **enterprise_interface.py**: Interfaz para lógica empresarial.
- **governance_engine.py**: Motor de gobernanza y reglas.
- **optimizer_interface.py**: Interfaz para optimización.
- **persona_engine.py**: Motor de perfiles y audiencias.
- **resonance_math.py**: Algoritmos de resonancia y afinidad.
- **simulation_sandbox.py**: Sandbox para simulaciones.
- **trust.py**: Módulo de confianza y validación.

### models/
Modelos de datos y esquemas:
- **schemas.py**: Esquemas de datos utilizados por el microservicio.

### services/
Servicios y lógica de negocio:
- **analyst_service.py**: Servicio principal de análisis.
- **context_builder.py**: Constructor de contexto para análisis.
- **strategy_engine.py**: Motor de estrategias.

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

- Revisa y adapta los módulos de gobernanza y simulación según los requisitos del entorno.
- Utiliza los endpoints de advisor y simulation para pruebas y validación de estrategias.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
