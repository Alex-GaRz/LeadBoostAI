import React, { useEffect, useState } from 'react';
import { fetchDashboardSnapshot } from '../services/bffService';
import { Terminal, Activity, Zap, BarChart3 } from 'lucide-react';

interface ExecutionLog {
  id: string;
  timestamp: string;
  module: 'B7-ACTUATOR' | 'B8-FEEDBACK' | 'B10-MEMORY' | 'B11-ERP';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  latency: string;
}

const generateRandomLog = (): ExecutionLog => {
  const modules = ['B7-ACTUATOR', 'B8-FEEDBACK', 'B10-MEMORY', 'B11-ERP'] as const;
  const levels = ['INFO', 'INFO', 'INFO', 'SUCCESS', 'WARN'] as const;
  const messages = [
    "Sincronizando métricas de campaña en Meta Ads...",
    "Validando integridad de stock en ERP (SKU-901)...",
    "Ajuste automático de puja por caída de ROAS...",
    "Snapshot de memoria guardado exitosamente.",
    "Latencia detectada en la región us-east-1.",
    "Pipeline B4->B7 completado en 420ms.",
    "Verificación de gobernanza: Token #AF991 válido."
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

  // Carga de métricas reales
  useEffect(() => {
    fetchDashboardSnapshot().then(data => setMetrics(data.operations.execution));
  }, []);

  // Simulación de Logs
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [generateRandomLog(), ...prev].slice(0, 50));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Manejador del botón optimizar (Simulado)
  const handleOptimize = (id: string) => {
    alert(`⚡ COMANDO DE OPTIMIZACIÓN ENVIADO PARA CAMPAÑA: ${id}\nEl sistema Actuador (B7) re-calibrará las pujas en los próximos 30s.`);
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-slate-300 font-mono overflow-hidden border-l border-slate-900 relative z-10 h-screen">
      
      {/* HEADER DE INGENIERÍA */}
      <div className="h-16 border-b border-slate-900 bg-[#020202] flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Activity className="text-green-500 w-5 h-5 animate-pulse" />
          <h1 className="text-lg font-bold tracking-[0.2em] text-slate-100 uppercase">
            Sala de Máquinas <span className="text-slate-600 text-xs normal-case tracking-normal">| Live Execution</span>
          </h1>
        </div>
        <div className="flex gap-4 text-[10px] font-bold tracking-wider">
          <div className="px-3 py-1.5 border border-green-900/50 bg-green-950/20 text-green-400 rounded-sm flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"/> ACTUADOR: ONLINE
          </div>
          <div className="px-3 py-1.5 border border-blue-900/50 bg-blue-950/20 text-blue-400 rounded-sm flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"/> FEEDBACK LOOP: ACTIVO
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: CAMPAÑAS ACTIVAS (MISIÓN 4) */}
        <div className="w-2/5 border-r border-slate-900 p-6 overflow-y-auto bg-slate-950/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={14}/> Operaciones Activas (B7)
            </h3>
            <span className="text-[10px] text-slate-600">{metrics?.length || 0} RUNNING</span>
          </div>
          
          <div className="space-y-4">
            {metrics?.map((campaign: any) => {
              // Lógica de colores ROAS (Misión 4)
              const roasColor = campaign.roas > 2.0 ? 'text-green-400' : campaign.roas < 1.0 ? 'text-rose-500' : 'text-amber-400';
              const roasBorder = campaign.roas > 2.0 ? 'border-green-500/30' : campaign.roas < 1.0 ? 'border-rose-500/30' : 'border-amber-500/30';
              const bgGlow = campaign.roas > 2.0 ? 'shadow-[0_0_10px_rgba(34,197,94,0.05)]' : '';

              return (
                <div key={campaign.id} className={`p-4 border bg-[#080808] transition-all hover:bg-slate-900 group ${roasBorder} ${bgGlow}`}>
                  <div className="flex justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider border border-slate-800 px-1.5 rounded bg-black">
                      {campaign.platform}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 border flex items-center gap-1 ${
                      campaign.status === 'ACTIVE' ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-amber-900 text-amber-500'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}/>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-200 font-bold mb-4 font-mono truncate">
                    {campaign.id}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4 bg-black/40 p-2 rounded border border-slate-800/50">
                    <div>
                      <div className="text-slate-600 text-[9px] uppercase tracking-wider mb-0.5">Inversión</div>
                      <div className="text-slate-300 font-mono">${campaign.spend}</div>
                    </div>
                    <div>
                      <div className="text-slate-600 text-[9px] uppercase tracking-wider mb-0.5">ROAS</div>
                      <div className={`font-mono text-sm font-bold ${roasColor}`}>
                        {campaign.roas}x
                      </div>
                    </div>
                  </div>

                  {/* MISIÓN 4: Botón Optimizar */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOptimize(campaign.id)}
                      className="w-full py-2 bg-slate-900 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/50 text-blue-400 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    >
                      <Zap size={12} className="group-hover:text-yellow-400 transition-colors" />
                      OPTIMIZAR AHORA
                    </button>
                  </div>
                </div>
              );
            }) || <div className="text-slate-600 text-xs italic p-4 text-center border border-dashed border-slate-800">Esperando telemetría del Actuador...</div>}
          </div>
        </div>

        {/* COLUMNA DERECHA: LOGS DE SISTEMA */}
        <div className="w-3/5 bg-black p-6 flex flex-col font-mono text-xs relative">
          <div className="absolute top-4 right-6 flex gap-2 z-10">
             <button 
               onClick={() => setAutoScroll(!autoScroll)}
               className={`px-3 py-1 text-[10px] border font-bold uppercase tracking-wider ${autoScroll ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-slate-800 text-slate-600'}`}
             >
               {autoScroll ? '● AUTO-SCROLL' : '○ PAUSADO'}
             </button>
          </div>

          <h3 className="text-xs font-bold text-slate-600 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Terminal size={14} /> System Audit Stream (B10)
          </h3>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 font-mono text-[11px] pb-4">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-4 border-b border-slate-900/50 py-1 hover:bg-slate-900/30 transition-colors">
                <span className="text-slate-600 w-20 shrink-0">
                  {log.timestamp.split('T')[1].slice(0,12)}
                </span>
                
                <span className={`w-28 shrink-0 font-bold ${
                  log.module === 'B7-ACTUATOR' ? 'text-blue-500' :
                  log.module === 'B11-ERP' ? 'text-amber-500' :
                  log.module === 'B10-MEMORY' ? 'text-purple-500' : 'text-emerald-500'
                }`}>
                  {log.module}
                </span>
                
                <span className={`w-16 shrink-0 ${
                  log.level === 'ERROR' ? 'text-rose-500 font-bold' :
                  log.level === 'WARN' ? 'text-amber-500' :
                  log.level === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-400'
                }`}>
                  {log.level}
                </span>
                
                <span className="text-slate-300 flex-1 truncate">{log.message}</span>
                
                <span className="text-slate-600 w-12 text-right">{log.latency}</span>
              </div>
            ))}
            <div className="h-4" /> {/* Spacer bottom */}
            {autoScroll && <div className="animate-pulse text-green-500 font-bold">_</div>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionPage;