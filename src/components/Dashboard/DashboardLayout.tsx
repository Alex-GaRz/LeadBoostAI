import React, { useState } from 'react';
import ActionsSidebar from './ActionsSidebar';
// Asumimos que Header se adaptará o lo reemplazaremos después, 
// por ahora aseguramos que el contenedor sea oscuro.
import Header from '../Header'; 

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#020202] flex text-slate-200 font-mono selection:bg-blue-500/30">
      {/* Sidebar de Navegación Táctica */}
      <ActionsSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Área de Contenido Principal */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300 relative"
        style={{ marginLeft: collapsed ? 80 : 256 }}
      >
        {/* Header Flotante (Glassmorphism oscuro) */}
        <div className="sticky top-0 z-40 bg-[#020202]/80 backdrop-blur-md border-b border-slate-800">
           <Header />
        </div>

        {/* Canvas de la Misión */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;