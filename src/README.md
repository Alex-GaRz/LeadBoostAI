# LeadBoostAI Frontend (src)

Esta carpeta contiene el frontend principal de LeadBoostAI, desarrollado en React y TypeScript, integrando componentes, servicios, lógica de negocio y utilidades para la plataforma.

## Estructura principal

- **App.tsx**: Componente raíz de la aplicación.
- **main.tsx**: Punto de entrada de la aplicación React.
- **index.css** / **App.css**: Estilos globales.
- **vite-env.d.ts**: Tipos globales para Vite.

## Subcarpetas y módulos

### assets/
Recursos gráficos y logotipos.

### components/
Componentes reutilizables y layouts:
- **Dashboard/**: Componentes de dashboard (Avatar, Badge, Card, IntelligenceFeed, ThreatMap, etc.).
- **Layout/**: Componentes de layout y manejo de errores.
- Otros: AuthForm, Features, Header, Hero, PlatformIcons, Pricing, ProtectedRoute, SystemBoot.

### domain/
Modelos de negocio:
- **models/**: UniversalSignal y otros modelos de datos.

### firebase/
Servicios y configuración de Firebase:
- authService, firebaseConfig, firestoreService.

### hooks/
Hooks personalizados:
- useAuth.

### messaging/
Integración de mensajería:
- consumer.py, producer.py, health.py.

### pages/
Páginas principales de la aplicación:
- DashboardPage, ExecutionPage, LoginPage, OnboardingPage, RegisterPage, StrategyPage.

### sagas/
Adaptadores y lógica de sagas:
- messaging_saga_adapter.py.

### services/
Servicios de negocio y APIs:
- bffService, OpenAIService, socketService, VertexAIService.

### styles/
Estilos y temas personalizados:
- App.css.

### types/
Definiciones y utilidades de tipos:
- blueprint.ts.

### utils/
Utilidades generales:
- generateId.ts.

## Uso

1. Instala las dependencias:
	```bash
	npm install
	```
2. Configura variables de entorno y parámetros según la documentación interna.
3. Ejecuta la aplicación:
	```bash
	npm run dev
	```

## Recomendaciones

- Revisa y adapta los componentes y servicios según los requisitos del entorno.
- Utiliza los hooks y utilidades para extender la funcionalidad de la plataforma.
- Consulta la documentación interna para detalles sobre integración y extensión de funcionalidades.
