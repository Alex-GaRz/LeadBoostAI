import DashboardCampaignPage from './components/Dashboard/DashboardCampaignPage';
import CreateCampaignForm from './components/Dashboard/CreateCampaignForm';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PostRegisterPage from './pages/PostRegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<><Header /><HomePage /></>} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : (<><Header /><LoginPage /></>)} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : (<><Header /><RegisterPage /></>)} 
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/campaign/:campaignId"
            element={
              <ProtectedRoute>
                <DashboardCampaignPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/campaign/edit/:campaignId"
            element={
              <ProtectedRoute>
                <Header forceDashboard />
                <div className="flex flex-col items-center w-full">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/dashboard'}
                    className="mt-4 mb-8 flex items-center bg-[#2d4792] text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-[#1d326b] transition self-start ml-32 gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Regresar
                  </button>
                  <div className="flex justify-center w-full">
                    <CreateCampaignForm />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/crear-campana"
            element={
              <>
                <Header forceDashboard />
                <div className="flex flex-col items-center w-full">
                  <button
                    type="button"
                    onClick={() => window.location.href = '/dashboard'}
                    className="mt-4 mb-8 flex items-center bg-[#2d4792] text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-[#1d326b] transition self-start ml-32 gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Regresar
                  </button>
                  <div className="flex justify-center w-full">
                    <CreateCampaignForm />
                  </div>
                </div>
              </>
            }
          />
          <Route
            path="/post-register"
            element={<><Header /><PostRegisterPage /></>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;