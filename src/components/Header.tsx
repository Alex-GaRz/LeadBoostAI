import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Zap, Bell } from 'lucide-react';
import { signOut } from '../firebase/authService';
import { useAuth } from '../hooks/useAuth';
// Contexto para saber si el sidebar está colapsado
const SidebarContext = React.createContext<{ collapsed: boolean }>({ collapsed: false });

interface HeaderProps {
  forceDashboard?: boolean;
}

const Header: React.FC<HeaderProps> = ({ forceDashboard }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Estado y ref para dropdown de notificaciones
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showNotifications) return;
    function handleClickOutside(event: MouseEvent) {
      const popup = document.getElementById('notification-popup');
      if (
        bellRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        popup &&
        !popup.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Ocultar logo, nombre y menú en dashboard
  const isDashboard = forceDashboard || location.pathname.startsWith('/dashboard');
  const { collapsed } = useContext(SidebarContext);
  return (
    <header
      className={`shadow-sm border-b${!isDashboard ? ' fixed top-0 left-0 w-full z-50' : ''} ${isDashboard ? 'bg-white border-b border-gray-200' : ''}`}
      style={!isDashboard ? { background: '#0a2540' } : {}}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center h-16 w-full relative`}> 
          {isDashboard && (
            <span
              className={`text-xl font-bold text-[#2d4792] absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-300 ${collapsed ? 'ml-6' : 'ml-10'}`}
              style={{ minWidth: 0 }}
            >
              {profile?.companyName || 'Usuario'}
            </span>
          )}
          {!isDashboard && (
            <>
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#2d4792' }}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ color: '#F5F5F5' }}>Incrementy</span>
              </Link>
              <nav className="hidden md:flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
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
            </>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Notificaciones */}
                <div className="relative">
                  <button
                    className="flex items-center justify-center px-3 py-2 rounded-lg transition-colors order-1"
                    style={{ background: 'transparent', color: '#6b7280' }}
                    aria-label="Notificaciones"
                    onClick={() => setShowNotifications((v) => !v)}
                    ref={bellRef}
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                  {showNotifications && (
                    <div
                      id="notification-popup"
                      className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-700 text-sm"
                      style={{ minHeight: '60px' }}
                    >
                      No tienes notificaciones
                    </div>
                  )}
                </div>

                <Link
                  to="/dashboard"
                  className="flex items-center transition-colors px-3 py-2 rounded-lg order-2 ml-2"
                  style={{ background: '#0a2540', color: '#fff', marginLeft: 'auto' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#1b3b89'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#0a2540'; }}
                >
                  <User className="w-5 h-5" />
                </Link>

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