# Microservice Optimizer

Este microservicio implementa la lógica de optimización, simulación de escenarios y gobernanza para LeadBoostAI, integrando motores matemáticos, adaptadores de memoria y reglas de negocio.

## Estructura principal

- **main.py**: Punto de entrada principal del microservicio.
- **requirements.txt**: Dependencias Python necesarias.

## Subcarpetas y módulos

### api/
Rutas y endpoints de la API:
- **api_optimizer.py**: Endpoint principal de optimización.
- **governance_routes.py**: Rutas de gobernanza.

### core/
Módulos centrales de lógica y procesamiento:
- **math_core.py**: Motor matemático de optimización.
- **memory_client.py**: Cliente para gestión de memoria.
- **postgres_adapter.py**: Adaptador para base de datos PostgreSQL.
- **trainer.py**: Entrenador de modelos de optimización.

### logic/
Lógica de negocio y simulación:
- **optimizer_engine.py**: Motor principal de optimización.
- **scenario_simulator.py**: Simulador de escenarios.

### models/
Modelos de datos:
- **global_context_models.py**: Modelos de contexto global.
- **optimization_result_models.py**: Modelos de resultados de optimización.

### src/governance/
Gobernanza y reglas de negocio:
- **engine/**: Motor de contexto y pipeline de gobernanza.
- **genome/**: Modelos genéticos para optimización.
- **rules/**: Reglas base, de contenido y financieras.
- **test_governance.py**: Pruebas de gobernanza.

### tests/
Pruebas unitarias y de integración:
- **test_optimizer_logic.py**: Pruebas del motor de optimización.

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

- Revisa y adapta los motores de optimización y reglas de gobernanza según los requisitos del entorno.
- Utiliza el simulador de escenarios para validar resultados y estrategias.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
