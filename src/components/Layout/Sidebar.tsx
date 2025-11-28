import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BrainCircuit, 
  Activity, 
  Database, 
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  // MISIÓN 1: Limpieza Segura. Solo rutas críticas. Terminología de "Guerra".
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'CENTRO DE MANDO', 
      icon: LayoutDashboard,
      desc: 'Visión Global'
    },
    { 
      path: '/strategy', 
      label: 'SALA DE ESTRATEGIA', 
      icon: BrainCircuit,
      desc: 'Inteligencia & Decisión'
    },
    { 
      path: '/execution', 
      label: 'SALA DE MÁQUINAS', 
      icon: Activity,
      desc: 'Ejecución Táctica (B7)'
    },
    { 
      path: '/onboarding', 
      label: 'UPLINKS DE DATOS', 
      icon: Database,
      desc: 'Conexión de Fuentes'
    }
  ];

  return (
    <aside className="w-64 bg-[#050505] border-r border-slate-900 flex flex-col h-full shrink-0 z-50">
      {/* Header Táctico */}
      <div className="h-16 flex items-center px-6 border-b border-slate-900 bg-[#020202]">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
          </div>
          <span className="font-mono font-bold tracking-widest text-lg text-slate-100">
            SYNCHRO<span className="text-blue-600">NY</span>
          </span>
        </div>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                group flex items-center px-3 py-4 rounded-sm transition-all duration-200 border-l-2
                ${isActive 
                  ? 'bg-blue-950/20 border-blue-500 text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-900'}
              `}
            >
              <item.icon 
                className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-blue-400'}`} 
                strokeWidth={1.5}
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-widest uppercase font-mono">
                  {item.label}
                </span>
                <span className={`text-[10px] font-mono mt-0.5 transition-colors ${isActive ? 'text-blue-500/80' : 'text-slate-700 group-hover:text-slate-500'}`}>
                  {item.desc}
                </span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer de Sistema */}
      <div className="p-4 border-t border-slate-900 bg-[#020202]">
        {/* Indicador de Estado de Seguridad */}
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded border border-slate-800">
          <ShieldAlert className="w-4 h-4 text-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-mono uppercase">Protocolo de Seguridad</span>
            <span className="text-[10px] text-emerald-500 font-mono font-bold">ACTIVO (AES-256)</span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded border border-slate-800 text-slate-400 hover:bg-red-950/10 hover:text-red-500 hover:border-red-900/50 transition-all duration-200 group"
        >
          <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Desconectar</span>
        </button>

        <div className="mt-3 flex justify-between items-center text-[9px] text-slate-700 font-mono">
          <span>LEADBOOST CORE</span>
          <span>v2.2.0-STABLE</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;