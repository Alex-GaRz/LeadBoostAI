import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { ChevronLeft, ChevronRight, Home, Layers, Image, Users, BarChart3, Settings, Zap, LogOut } from 'lucide-react';
import { signOut } from '../../firebase/authService';

const menuItems = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  { label: 'Campañas', to: '/dashboard/campanas', icon: Layers },
  { label: 'Contenido para anuncios', to: '/dashboard/contenido', icon: Image },
  { label: 'Analisis de competidores', to: '/dashboard/competidores', icon: Users },
  { label: 'Reportes', to: '/dashboard/reportes', icon: BarChart3 },
  { label: 'Configuración', to: '/dashboard/configuracion', icon: Settings }
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
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${collapsed ? 'justify-center' : 'w-full px-4'} ${location.pathname === item.to ? 'bg-white text-[#2d4792]' : 'text-white hover:bg-[#2d4792]'}`}
            title={item.label}
          >
            <item.icon className={`w-5 h-5 ${!collapsed ? 'mr-3' : ''} ${location.pathname === item.to ? 'text-[#2d4792]' : 'text-white'}`} />
            {!collapsed && item.label}
          </Link>
        ))}
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

