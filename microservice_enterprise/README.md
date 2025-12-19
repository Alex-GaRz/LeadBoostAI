# Microservice Enterprise

Este microservicio implementa la lógica empresarial avanzada de LeadBoostAI, incluyendo gestión de eventos, simulación, seguridad y escenarios de negocio.

## Estructura principal

- **main.py**: Punto de entrada principal del microservicio.
- **Dockerfile**: Contenedor para despliegue.
- **requirements.txt**: Dependencias Python necesarias.

## Subcarpetas y módulos

### api/
Rutas y endpoints de la API:
- **routes.py**: Definición de rutas y endpoints.

### core/
Módulos centrales de lógica empresarial:
- **distributed_lock.py**: Gestión de locks distribuidos para concurrencia.
- **event_bus.py**: Bus de eventos para comunicación interna.
- **event_bus.py.emergency_backup**: Backup de lógica de eventos.
- **panic_manager.py**: Gestión de situaciones críticas y pánico.
- **safety_engine.py**: Motor de seguridad y validación.
- **simulator_engine.py**: Motor de simulación de escenarios.

### models/
Modelos de datos y esquemas:
- **schemas.py**: Esquemas de datos utilizados por el microservicio.

### scenarios/
Gestión y disparo de escenarios de negocio:
- **trigger.py**: Módulo para disparar escenarios.

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

- Revisa y adapta los módulos de seguridad y simulación según los requisitos del entorno.
- Utiliza el bus de eventos y los triggers para orquestar escenarios complejos.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
