import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Zap } from 'lucide-react';
import { signOut } from '../firebase/authService';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
  <header className="shadow-sm border-b" style={{ background: '#0a2540' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2d4792' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: '#F5F5F5' }}>Incrementy</span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="transition-colors" style={{ color: '#F5F5F5' }}>
              Inicio
            </Link>
            <a href="#features" className="transition-colors" style={{ color: '#F5F5F5' }}>
              Características
            </a>
            <a href="#pricing" className="transition-colors" style={{ color: '#F5F5F5' }}>
              Precios
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 transition-colors"
                  style={{ color: '#F5F5F5' }}
                >
                  <User className="w-4 h-4" />
                       <span className="hidden sm:block">
                         {profile?.displayName || 'Usuario'}
                       </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 transition-colors"
                  style={{ color: '#F5F5F5' }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ color: '#0a2540', background: '#F5F5F5' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#2d4792'; e.currentTarget.style.color = '#F5F5F5'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#F5F5F5'; e.currentTarget.style.color = '#0a2540'; }}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-white px-4 py-2 rounded-lg transition-colors"
                  style={{ background: '#1b3b89' }}
                >
                  Crear Cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;