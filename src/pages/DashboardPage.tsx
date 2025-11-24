// src/pages/DashboardPage.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchDashboardSnapshot, DashboardSnapshot } from '../services/bffService';

// Componentes "Dumb" internos para mantener el archivo autocontenido (o importar de components/)
const MetricCard = ({ label, value, trend, status }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 p-4 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
    <div className={`absolute top-0 left-0 w-1 h-full ${status === 'good' ? 'bg-emerald-500' : status === 'warn' ? 'bg-amber-500' : 'bg-rose-500'}`} />
    <h3 className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-1">{label}</h3>
    <div className="flex items-end justify-between">
      <span className="text-2xl text-white font-mono font-bold">{value}</span>
      <span className={`text-xs font-mono ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
      </span>
    </div>
  </div>
);

const NewsTicker = ({ items }: { items: any[] }) => (
  <div className="bg-blue-950/20 border-b border-blue-900/30 h-8 flex items-center overflow-hidden whitespace-nowrap">
    <div className="px-4 bg-blue-900/20 h-full flex items-center text-blue-400 text-xs font-mono font-bold border-r border-blue-900/30">
      RADAR FEED
    </div>
    <div className="animate-ticker flex items-center space-x-8 px-4">
      {items.map((item) => (
        <span key={item.id} className="text-slate-300 text-xs font-mono flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${item.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
          [{item.timestamp.split('T')[1].slice(0,5)}] {item.message}
        </span>
      ))}
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardSnapshot()
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center font-mono text-blue-500 animate-pulse">
      INITIALIZING_COMMAND_CENTER...
    </div>
  );

  if (!data) return <div className="text-red-500 font-mono p-10">SYSTEM_OFFLINE</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-mono pb-10">
      {/* HEADER / TICKER */}
      <NewsTicker items={data.radar.active_alerts} />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        
        {/* TOP METRICS ROW (Financials & Health) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard 
            label="System Health" 
            value={`${data.radar.health_score}%`} 
            trend={2.5} 
            status={data.radar.health_score > 90 ? 'good' : 'warn'} 
          />
          <MetricCard 
            label="Budget Remaining" 
            value={`$${data.operations.governance.budget_remaining}`} 
            trend={-12} 
            status={data.operations.governance.budget_remaining > 1000 ? 'good' : 'bad'} 
          />
          <MetricCard 
            label="Active Campaigns" 
            value={data.operations.execution.filter(e => e.status === 'ACTIVE').length} 
            trend={5} 
            status="good" 
          />
          <MetricCard 
            label="Threat Level" 
            value="ELEVATED" 
            trend={0} 
            status="warn" 
          />
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT: THREAT MAP & OPERATIONS (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* THREAT MAP PLACEHOLDER */}
            <div className="bg-slate-900/30 border border-slate-800 h-[400px] relative p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"/>
                  Global Signal Origins
                </h2>
                <span className="text-xs text-slate-600">LIVE MONITORING</span>
              </div>
              
              {/* Fake Map Visual */}
              <div className="flex-1 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-no-repeat bg-center bg-contain opacity-20 relative">
                 {/* Puntos de calor simulados */}
                 <div className="absolute top-[30%] left-[25%] w-4 h-4 bg-blue-500/50 rounded-full animate-pulse"></div>
                 <div className="absolute top-[40%] right-[30%] w-6 h-6 bg-red-500/50 rounded-full animate-pulse"></div>
              </div>
              
              <div className="absolute bottom-4 left-4 bg-black/80 p-2 border border-slate-700 text-xs">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"/> Informational</div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"/> Critical</div>
              </div>
            </div>

            {/* OPERATIONS TABLE */}
            <div className="bg-slate-900/30 border border-slate-800 p-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Execution Log (Actuator B7)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="py-2">ID</th>
                      <th>PLATFORM</th>
                      <th>STATUS</th>
                      <th>SPEND</th>
                      <th>ROAS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.operations.execution.map((exec) => (
                      <tr key={exec.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 font-mono text-blue-400">{exec.id}</td>
                        <td>{exec.platform}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${
                            exec.status === 'ACTIVE' ? 'border-emerald-900 text-emerald-500 bg-emerald-900/20' : 'border-slate-700 text-slate-500'
                          }`}>
                            {exec.status}
                          </span>
                        </td>
                        <td>${exec.spend}</td>
                        <td className={exec.roas > 2 ? 'text-emerald-400' : 'text-amber-400'}>{exec.roas}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: INTELLIGENCE FEED (4 cols) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col h-full">
            <div className="bg-slate-900/30 border border-slate-800 flex-1 p-4 flex flex-col">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex justify-between">
                <span>Intelligence Feed</span>
                <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">B4/B8 LINKED</span>
              </h2>
              
              <div className="space-y-3 overflow-y-auto flex-1 pr-2 max-h-[600px] scrollbar-thin scrollbar-thumb-slate-700">
                {data.radar.market_intelligence.map((item) => (
                  <div key={item.id} className="p-3 border-l-2 border-slate-700 bg-slate-900/50 hover:bg-slate-800 hover:border-blue-500 transition-all cursor-default group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] text-slate-500 uppercase">{item.source}</span>
                      <span className="text-[10px] text-slate-600">{new Date(item.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 group-hover:text-white mb-2">{item.topic}</p>
                    <div className="flex items-center gap-2">
                       <span className={`w-1.5 h-1.5 rounded-full ${
                         item.sentiment === 'positive' ? 'bg-emerald-500' : 
                         item.sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-500'
                       }`} />
                       <span className="text-[10px] text-slate-500 uppercase">{item.sentiment}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;