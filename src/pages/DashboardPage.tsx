import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchDashboardSnapshot, DashboardSnapshot } from '../services/bffService';
import TerminalDashboard from '../components/Dashboard/TerminalDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Función de carga inicial de datos (Snapshot Básico)
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log("🔄 [DashboardPage] Solicitando Snapshot al BFF...");
        const data = await fetchDashboardSnapshot();
        console.log("✅ [DashboardPage] Snapshot recibido:", data);
        setSnapshot(data);
      } catch (err) {
        console.error("❌ [DashboardPage] Error crítico:", err);
        setError("Error de conexión con el Neural Link (BFF).");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Renderizado de Estados de Carga / Error
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center flex-col">
        <div className="w-16 h-16 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <div className="text-blue-500 font-mono text-xs animate-pulse">ESTABLECIENDO ENLACE NEURAL...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-rose-500 font-mono">
        <div className="text-center">
            <h1 className="text-4xl mb-2">⚠ ERROR DE SISTEMA</h1>
            <p>{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 border border-rose-900 hover:bg-rose-900/20 text-xs uppercase tracking-widest transition-all"
            >
                Reiniciar Sistema
            </button>
        </div>
      </div>
    );
  }

  // Renderizado Principal: Aquí es donde se llama a tu nuevo componente
  return (
    <>
      {snapshot && <TerminalDashboard data={snapshot} />}
    </>
  );
};

export default DashboardPage;