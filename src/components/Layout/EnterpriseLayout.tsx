// src/components/Layout/EnterpriseLayout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from '../Header'; // Reutilizamos el Header existente, pero lo integraremos mejor en App.tsx

interface EnterpriseLayoutProps {
  children: ReactNode;
}

const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[#000000] text-gray-100 overflow-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Container - Mantenemos Header visualmente pero controlado por el layout */}
        <div className="h-16 border-b border-gray-900 bg-[#050505] flex items-center px-6 justify-between">
           {/* Placeholder para título dinámico o breadcrumbs */}
           <div className="font-mono text-xs text-gray-500 uppercase tracking-widest">
             // Secure Connection Established
           </div>
           {/* El componente Header original probablemente maneja el User Menu, lo inyectaremos aquí o en App */}
           <div className="flex items-center gap-4">
              {/* Aquí iría el UserMenu o similar del Header original */}
           </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-[#000000] scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnterpriseLayout;