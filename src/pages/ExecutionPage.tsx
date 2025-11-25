// src/pages/ExecutionPage.tsx

import React, { useEffect, useState } from 'react';
import { fetchDashboardSnapshot } from '../services/bffService';

interface ExecutionLog {
  id: string;
  timestamp: string;
  module: 'B7-ACTUATOR' | 'B8-FEEDBACK' | 'B10-MEMORY' | 'B11-ERP';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  latency: string;
}

// Generador de logs simulados para efecto "Matrix" (mientras conectamos sockets reales)
const generateRandomLog = (): ExecutionLog => {
  const modules = ['B7-ACTUATOR', 'B8-FEEDBACK', 'B10-MEMORY', 'B11-ERP'] as const;
  const levels = ['INFO', 'INFO', 'INFO', 'SUCCESS', 'WARN'] as const;
  const messages = [
    "Syncing campaign metrics from Meta Ads API...",
    "Validating inventory stock for SKU-901...",
    "Optimizing bid cap strategy based on ROAS drift...",
    "Memory snapshot saved successfully.",
    "Latency spike detected in us-east-1 region.",
    "Pipeline B4->B7 completed in 450ms.",
    "Governance check passed. Token: #AF991."
  ];

  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    module: modules[Math.floor(Math.random() * modules.length)],
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    latency: `${Math.floor(Math.random() * 200)}ms`
  };
};

const ExecutionPage: React.FC = () => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Cargar métricas reales del BFF
  useEffect(() => {
    fetchDashboardSnapshot().then(data => setMetrics(data.operations.execution));
  }, []);

  // Simulación de Stream de Logs
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [generateRandomLog(), ...prev].slice(0, 50)); // Mantener últimos 50
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-green-500 font-mono overflow-hidden border-l border-slate-900 relative z-10">
      
      {/* HEADER DE INGENIERÍA */}
      <div className="h-16 border-b border-slate-800 bg-black flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
          <h1 className="text-lg font-bold tracking-widest text-slate-200">ENGINE ROOM // LIVE EXECUTION</h1>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="px-3 py-1 border border-green-900 bg-green-900/20 text-green-400 rounded">
            B7 STATUS: ONLINE
          </div>
          <div className="px-3 py-1 border border-green-900 bg-green-900/20 text-green-400 rounded">
            B8 FEEDBACK: ACTIVE
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: METRICS (Real Data) */}
        <div className="w-1/3 border-r border-slate-800 p-6 overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">// Active Campaigns (B7)</h3>
          
          <div className="space-y-4">
            {metrics?.map((campaign: any) => (
              <div key={campaign.id} className="p-4 border border-slate-800 bg-slate-900/30 hover:border-green-500/50 transition-all">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-slate-400">{campaign.platform}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 border ${campaign.status === 'ACTIVE' ? 'border-green-500 text-green-500' : 'border-amber-500 text-amber-500'}`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="text-sm text-white font-bold mb-3">{campaign.id}</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-600">SPEND</div>
                    <div className="text-slate-300 font-mono">${campaign.spend}</div>
                  </div>
                  <div>
                    <div className="text-slate-600">ROAS</div>
                    <div className={`font-mono ${campaign.roas > 2 ? 'text-green-400' : 'text-amber-400'}`}>
                      {campaign.roas}x
                    </div>
                  </div>
                </div>
                {/* Barra de progreso visual */}
                <div className="w-full h-1 bg-slate-800 mt-3 overflow-hidden">
                  <div className="h-full bg-green-500/50 animate-progress" style={{ width: `${Math.random() * 100}%` }} />
                </div>
              </div>
            )) || <div className="text-slate-600 text-xs">Waiting for telemetry...</div>}
          </div>
        </div>

        {/* COLUMNA DERECHA: TERMINAL LOGS (Simulated Stream) */}
        <div className="w-2/3 bg-black p-6 flex flex-col font-mono text-xs relative">
          <div className="absolute top-4 right-6 flex gap-2">
             <button 
               onClick={() => setAutoScroll(!autoScroll)}
               className={`px-2 py-1 border ${autoScroll ? 'border-green-500 text-green-500' : 'border-slate-700 text-slate-700'}`}
             >
               {autoScroll ? 'AUTO-SCROLL: ON' : 'AUTO-SCROLL: PAUSED'}
             </button>
          </div>

          <h3 className="text-xs font-bold text-slate-600 mb-4 uppercase tracking-widest">// System Stream (B10 Audit)</h3>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 font-mono text-[11px]">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 opacity-90 hover:opacity-100 hover:bg-green-900/10 px-2 py-0.5">
                <span className="text-slate-600">[{log.timestamp.split('T')[1].slice(0,12)}]</span>
                <span className={`w-24 ${
                  log.module === 'B7-ACTUATOR' ? 'text-blue-400' :
                  log.module === 'B11-ERP' ? 'text-amber-400' :
                  log.module === 'B10-MEMORY' ? 'text-purple-400' : 'text-green-400'
                }`}>{log.module}</span>
                <span className={`w-16 ${
                  log.level === 'ERROR' ? 'text-red-500 font-bold' :
                  log.level === 'WARN' ? 'text-amber-500' :
                  log.level === 'SUCCESS' ? 'text-green-400' : 'text-slate-400'
                }`}>{log.level}</span>
                <span className="text-slate-300 flex-1">{log.message}</span>
                <span className="text-slate-700">{log.latency}</span>
              </div>
            ))}
            <div className="animate-pulse text-green-500">_</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionPage;