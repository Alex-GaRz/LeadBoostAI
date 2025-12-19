# LeadBoostAI - Raíz del Proyecto

Este archivo describe los archivos y scripts principales ubicados en la raíz del proyecto LeadBoostAI. Aquí se encuentran configuraciones globales, scripts de instalación, archivos de licencia, dependencias y orquestadores de servicios.

## Archivos principales

- **.env / .env.security / .env.messaging.example / .env.security.example**: Variables de entorno para configuración de seguridad, mensajería y gestión de secretos.
- **.gitignore**: Exclusión de archivos y carpetas sensibles o generados automáticamente.
- **docker-compose.yml / docker-compose.messaging.yml / docker-compose.messaging.override.yml**: Orquestación de servicios y microservicios con Docker Compose (PostgreSQL, Redis, Kafka, microservicios LeadBoostAI).
- **eslint.config.js / postcss.config.js / tailwind.config.js**: Configuración de linters y estilos para el frontend.
- **index.html**: Entrada principal para la aplicación web.
- **init_db.sql / migration_fase4.sql**: Scripts SQL para inicialización y migración de base de datos.
- **init_security.bat / install_fase5.bat / install_fase5.sh / fix_docker_build.sh / setup_security_keys.sh**: Scripts de instalación, inicialización y generación de claves de seguridad.
- **license.txt**: Términos de uso y derechos de autor.
- **package.json / package-lock.json**: Dependencias y scripts de npm para el frontend y utilidades.
- **requirements.txt / requirements_messaging.txt**: Dependencias Python para microservicios y mensajería.
- **tsconfig.json / tsconfig.app.json / tsconfig.node.json / vite.config.ts**: Configuración de TypeScript y Vite para el frontend.

## Uso

1. Configura las variables de entorno copiando los archivos ejemplo y adaptando a tu entorno.
2. Instala dependencias:
	- Node.js: `npm install`
	- Python: `pip install -r requirements.txt`
3. Utiliza los scripts de instalación y seguridad para preparar el entorno.
4. Orquesta los servicios con Docker Compose según la documentación interna.

## Recomendaciones

- Revisa y adapta los archivos de configuración antes de desplegar en producción.
- Consulta los scripts y archivos de licencia para asegurar el cumplimiento de requisitos legales y técnicos.
- Utiliza los archivos de migración y orquestación para mantener la integridad y disponibilidad de los servicios.
