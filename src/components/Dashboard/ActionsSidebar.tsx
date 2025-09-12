import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { ChevronLeft, ChevronRight, Home, Layers, BarChart3, Zap, LogOut, Plus, Image } from 'lucide-react';
import { signOut } from '../../firebase/authService';

const menuItems = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  { label: 'Crear Campañas', to: '/dashboard#crear-campana', icon: Plus, blue: true },
  { label: 'Mis campañas', to: '/dashboard#campanias-recientes', icon: Layers, blue: true },
  { label: 'Estadísticas', to: '/dashboard#reportes-insights', icon: BarChart3, blue: true },
  { label: 'Galeria de contenido', to: '/dashboard#galeria-contenido', icon: Image, blue: true },
  // { label: 'Contenido para anuncios', to: '/dashboard/contenido', icon: Image }, // Eliminado temporalmente
  // { label: 'Analisis de competidores', to: '/dashboard/competidores', icon: Users }, // Oculto temporalmente
  // { label: 'Configuración', to: '/dashboard/configuracion', icon: Settings } // Eliminado temporalmente
];

interface ActionsSidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const ActionsSidebar: React.FC<ActionsSidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
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
    <aside className={`h-screen ${collapsed ? 'w-20' : 'w-64'} bg-[#0a2540] border-r-0 fixed left-0 top-0 flex flex-col z-30 transition-all duration-300`}>
      <div className="flex items-center h-16 px-2 border-b border-gray-200 justify-between">
        {collapsed ? (
          <span className="flex items-center justify-center w-full">
            <Zap className="w-6 h-6 text-white" />
          </span>
        ) : (
          <span className="flex items-center text-xl font-bold text-white pl-2">
            <Zap className="w-6 h-6 mr-2 text-white" /> Incrementy
          </span>
        )}
        <button
          className="p-2 rounded hover:bg-[#2d4792] transition-colors ml-auto"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight className="w-5 h-5 text-white" /> : <ChevronLeft className="w-5 h-5 text-white" />}
        </button>
      </div>
      <nav className="flex-1 py-6 px-2 space-y-2">
        {/* Oculta la opción 'Estadísticas' del menú, pero no elimina el código del array */}
        {menuItems.filter(item => item.label !== 'Estadísticas').map((item) => {
          // Para 'Inicio', activo si la ruta empieza con /dashboard
          const isInicio = item.label === 'Inicio';
          const isActive = isInicio
            ? location.pathname.startsWith('/dashboard')
            : location.pathname === item.to;
          const isBlueButton = item.blue;
          let linkClass = `flex items-center py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${collapsed ? 'justify-center' : 'w-full px-4'}`;
          let iconClass = `w-5 h-5 ${!collapsed ? 'mr-3' : ''}`;
          if (isBlueButton) {
            linkClass += isActive ? ' bg-white text-[#2d4792]' : ' bg-[#0a2540] text-white hover:bg-[#1b3b89]';
            iconClass += isActive ? ' text-[#2d4792]' : ' text-white';
          } else {
            linkClass += isActive ? ' bg-white text-[#2d4792]' : ' text-[#2d4792] hover:bg-[#e6eaf6]';
            iconClass += isActive ? ' text-[#2d4792]' : ' text-[#2d4792]';
          }
          return (
            <Link
              key={item.to}
              to={item.to}
              className={linkClass}
              title={item.label}
            >
              <item.icon className={iconClass} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
      {/* Botón Cerrar Sesión al fondo */}
      <div className="mt-auto border-t border-gray-200 px-2 pb-4 pt-4">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center justify-start ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 rounded-lg font-medium bg-[#0a2540] text-white hover:bg-[#1b3b89] transition-colors`}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default ActionsSidebar;

