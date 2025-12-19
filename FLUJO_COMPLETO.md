# LeadBoostAI - Resumen Extenso y Flujo Técnico Completo

## Resumen General

LeadBoostAI es una plataforma modular, distribuida y orientada a microservicios para la gestión avanzada de campañas publicitarias y estrategias de marketing digital. El software está diseñado para automatizar, analizar, optimizar, ejecutar y auditar campañas en múltiples canales, integrando componentes para procesamiento de datos, generación de contenido, análisis de tendencias, gobernanza, seguridad, almacenamiento, mensajería y orquestación de flujos de trabajo. Cada módulo cumple una función específica y se comunica mediante APIs, bases de datos, adaptadores y scripts, permitiendo la personalización, validación y control de campañas en distintos formatos y plataformas.

## Explicación Técnica por Carpetas y Archivos

### Raíz del Proyecto
- **Archivos de configuración (.env, .env.security, .env.messaging.example, .env.security.example):** Variables de entorno para seguridad, mensajería, gestión de secretos y configuración global.
- **docker-compose.yml, docker-compose.messaging.yml, docker-compose.messaging.override.yml:** Orquestación de servicios y microservicios con Docker Compose, incluyendo bases de datos, mensajería y microservicios LeadBoostAI.
- **eslint.config.js, postcss.config.js, tailwind.config.js:** Configuración de linters y estilos para el frontend.
- **index.html:** Entrada principal para la aplicación web.
- **init_db.sql, migration_fase4.sql:** Scripts SQL para inicialización y migración de base de datos.
- **init_security.bat, install_fase5.bat, install_fase5.sh, fix_docker_build.sh, setup_security_keys.sh:** Scripts de instalación, inicialización y generación de claves de seguridad.
- **license.txt:** Términos de uso y derechos de autor.
- **package.json, package-lock.json:** Dependencias y scripts de npm para el frontend y utilidades.
- **requirements.txt, requirements_messaging.txt:** Dependencias Python para microservicios y mensajería.
- **tsconfig.json, tsconfig.app.json, tsconfig.node.json, vite.config.ts:** Configuración de TypeScript y Vite para el frontend.

### backend/
- **index.js, RadarService.js, simulate_war_room.py, test-b4-integration.js:** Servicios principales en Node.js y Python para procesamiento de señales, monitoreo, simulaciones y pruebas de integración.
- **config/, core/, examples/, frontend_integration/, microservice_bff/, routes/, src/:** Subcarpetas con configuraciones, lógica central, ejemplos, integración con frontend, rutas API y código fuente principal (controladores, lógica de negocio, repositorios).

### config/
- **kafka_acls.sh, kafka_config.yml:** Scripts y archivos para gestionar ACLs y configuración de Kafka.
- **security/:** Políticas de acceso, identidades y roles de servicios (iam_policies.yaml, service_identities.yaml).

### core/
- **security/:** Módulos de seguridad y gestión de credenciales (audit_logger.py, iam_policy.py, mtls_config.py, secrets.py, secure_client.py, security_middleware.py, sts.py).
- **__init__.py:** Inicialización del paquete core.

### core_orchestrator/
- **app/:** FastAPI principal, configuración y rutas API.
- **domain/:** Implementación de FSM (OrchestratorFSM) y lógica de workflow.
- **infrastructure/:** Cliente HTTP genérico e idempotency store.
- **requirements.txt:** Dependencias Python.
- Orquestador de campañas con FSM, idempotencia, aislamiento de servicios, quality gates y lógica de reintentos.

### db_migrations/
- **Scripts SQL:** Migración a PostgreSQL, arquitectura de esquemas para IAM, finanzas, inventario, gobernanza, sistema, eventos y migración desde Firebase. Incluye scripts maestros y específicos por módulo.

### microservice_actuator/
- **main.py, requirements.txt, Dockerfile:** Motor de ejecución de acciones pre-aprobadas por gobernanza, validación HITL, adaptadores pluggables y persistencia en Postgres.
- **core/, handlers/, interfaces/, models/, routers/, services/:** Módulos para pipeline de ejecución, adaptadores de plataformas, interfaces, modelos de datos, rutas y servicios de negocio.

### microservice_actuator_plus/
- **main.py, requirements.txt:** Extensión del actuator con módulos avanzados para normalización, estrategias, seguridad y gestión de memoria distribuida.
- **core/, interfaces/, models/, scripts/:** Ingesta de datos, normalización, sincronización de memoria, seguridad, estrategias y generador de tráfico simulado.

