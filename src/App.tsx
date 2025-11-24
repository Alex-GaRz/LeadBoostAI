// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Infraestructura Core
import GlobalErrorBoundary from './components/Layout/GlobalErrorBoundary';
import EnterpriseLayout from './components/Layout/EnterpriseLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Componentes Públicos
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Header from './components/Header'; // Usado solo en rutas públicas/legacy wrappers si es necesario

// Componentes del User Journey (Fase 2)
import DashboardPage from './pages/DashboardPage'; // Pantalla 1: Centro de Mando
import StrategyRoom from './pages/placeholders/StrategyRoom'; // Pantalla 2: Estrategia
import EngineRoom from './pages/placeholders/EngineRoom'; // Pantalla 3: Ejecución

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-mono text-sm animate-pulse">INITIALIZING SECURE SYSTEMS...</p>
        </div>
      </div>
    );
  }

  return (
    <GlobalErrorBoundary>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/" element={<><Header /><HomePage /></>} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : (<LoginPage />)} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : (<RegisterPage />)} 
          />

          {/* ZONA ENTERPRISE - PROTEGIDA 
            Implementa el User Journey definido en 'MEJORAS MVP PLAN 1.pdf'
            Todas estas rutas están envueltas en el EnterpriseLayout
          */}
          
          {/* Pantalla 1: Centro de Mando */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <EnterpriseLayout>
                  <DashboardPage />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Pantalla 2: Sala de Estrategia */}
          <Route
            path="/strategy"
            element={
              <ProtectedRoute>
                <EnterpriseLayout>
                  <StrategyRoom />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Pantalla 3: Sala de Máquinas */}
          <Route
            path="/execution"
            element={
              <ProtectedRoute>
                <EnterpriseLayout>
                  <EngineRoom />
                </EnterpriseLayout>
              </ProtectedRoute>
            }
          />

          {/* Rutas de Soporte (Mantenidas por compatibilidad temporal si son necesarias) */}
          <Route
            path="/post-register"
            element={<Header />}
          />

          {/* Redirección por defecto: 404 te lleva al Dashboard si estás logueado, o al Home */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/"} replace />} 
          />
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
}

export default App;