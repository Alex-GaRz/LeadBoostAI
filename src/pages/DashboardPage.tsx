import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchDashboardSnapshot, DashboardSnapshot } from '../services/bffService';
// Importamos el nuevo diseño
import TerminalDashboard from '../components/Dashboard/TerminalDashboard';

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Estado de datos
  const [radarData, setRadarData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }

    if (user) {
      const loadData = async () => {
        try {
          // Pequeño delay para asegurar token fresco
          await new Promise(r => setTimeout(r, 500));
          const data = await fetchDashboardSnapshot();
          setRadarData(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center font-mono">
        <div className="w-16 h-16 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <div className="text-blue-500 text-xs tracking-widest animate-pulse">ESTABLISHING SECURE UPLINK...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="border border-red-900 bg-red-950/20 p-8 max-w-md text-center">
          <div className="text-red-500 font-mono text-xl mb-2">CONNECTION_FAILURE</div>
          <p className="text-red-400/60 text-sm font-mono mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-900 text-white font-mono text-xs px-4 py-2 hover:bg-red-800 transition-colors"
          >
            RETRY HANDSHAKE
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {radarData && <TerminalDashboard data={radarData} />}
    </>
  );
};

export default DashboardPage;