### microservice_analyst/
- **main.py, requirements.txt, test_strategy_engine.py:** Motor de análisis y estrategia, lógica de gobernanza, simulación, optimización y asesoría.
- **api/routes/:** Endpoints para advisor, governance, search y simulation.
- **core/:** Publicación de auditorías, configuración, adaptador de base de datos, motor de análisis, interfaces empresariales, motor de gobernanza, optimización, perfiles, resonancia, simulación y confianza.
- **models/:** Esquemas de datos.
- **services/:** Servicio principal de análisis, constructor de contexto y motor de estrategias.

### microservice_copy/
- **core/:** Motor principal de generación y procesamiento de copy, validadores de calidad y compliance.
- **pipeline/:** Pipeline de procesamiento de copy.

### microservice_enterprise/
- **main.py, Dockerfile, requirements.txt:** Lógica empresarial avanzada, gestión de eventos, simulación, seguridad y escenarios críticos.
- **api/routes.py:** Endpoints API.
- **core/:** Locks distribuidos, bus de eventos, backup de eventos, pánico, motor de seguridad y simulador de escenarios.
- **models/:** Esquemas de datos.
- **scenarios/:** Disparo de escenarios de negocio.

### microservice_memory/
- **main.py, requirements.txt, database.py, memory.db, chroma_db/:** Gestión de memoria, almacenamiento vectorial, trazabilidad y motores de embeddings.
- **core/:** Configuración, motor de embeddings, recuperación de información, almacenamiento de vectores.
- **models/:** Modelos de memoria.
- **services/:** Canonización, núcleo de aprendizaje y trazabilidad.
- **tests/:** Pruebas unitarias y de integración.

### microservice_optimizer/
- **main.py, requirements.txt:** Motor matemático para optimización de campañas, simulación de escenarios y gobernanza.
- **api/:** Endpoints de optimización y gobernanza.
- **core/:** Motor matemático, cliente de memoria, adaptador PostgreSQL, entrenador de modelos.
- **logic/:** Motor de optimización y simulador de escenarios.
- **models/:** Modelos de contexto y resultados.
- **src/governance/:** Motor de contexto, pipeline, modelos genéticos y reglas de negocio.
- **tests/:** Pruebas del motor de optimización.

### microservice_scout/
- **main_scout.py, requirements.txt, test_rss.py:** Exploración y análisis de tendencias, redes sociales y fuentes externas.
- **core/:** Adaptadores para TikTok, Reddit, RSS, normalización de datos, análisis de tendencias y visión computacional.
- **tests/:** Pruebas de integración y unitarias.

### microservice_visual/
- **main.py, requirements.txt, pyproject.toml:** Generación, validación y orquestación de contenido visual.
- **adapters/:** Clientes para ControlNet, motores de difusión y almacenamiento de imágenes.
- **api/:** Endpoints API.
- **configuration/:** Parámetros y settings.
- **core/:** Ensamblaje, validación, motores de generación, armonización, layout, tipografía, monitoreo, logging, trazabilidad, orquestación y pipelines visuales.
- **utils/:** Hashing, operaciones y validaciones de imágenes.
- **test/:** Pruebas unitarias (carpeta vacía).

### migrations/
- **phase2_messaging.sql:** Script SQL para migración y actualización de la mensajería en la fase 2.

### shared_lib/
- **src/contracts/:** Modelos base, enumeraciones, artefactos de negocio y payloads para campañas, facilitando la interoperabilidad entre microservicios.
- **test_contracts.py:** Pruebas de contratos.

### src/
- **App.tsx, main.tsx, index.css, App.css, vite-env.d.ts:** Frontend principal en React/TypeScript.
- **assets/:** Recursos gráficos y logotipos.
- **components/:** Componentes reutilizables y layouts (Dashboard, Layout, AuthForm, etc.).
- **domain/models/:** Modelos de negocio.
- **firebase/:** Servicios y configuración de Firebase.
- **hooks/:** Hooks personalizados.
- **messaging/:** Integración de mensajería.
- **pages/:** Páginas principales de la aplicación.
- **sagas/:** Adaptadores y lógica de sagas.
- **services/:** Servicios de negocio y APIs.
- **styles/:** Estilos y temas personalizados.
- **types/:** Definiciones y utilidades de tipos.
- **utils/:** Utilidades generales.

---

Este flujo describe cómo cada módulo y microservicio contribuye a la gestión integral de campañas en LeadBoostAI, desde la configuración y orquestación, pasando por la generación y validación de contenido, hasta el análisis, optimización y ejecución de acciones, todo bajo estrictos controles de seguridad, gobernanza y trazabilidad. Cada carpeta y archivo cumple una función específica y no se asume ninguna conexión que no esté explícitamente definida en la estructura y documentación del proyecto.
