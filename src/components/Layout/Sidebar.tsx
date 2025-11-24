// src/components/Layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

// Iconos SVG inline para asegurar portabilidad sin dependencias externas
const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
  ),
  Strategy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
  ),
  Execution: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
  )
};

const Sidebar: React.FC = () => {
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'CENTRO DE MANDO', 
      icon: <Icons.Dashboard />,
      desc: 'Monitoreo en Tiempo Real'
    },
    { 
      path: '/strategy', 
      label: 'SALA DE ESTRATEGIA', 
      icon: <Icons.Strategy />,
      desc: 'Toma de Decisiones'
    },
    { 
      path: '/execution', 
      label: 'SALA DE MÁQUINAS', 
      icon: <Icons.Execution />,
      desc: 'Control de Actuadores'
    },
  ];

  return (
    <aside className="w-64 bg-[#050505] border-r border-gray-900 flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-900">
        <div className="flex items-center gap-2 text-indigo-500">
          <div className="w-3 h-3 bg-indigo-500 rounded-sm animate-pulse" />
          <span className="font-bold tracking-wider text-sm text-gray-100">LEADBOOST</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              group flex items-center px-3 py-3 rounded-sm transition-all duration-200 border-l-2
              ${isActive 
                ? 'bg-gray-900 border-indigo-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50'}
            `}
          >
            <span className="mr-3 opacity-80 group-hover:opacity-100">{item.icon}</span>
            <div>
              <div className="text-xs font-bold tracking-wide uppercase">{item.label}</div>
              <div className="text-[10px] opacity-60 font-normal">{item.desc}</div>
            </div>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-900">
        <div className="text-[10px] text-gray-600 font-mono text-center">
          SYSTEM STATUS: <span className="text-green-500">OPTIMAL</span>
          <br/>
          v2.0.1 (ENT)
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;