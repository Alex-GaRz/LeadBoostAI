import React, { useContext, useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import WolfpaignLogo from '../assets/Wolfpaign-logo.png';
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
      className={`bg-white shadow-sm border-b border-gray-200${!isDashboard ? ' fixed top-0 left-0 w-full z-50' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center h-16 w-full relative`}> 
          {isDashboard && (
            <span
              className={`font-semibold absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-300 ${collapsed ? 'ml-6' : 'ml-10'}`}
              style={{ minWidth: 0, fontSize: '24px', color: '#111' }}
            >
              {profile?.companyName || 'Usuario'}
            </span>
          )}
          {!isDashboard && (
            <>
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
                  <img src={WolfpaignLogo} alt="Wolfpaign Logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="font-semibold text-gray-800" style={{ fontSize: '16px' }}>Wolfpaign</span>
              </Link>
              <nav className="hidden md:flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
                <Link to="/" className="transition-colors text-gray-600 hover:text-[#2563eb] font-medium">
                  Inicio
                </Link>
                <a href="#features" className="transition-colors text-gray-600 hover:text-[#2563eb] font-medium">
                  Características
                </a>
                <a href="#pricing" className="transition-colors text-gray-600 hover:text-[#2563eb] font-medium">
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
                  className="flex items-center px-3 py-2 order-2 ml-2 focus:outline-none focus:ring-0 bg-transparent"
                  style={{ background: 'transparent', color: 'inherit', marginLeft: 'auto', boxShadow: 'none', border: 'none' }}
                >
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {user?.displayName?.[0] || "U"}
                    </div>
                  )}
                </Link>

              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg transition-colors font-medium bg-white text-[#2563eb] border border-[#2563eb] hover:bg-[#2563eb] hover:text-white"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="text-white px-4 py-2 rounded-lg transition-colors font-medium bg-[#2563eb] hover:bg-[#1d4ed8]"
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