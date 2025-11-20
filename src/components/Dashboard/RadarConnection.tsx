import React, { useEffect, useState } from 'react';
import { fetchDashboardSnapshot, DashboardSnapshot } from '../../services/bffService';
import { useAuth } from '../../hooks/useAuth';

const RadarConnection: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const snapshot = await fetchDashboardSnapshot();
      setData(snapshot);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Intentar conectar al cargar el componente
  useEffect(() => {
    if (user) checkConnection();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-6 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
           🔌 Neural Link (Python BFF)
        </h3>
        <button 
          onClick={checkConnection}
          disabled={loading}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1 rounded transition-colors"
        >
          {loading ? "Conectando..." : "↻ Refrescar"}
        </button>
      </div>

      {/* ESTADO: ERROR */}
      {error && (
        <div className="bg-red-900/20 border border-red-900/50 p-3 rounded text-red-200 text-xs font-mono">
          <p>⛔ <strong>Error de Conexión:</strong> {error}</p>
          <p className="mt-1 opacity-50">Asegúrate de correr: 'uvicorn main:app --reload --port 8000'</p>
        </div>
      )}

      {/* ESTADO: ÉXITO */}
      {data && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-2 rounded border-l-2 border-emerald-500">
            <span className="block text-[10px] text-slate-500 uppercase">Health Score</span>
            <span className="text-xl font-bold text-emerald-400">{data.radar.health_score}%</span>
          </div>
          <div className="bg-slate-800 p-2 rounded border-l-2 border-amber-500">
            <span className="block text-[10px] text-slate-500 uppercase">Alertas Activas</span>
            <span className="text-xl font-bold text-amber-400">{data.radar.active_alerts.length}</span>
          </div>
          <div className="bg-slate-800 p-2 rounded border-l-2 border-blue-500">
            <span className="block text-[10px] text-slate-500 uppercase">Presupuesto (B6)</span>
            <span className="text-xl font-bold text-blue-400">${data.operations.governance.budget_remaining}</span>
          </div>
          <div className="bg-slate-800 p-2 rounded border-l-2 border-purple-500">
            <span className="block text-[10px] text-slate-500 uppercase">Estado</span>
            <span className="text-xs font-mono text-purple-300 truncate">{data.meta.status}</span>
          </div>
        </div>
      )}
      
      {/* SI HAY ALERTAS REALES, MOSTRARLAS */}
      {data && data.radar.active_alerts.length > 0 && (
         <div className="mt-3 space-y-2">
            {data.radar.active_alerts.map((alert: any) => (
                <div key={alert.id} className="text-xs flex gap-2 items-center text-slate-300 bg-slate-950/50 p-1 rounded px-2">
                    <span className="text-amber-500">⚠️ {alert.type}</span>
                    <span>{alert.message}</span>
                </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default RadarConnection;