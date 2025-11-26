import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Crosshair, 
  Database, 
  Zap, 
  Cpu, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'CENTRO DE MANDO', 
      icon: LayoutDashboard,
      desc: 'Monitoreo Global'
    },
    { 
      path: '/strategy', 
      label: 'SALA DE ESTRATEGIA', 
      icon: Crosshair,
      desc: 'Toma de Decisiones'
    },
    { 
      path: '/execution', 
      label: 'SALA DE MÁQUINAS', 
      icon: Cpu,
      desc: 'Control de Actuadores'
    },
    { 
      path: '/onboarding', 
      label: 'FUENTES DE DATOS', 
      icon: Database,
      desc: 'Conexión de APIs'
    }
  ];

  return (
    <aside className="w-64 bg-[#050505] border-r border-gray-900 flex flex-col h-full shrink-0 z-50">
      {/* Header del Sidebar */}
      <div className="h-16 flex items-center px-6 border-b border-gray-900 bg-[#020202]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
          </div>
          <span className="font-mono font-bold tracking-widest text-lg text-gray-100">
            WOLF<span className="text-indigo-500">PAIGN</span>
          </span>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                group flex items-center px-3 py-4 rounded-lg transition-all duration-300 border border-transparent
                ${isActive 
                  ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                  : 'text-gray-500 hover:text-gray-200 hover:bg-gray-900 hover:border-gray-800'}
              `}
            >
              <item.icon 
                className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-indigo-400' : 'text-gray-600 group-hover:text-indigo-400'}`} 
                strokeWidth={1.5}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-widest uppercase font-mono">
                  {item.label}
                </span>
                <span className={`text-[10px] font-mono mt-0.5 transition-colors ${isActive ? 'text-indigo-500/80' : 'text-gray-700 group-hover:text-gray-500'}`}>
                  {item.desc}
                </span>
              </div>
              
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_#6366f1]" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Status */}
      <div className="p-4 border-t border-gray-900 bg-[#020202]">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 rounded border border-red-900/30 text-red-900 hover:bg-red-950/20 hover:text-red-500 hover:border-red-500/50 transition-all duration-300 group"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>
        </button>

        <div className="flex justify-between items-center text-[10px] text-gray-700 font-mono">
          <span>SYSTEM: <span className="text-emerald-500">ONLINE</span></span>
          <span>v2.1.0</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;