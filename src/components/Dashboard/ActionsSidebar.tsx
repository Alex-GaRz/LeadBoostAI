import { Link, useLocation, useNavigate } from 'react-router-dom';
import React from 'react';
import { ChevronLeft, ChevronRight, Home, Layers, BarChart3, Zap, LogOut, Plus, Image } from 'lucide-react';
import WolfpaignLogo from '../../assets/Wolfpaign-logo.png';
import { signOut } from '../../firebase/authService';

const menuItems = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  // { label: 'Crear Campañas', to: '/dashboard#crear-campana', icon: Plus, blue: true }, // Ocultado temporalmente
  // { label: 'Galeria de contenido', to: '/dashboard#galeria-contenido', icon: Image, blue: true }, // Ocultado temporalmente
  { label: 'Adquisición Inteligente', to: '/hunting', icon: Zap, blue: true, prominent: true },
  { label: 'Campañas Generadas', to: '/generated-campaigns', icon: Layers, blue: true },
  // { label: 'Estadísticas', to: '/dashboard#reportes-insights', icon: BarChart3, blue: true }, // Ocultado temporalmente
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
  <aside className={`h-screen ${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 fixed left-0 top-0 flex flex-col z-30 transition-all duration-300 shadow-sm`}>
  <div className="flex items-center h-16 px-4 border-b border-gray-100">
        {collapsed ? (
          <span className="flex items-center justify-center w-full">
            <img src={WolfpaignLogo} alt="Logo" className="w-6 h-6" />
          </span>
        ) : (
          <span className="flex items-center text-xl font-semibold text-gray-900 pl-2">
            <img src={WolfpaignLogo} alt="Logo" className="w-8 h-8 mr-2" /> Wolfpaign
          </span>
        )}
      </div>
      <nav className="flex-1 py-4 px-2">
        <div className="space-y-1">
          {menuItems.map((item) => {
            // Si el ítem está comentado, no se renderiza
            if (item.label === 'Crear Campañas' || item.label === 'Galeria de contenido' || item.label === 'Estadísticas') {
              return null;
            }
            const isInicio = item.label === 'Inicio';
            const isActive = isInicio
              ? location.pathname.startsWith('/dashboard')
              : location.pathname === item.to;
            let linkClass = `flex items-center py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${collapsed ? 'justify-center' : 'w-full px-4'}`;
            let iconClass = `w-5 h-5 ${!collapsed ? 'mr-3' : ''}`;
            linkClass += isActive ? ' bg-blue-100 text-[#1a237e]' : ' text-gray-700 hover:bg-gray-100';
            iconClass += isActive ? ' text-[#1a237e]' : ' text-gray-400';
            // Eliminar estilos extra para mantener consistencia visual con los demás enlaces
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
        </div>
      </nav>
      {/* Botón para colapsar/expandir y botón Cerrar Sesión al fondo */}
      <div className="mt-auto border-t border-gray-200 px-2 pb-4 pt-4 flex flex-col gap-2">
        <button
          className="p-1 rounded border border-gray-200 bg-white shadow-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors mb-2"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          style={{ zIndex: 20 }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4 text-gray-700 mx-auto" /> : <ChevronLeft className="w-4 h-4 text-gray-700 mx-auto" />}
        </button>
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center justify-start ${collapsed ? 'px-0 justify-center' : 'px-4'} py-3 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors`}
        >
          <LogOut className="w-5 h-5 mr-2 text-gray-400" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default ActionsSidebar;

