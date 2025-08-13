# LeadBoost - Aplicación de Email Marketing con IA

Una aplicación web completa para automatización de campañas de email marketing con inteligencia artificial, desarrollada con React, TypeScript y Firebase.

## 🚀 Características

- **Autenticación completa** con Firebase Auth (Email/Password y Google)
- **Base de datos** con Cloud Firestore
- **Dashboard interactivo** con métricas de leads
- **Diseño responsive** fiel al prototipo de Figma
- **Gestión de perfiles** de usuario
- **Interfaz moderna** con Tailwind CSS y Lucide React

## 📋 Requisitos previos

- Node.js 16.0 o superior
- npm o yarn
- Cuenta de Firebase

## 🛠️ Instalación

1. **Clonar el repositorio e instalar dependencias:**
```bash
npm install
```

2. **Configurar Firebase:**
   - Ve a la [Consola de Firebase](https://console.firebase.google.com/)
   - Crea un nuevo proyecto o usa uno existente
   - En "Configuración del proyecto", ve a "Configuración general"
   - Copia la configuración de Firebase

3. **Actualizar la configuración:**
   - Abre `src/firebase/firebaseConfig.ts`
   - Reemplaza los placeholders con tu configuración real:

```typescript
const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};
```

4. **Configurar Firebase Services:**
   - **Authentication**: Habilita Email/Password y Google en la consola
   - **Firestore**: Crea la base de datos en modo test

5. **Reglas de seguridad de Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{userId} {
      allow read, write, create, update: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 Ejecución

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── Dashboard/       # Componentes del dashboard
│   ├── Header.tsx       # Navegación principal
│   ├── Hero.tsx         # Sección hero
│   ├── Features.tsx     # Sección de características
│   ├── Pricing.tsx      # Sección de precios
│   ├── AuthForm.tsx     # Formularios de autenticación
│   └── ProtectedRoute.tsx # Rutas protegidas
├── firebase/            # Configuración y servicios Firebase
│   ├── firebaseConfig.ts # Configuración
│   ├── authService.ts   # Servicios de autenticación
│   └── firestoreService.ts # Servicios de Firestore
├── hooks/               # Custom hooks
│   └── useAuth.ts       # Hook de autenticación
├── pages/               # Páginas principales
│   ├── HomePage.tsx     # Página de inicio
│   ├── LoginPage.tsx    # Página de login
│   ├── RegisterPage.tsx # Página de registro
│   └── DashboardPage.tsx # Dashboard principal
├── styles/              # Estilos CSS
│   └── App.css          # Estilos globales
├── App.tsx              # Componente principal
└── main.tsx             # Punto de entrada
```

## 🔧 Funcionalidades

### Autenticación
- ✅ Registro con email y contraseña
- ✅ Inicio de sesión con email y contraseña  
- ✅ Inicio de sesión con Google
- ✅ Manejo de errores personalizado
- ✅ Estado de autenticación persistente
- ✅ Cierre de sesión

### Base de datos
- ✅ Creación automática de perfil de usuario
- ✅ Lectura y actualización de perfiles
- ✅ Reglas de seguridad implementadas

### Interfaz
- ✅ Landing page completa con hero, características y precios
- ✅ Dashboard con métricas y tabla de leads
- ✅ Formularios de autenticación responsive
- ✅ Navegación fluida con React Router
- ✅ Diseño fiel al prototipo de Figma

## 🎨 Diseño

La aplicación sigue fielmente el prototipo de Figma proporcionado, incluyendo:
- Esquema de colores con tonos azules, verdes y naranjas
- Tipografía moderna con la fuente Inter
- Cards con sombras sutiles y esquinas redondeadas
- Animaciones y efectos hover
- Layout completamente responsive

## 🔐 Seguridad

- Reglas de seguridad de Firestore configuradas
- Autenticación requerida para acceso al dashboard
- Validación de formularios
- Manejo seguro de errores

## 🚀 Deploy

Para deploy en producción:

1. **Build del proyecto:**
```bash
npm run build
```

2. **Deploy a Firebase Hosting:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🤝 Soporte

Si tienes problemas con la configuración:

1. Verifica que la configuración de Firebase sea correcta
2. Asegúrate de que Authentication y Firestore estén habilitados
3. Revisa las reglas de seguridad de Firestore
4. Verifica que las dependencias estén instaladas correctamente

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
