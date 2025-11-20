import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth'; // Firebase v9+ SDK

// Configuración API
const API_URL = "http://localhost:8000/dashboard/snapshot";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error("Usuario no autenticado en Firebase");
        }

        // 1. OBTENER TOKEN ACTUALIZADO
        // forceRefresh = true asegura que no esté expirado
        const token = await user.getIdToken(true);

        // 2. LLAMADA A LA API PYTHON CON HEADER
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- CLAVE DE SEGURIDAD
          }
        });

        if (!response.ok) {
          if (response.status === 401) console.error("Token rechazado por Python");
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-emerald-500">Cargando Neural Link...</div>;
  if (error) return <div className="text-red-500">Error de Conexión: {error}</div>;

  // 3. RENDERIZADO ENTERPRISE DARK MODE
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8 font-sans">
      
      {/* HEADER */}
      <header className="mb-8 border-b border-slate-700 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            LeadBoost RADAR
          </h1>
          <p className="text-sm text-slate-400">Bienvenido, {data.meta.user}</p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-600">
          Health Score: <span className="text-emerald-400 font-bold">{data.radar.health_score}%</span>
        </div>
      </header>

      {/* ALERTAS (BLOQUE 4) */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-100 flex items-center gap-2">
          ⚡ Alertas Críticas (B4)
        </h2>
        <div className="grid gap-4">
          {data.radar.active_alerts.map((alert) => (
            <div key={alert.id} className="bg-slate-800 border-l-4 border-amber-500 p-4 rounded-r shadow-lg hover:bg-slate-750 transition-colors">
              <div className="flex justify-between">
                <span className="font-bold text-amber-500">{alert.type}</span>
                <span className="text-xs text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1">{alert.message}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TABLA DE EJECUCIÓN (BLOQUE 7) */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-slate-100">🚀 Ejecución Activa (B7)</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-3">Campaña ID</th>
                <th className="px-6 py-3">Plataforma</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Gasto</th>
                <th className="px-6 py-3">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 bg-slate-900">
              {data.operations.execution.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-slate-300">{camp.id}</td>
                  <td className="px-6 py-4">{camp.platform}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      camp.status === 'ACTIVE' ? 'bg-emerald-900 text-emerald-300' : 'bg-blue-900 text-blue-300'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">${camp.spend}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{camp.roas}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;