import React, { useState } from 'react';
import ActionsSidebar from './ActionsSidebar';
import Header from '../Header';
// Contexto para el estado del sidebar
import { createContext } from 'react';
const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false });

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <div className="min-h-screen bg-white flex">
        <ActionsSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex-1 flex flex-col transition-all duration-300" style={{ marginLeft: collapsed ? 80 : 256 }}>
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;
