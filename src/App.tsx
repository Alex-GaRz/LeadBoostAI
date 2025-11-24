import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // Si lo usas
import DashboardPage from './pages/DashboardPage';
// IMPORTANTE: Importamos la NUEVA página real, no el placeholder 'StrategyRoom'
import StrategyPage from './pages/StrategyPage'; 
// Mantenemos EngineRoom como placeholder porque la Fase 3 (Ejecución) aún no toca esa pantalla
import EngineRoom from './pages/placeholders/EngineRoom'; 

import EnterpriseLayout from './components/Layout/EnterpriseLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalErrorBoundary from './components/Layout/GlobalErrorBoundary';

const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Redirección raíz */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* RUTAS PROTEGIDAS DEL SISTEMA */}
          
          {/* 1. Centro de Mando (Dashboard B9) */}
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

          {/* 2. Sala de Estrategia (B5/B6) - CONECTADO AHORA A LA PÁGINA REAL */}
          <Route 
            path="/strategy" 
            element={
              <ProtectedRoute>
                <EnterpriseLayout>
                  <StrategyPage /> {/* <--- AQUÍ ESTABA EL CAMBIO CLAVE */}
                </EnterpriseLayout>
              </ProtectedRoute>
            } 
          />

          {/* 3. Sala de Máquinas (B7/B8) - Aún en construcción (Placeholder) */}
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

          {/* Fallback para rutas desconocidas */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
};

export default App;