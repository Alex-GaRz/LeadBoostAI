# Microservice Actuator Plus

Este microservicio amplía la funcionalidad del Actuator Engine en LeadBoostAI, incorporando módulos avanzados de normalización, estrategias, seguridad y gestión de memoria.

## Estructura principal

- **main.py**: Punto de entrada principal del microservicio.
- **requirements.txt**: Dependencias Python necesarias.

## Subcarpetas y módulos

### core/
Módulos centrales para procesamiento y lógica avanzada:
- **ingestors.py**: Ingesta de datos y señales.
- **memory_client.py**: Cliente para gestión de memoria distribuida.
- **memory_sync.py**: Sincronización de memoria entre servicios.
- **normalizer.py**: Normalización de datos y payloads.
- **security.py**: Funciones de seguridad y validación.
- **strategies.py**: Implementación de estrategias de ejecución.

### interfaces/
Definición de interfaces y contratos:
- **normalization_interface.py**: Interfaz para normalización de datos.

### models/
Modelos de datos y esquemas:
- **schemas.py**: Esquemas de datos utilizados por el microservicio.

### scripts/
Scripts auxiliares para pruebas y generación de tráfico:
- **mock_traffic_generator.py**: Generador de tráfico simulado para pruebas.

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

- Revisa y adapta los módulos de seguridad y normalización según los requisitos del entorno.
- Utiliza el generador de tráfico para pruebas de carga y validación.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
