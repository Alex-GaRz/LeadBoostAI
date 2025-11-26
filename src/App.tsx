import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; 
import DashboardPage from './pages/DashboardPage';
import StrategyPage from './pages/StrategyPage'; 
import ExecutionPage from './pages/ExecutionPage';
import OnboardingPage from './pages/OnboardingPage'; // <--- IMPORTANTE: La página que creamos antes

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
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* =========================================================
              ZONA SEGURA - ENTERPRISE LAYOUT
          ========================================================= */}
          
          {/* 1. CENTRO DE MANDO */}
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

          {/* 2. ESTRATEGIA */}
          <Route 
            path="/strategy" 
            element={
              <ProtectedRoute>
                <EnterpriseLayout>
                  <StrategyPage />
                </EnterpriseLayout>
              </ProtectedRoute>
            } 
          />

          {/* 3. EJECUCIÓN (MÁQUINAS) */}
          <Route 
            path="/execution" 
            element={
              <ProtectedRoute>
                <EnterpriseLayout>
                  <ExecutionPage />
                </EnterpriseLayout>
              </ProtectedRoute>
            } 
          />

          {/* 4. DATA SOURCES (ONBOARDING) - NUEVO FASE 1 */}
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <EnterpriseLayout>
                  <OnboardingPage />
                </EnterpriseLayout>
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </GlobalErrorBoundary>
  );
};

export default App;