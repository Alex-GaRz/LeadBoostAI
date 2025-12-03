import React, { useState, useEffect } from 'react';
import TerminalDashboard from '../components/Dashboard/TerminalDashboard';
import OperationsTimeline from '../components/Dashboard/OperationsTimeline';
import SystemBoot from '../components/SystemBoot';
import { fetchDashboardSnapshot, DashboardSnapshot } from '../services/bffService';
import { socketService } from '../services/socketService';

// Datos iniciales vacíos para evitar parpadeos
const INITIAL_DATA: DashboardSnapshot = {
  meta: { user: 'COMMANDER', mode: 'INIT', status: 'LOADING' },
  radar: { health_score: 0, active_alerts: [], market_intelligence: [] },
  operations: { governance: { budget_remaining: 0 }, execution: [] }
};

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSnapshot>(INITIAL_DATA);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    // 1. Conexión Socket
    socketService.connect('COMMANDER_01');

    // 2. Carga de datos
    fetchDashboardSnapshot().then(setData).catch(console.error);

    // 3. MEMORIA DEL SISTEMA (REACTIVADA)
    // Verifica si ya mostramos la intro en esta sesión
    const hasBooted = sessionStorage.getItem('system_booted');
    if (hasBooted) {
       setBootComplete(true); // Si ya existe la marca, saltar intro
    }
  }, []);

  const handleBootComplete = () => {
    // 4. GUARDAR MARCA EN MEMORIA
    // Al terminar la intro, guardamos la marca para no repetirla
    sessionStorage.setItem('system_booted', 'true');
    setBootComplete(true);
  };

  // Si no ha completado el boot, mostramos la secuencia
  if (!bootComplete) {
    return <SystemBoot onComplete={handleBootComplete} />;
  }

  // Si ya completó, mostramos el Dashboard Real
  return (
    <div className="animate-in fade-in duration-1000">
      <div className="px-6 pt-6 -mb-6">
        <OperationsTimeline />
      </div>
      <TerminalDashboard data={data} />
    </div>
  );
};

export default DashboardPage;