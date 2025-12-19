# LeadBoostAI - Backend

Este backend integra microservicios, APIs, procesamiento de datos y orquestación para la plataforma LeadBoostAI. Está desarrollado principalmente en Node.js y Python, y se organiza en módulos funcionales y microservicios.

## Estructura principal

- **index.js**: Punto de entrada principal del backend en Node.js.
- **RadarService.js**: Servicio central para la gestión de señales y monitoreo.
- **simulate_war_room.py**: Script Python para simulaciones avanzadas.
- **test-b4-integration.js**: Pruebas de integración.

## Subcarpetas clave

### config/
Configuraciones y scripts para integración con sistemas externos y seguridad.

### core/
Componentes centrales, incluyendo módulos de seguridad y lógica compartida.

### examples/
Ejemplos de uso y pruebas de los servicios principales.

### frontend_integration/
Componentes y scripts para la integración con el frontend.

### microservice_bff/
Microservicio Backend For Frontend (BFF) que expone APIs, gestiona autenticación y orquesta servicios:
- **main.py**: Entrada principal en Python.
- **routers/**: Rutas API (dashboard, onboarding, optimizer, etc.).
- **services/**: Servicios agregadores y de streaming.
- **utils/**: Utilidades de seguridad.
- **assets/**: Imágenes y recursos estáticos.
- **Dockerfile**: Contenedor para despliegue.

### routes/
Rutas API en Node.js para distintos módulos (AI, analyst, radar).

### src/
Código fuente principal, organizado en:
- **controllers/**: Controladores de señales y analistas.
- **core/**: Lógica de negocio, análisis, conectores, interfaces, monitoreo y procesamiento.
- **repositories/**: Acceso y gestión de datos.

## Dependencias

- **package.json**: Dependencias Node.js.
- **requirements.txt**: Dependencias Python.

## Cómo empezar

1. Instala dependencias:
	- Node.js: `npm install`
	- Python: `pip install -r requirements.txt`
2. Configura variables y archivos de entorno según la documentación interna.
3. Ejecuta el backend:
	- Node.js: `node index.js`
	- Python (microservicios): `python main.py` en la carpeta correspondiente.

## Documentación adicional

- Consulta los archivos README y los documentos de cada microservicio para detalles específicos.
- Revisa los scripts de configuración y seguridad antes de desplegar en producción.
