import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  fetchOpportunities, 
  fetchStrategyDetail, 
  executeAction, 
  runSimulation, // Nuevo import
  Opportunity, 
  StrategyDetail,
  MonteCarloSimulationResult // Nuevo import
} from '../services/bffService';
import { CheckCircle2, AlertOctagon, TrendingUp, ShieldCheck, BrainCircuit, BarChart3 } from 'lucide-react';

// Componente para el gráfico de probabilidad (usando Tremor si está disponible o mock simple)
const ProbabilityChart: React.FC<{ data: MonteCarloSimulationResult['probability_distribution'] | null; roi: number }> = ({ data, roi }) => {
  if (!data) return <div className="text-xs text-slate-700 italic">Simulación no disponible.</div>;

  const chartData = [
    { range: '1x', 'Probabilidad': data.range_1x * 100 },
    { range: '2x', 'Probabilidad': data.range_2x * 100 },
    { range: '3x', 'Probabilidad': data.range_3x * 100 },
    { range: '4x+', 'Probabilidad': data.range_4x * 100 },
  ];

  const totalProb = chartData.reduce((sum, item) => sum + item['Probabilidad'], 0);
  const successProb = chartData.slice(1).reduce((sum, item) => sum + item['Probabilidad'], 0); // ROI > 2x

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {chartData.map((item) => (
          <div key={item.range} className="flex flex-col items-center p-2 bg-slate-900/50 rounded-sm">
            <span className={`text-lg font-bold ${item.range === '4x+' ? 'text-emerald-400' : 'text-slate-200'}`}>
              {Math.round(item['Probabilidad'])}%
            </span>
            <span className="text-[10px] text-slate-500 uppercase">ROI {item.range}</span>
          </div>
        ))}
      </div>
      <div className="text-sm font-bold text-slate-300">
         ROI Proyectado: <span className="text-blue-400 text-lg">${roi.toFixed(2)}</span>
      </div>
      <div className="text-xs text-slate-400 border-t border-slate-900 pt-3">
         <span className={`font-bold ${successProb > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
           {Math.round(successProb)}% de probabilidad
         </span> de retorno significativo (&gt; 2.0x).
      </div>
    </div>
  );
};


const StrategyPage: React.FC = () => {
  const { user } = useAuth();
  
  // Estados
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [strategyDetail, setStrategyDetail] = useState<StrategyDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Estado para la MISIÓN 3: Optimistic UI
  const [executionStatus, setExecutionStatus] = useState<'IDLE' | 'PROCESSING' | 'SENT'>('IDLE');

  // Estados para la MISIÓN 2: Proyección Monte Carlo
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloSimulationResult | null>(null);
  const [loadingMonteCarlo, setLoadingMonteCarlo] = useState(false);

  // Carga inicial
  useEffect(() => {
    if (user) {
      fetchOpportunities().then(setOpportunities).finally(() => setLoadingList(false));
    }
  }, [user]);

  // Carga del detalle y activación de Monte Carlo
  useEffect(() => {
    if (selectedId) {
      setLoadingDetail(true);
      setExecutionStatus('IDLE'); // Reset status al cambiar de señal
      setMonteCarloResult(null); // Reset resultado MC
      
      fetchStrategyDetail(selectedId).then(detail => {
        setStrategyDetail(detail);
        setLoadingDetail(false);
        
        // --- ACTIVACIÓN MONTE CARLO (MISIÓN 2) ---
        // Buscamos la oportunidad para obtener los parámetros necesarios (mockeados en bffService.ts)
        const selectedOpportunity = opportunities.find(op => op.id === selectedId);
        
        if (selectedOpportunity && detail.proposal.action_type) {
            setLoadingMonteCarlo(true);
            runSimulation(
                detail.proposal.action_type, 
                selectedOpportunity.target_sku || 'PROD-001', // Usamos el mock si no existe
                150 // Mock de inventario actual
            ).then(setMonteCarloResult).finally(() => setLoadingMonteCarlo(false));
        }

      }).catch(e => {
          console.error("Fallo al cargar detalle:", e);
          setLoadingDetail(false);
      });

    } else {
      setStrategyDetail(null);
    }
  }, [selectedId, opportunities]); // Dependencia de opportunities es crucial

  const handleExecute = async () => {
    if (!selectedId) return;
    
    // MISIÓN 3: UI Optimista Inmediata
    setExecutionStatus('PROCESSING');
    
    try {
      // Simulación de delay de red para realismo, pero la UI ya respondió
      await executeAction(selectedId);
      setTimeout(() => {
        setExecutionStatus('SENT');
      }, 800);
    } catch (e) {
      alert("Error en transmisión a B7");
      setExecutionStatus('IDLE');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-mono flex h-screen overflow-hidden">
      
      {/* COLUMNA IZQUIERDA: LISTA DE OPORTUNIDADES */}
      <div className="w-1/3 border-r border-slate-900 bg-slate-950/30 flex flex-col">
        <div className="p-4 border-b border-slate-900 bg-[#050505] pt-6">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"/>
            Oportunidades Detectadas (B4)
          </h2>
        </div>
        
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          {loadingList ? (
            <div className="p-6 text-xs text-slate-500 animate-pulse">ESCANEANDO MERCADO...</div>
          ) : (
            opportunities.map(op => (
              <div 
                key={op.id}
                onClick={() => setSelectedId(op.id)}
                className={`p-5 border-b border-slate-900 cursor-pointer transition-all hover:bg-slate-900/60 relative group
                  ${selectedId === op.id ? 'bg-blue-900/10 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}
                `}
              >
                <div className="flex justify-between mb-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                    op.severity === 'CRITICAL' ? 'bg-rose-900/30 text-rose-500' : 'bg-amber-900/30 text-amber-500'
                  }`}>
                    {op.severity === 'CRITICAL' ? 'ALTA PRIORIDAD' : 'OPORTUNIDAD'}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">{new Date(op.detected_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <h3 className="text-sm text-slate-200 font-bold mb-2 leading-tight group-hover:text-blue-400 transition-colors">{op.title}</h3>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase">
                      <TrendingUp size={12} />
                      {op.source}
                   </div>
                   <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1 rounded">{op.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUMNA DERECHA: SALA DE ESTRATEGIA (DETALLE) */}
      <div className="w-2/3 bg-[#080808] flex flex-col relative">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-slate-700 flex-col opacity-50">
            <div className="text-6xl mb-6 font-thin">⬡</div>
            <p className="text-xs tracking-[0.2em] uppercase">Selecciona una señal para iniciar análisis</p>
          </div>
        ) : loadingDetail || !strategyDetail ? (
          <div className="flex-1 flex items-center justify-center text-blue-500 animate-pulse text-xs font-mono">
            CONSULTANDO CONSEJO DE ADMINISTRACIÓN AI (B5)...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
            
            {/* ENCABEZADO ESTRATÉGICO */}
            <div className="flex justify-between items-start border-b border-slate-900 pb-6">
              <div className="max-w-2xl">
                <h1 className="text-xl font-bold text-white mb-3 leading-snug">
                  {opportunities.find(o => o.id === selectedId)?.title}
                </h1>
                <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-slate-700 pl-4">
                  {strategyDetail.analysis.summary}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-600 mb-1 uppercase tracking-wider">Strategy ID</div>
                <div className="font-mono text-blue-500 text-xs">{strategyDetail.id}</div>
              </div>
            </div>

            {/* MESA REDONDA AI (HUMANIZADA) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <BrainCircuit size={14} /> Análisis de Expertos (B5)
              </h3>
              <div className="grid gap-3">
                {strategyDetail.analysis.ai_debate.map((msg, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-900/30 border border-slate-800/50 rounded-sm hover:border-slate-700 transition-colors">
                    <div className="w-28 flex-shrink-0">
                      <div className="text-xs font-bold text-slate-300">{msg.agent}</div>
                      <div className={`text-[9px] uppercase mt-1 font-bold ${
                        msg.sentiment === 'aggressive' ? 'text-rose-400' : msg.sentiment === 'cautious' ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {msg.sentiment === 'aggressive' ? 'AGRESIVO' : msg.sentiment === 'cautious' ? 'PRUDENTE' : 'ANALÍTICO'}
                      </div>
                    </div>
                    <div className="text-sm text-slate-400 font-light leading-relaxed">
                      "{msg.message}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* PROYECCIÓN MONTE CARLO (MISIÓN 2) */}
            <div className="p-6 bg-slate-900/10 border border-emerald-900/20 rounded-sm space-y-4">
               <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                 <BarChart3 size={14} /> 🔮 PROYECCIÓN MONTE CARLO (B12)
               </h3>
               {loadingMonteCarlo ? (
                 <div className="text-xs text-emerald-500/80 animate-pulse font-mono">
                   EJECUTANDO 500 ITERACIONES DE SIMULACIÓN...
                 </div>
               ) : monteCarloResult ? (
                 <>
                   <ProbabilityChart 
                      data={monteCarloResult.probability_distribution} 
                      roi={monteCarloResult.projected_roi}
                   />
                   <div className="text-xs text-slate-400 mt-4 font-light border-t border-slate-900 pt-3">
                     <strong className="text-white">Justificación B12:</strong> {monteCarloResult.justification}
                   </div>
                 </>
               ) : (
                 <div className="text-xs text-slate-500 italic">No se pudo obtener la proyección. Motor inactivo.</div>
               )}
            </div>

            {/* GOBERNANZA (MISIÓN 3: Texto Explicativo) */}
            <div className="p-6 bg-slate-900/10 border border-slate-800 rounded-sm">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck size={14} /> Validación de Gobernanza (B6)
                 </h3>
                 <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm ${
                   strategyDetail.governance.status === 'APPROVED' ? 'border-emerald-900/50 text-emerald-400 bg-emerald-950/20' :
                   'border-rose-900/50 text-rose-400 bg-rose-950/20'
                 }`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${strategyDetail.governance.status === 'APPROVED' ? 'bg-emerald-400' : 'bg-rose-400'}`}/>
                   <span className="text-xs font-bold tracking-wide">
                     {strategyDetail.governance.status === 'APPROVED' ? 'APROBADO PARA EJECUCIÓN' : 'BLOQUEO DE SEGURIDAD'}
                   </span>
                 </div>
              </div>
              
              {/* Texto explicativo de seguridad (Misión 3) */}
              {strategyDetail.governance.status === 'APPROVED' && (
                <div className="mb-6 text-xs text-emerald-500/80 bg-emerald-950/10 p-3 border-l-2 border-emerald-500/50">
                  ✅ <strong>Aprobación Segura:</strong> Esta estrategia se encuentra dentro de los márgenes de seguridad financiera y operativa. No se detectan riesgos críticos de inventario.
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {strategyDetail.governance.checks.map((check, idx) => (
                  <div key={idx} className="bg-black/40 p-3 border border-slate-800 rounded-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">{check.rule}</span>
                      {check.passed ? <CheckCircle2 size={12} className="text-emerald-500" /> : <AlertOctagon size={12} className="text-rose-500" />}
                    </div>
                    <div className="text-xs text-slate-300 font-mono">{check.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PROPUESTA DE ACCIÓN */}
            <div className="p-6 border border-blue-900/20 bg-blue-950/5 rounded-sm mt-4 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
               <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">
                 // Plan de Ejecución (B7)
               </h3>
               <div className="grid grid-cols-2 gap-8 text-sm">
                 <div>
                   <span className="text-slate-600 block text-[10px] uppercase mb-1 tracking-wider">Tipo de Acción</span>
                   <span className="text-white font-mono">{strategyDetail.proposal.action_type}</span>
                 </div>
                 <div>
                   <span className="text-slate-600 block text-[10px] uppercase mb-1 tracking-wider">Inversión Estimada</span>
                   <span className="text-white font-mono text-lg">${strategyDetail.proposal.estimated_cost}</span>
                 </div>
                 <div className="col-span-2">
                   <span className="text-slate-600 block text-[10px] uppercase mb-1 tracking-wider">Parámetros Técnicos</span>
                   <div className="bg-black/50 p-3 rounded border border-blue-900/20 font-mono text-xs text-blue-200/80">
                     {JSON.stringify(strategyDetail.proposal.parameters, null, 2)}
                   </div>
                 </div>
               </div>
            </div>

            <div className="h-24" /> {/* Spacer */}
          </div>
        )}

        {/* BARRA DE ACCIÓN INFERIOR (MISIÓN 3: Optimistic UI) */}
        {selectedId && strategyDetail && (
          <div className="absolute bottom-0 w-full bg-[#0a0a0a] border-t border-slate-900 p-5 flex justify-between items-center z-10">
            <div className="text-xs text-slate-500 font-mono">
              ESTADO DE SALA: <span className="text-slate-300">ESPERANDO ORDEN</span>
            </div>
            
            <div className="flex gap-4">
              <button 
                className="px-6 py-3 border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600 text-xs font-bold tracking-widest uppercase transition-all"
                disabled={executionStatus !== 'IDLE'}
              >
                Descartar
              </button>
              
              <button 
                onClick={handleExecute}
                disabled={executionStatus !== 'IDLE' || strategyDetail.governance.status !== 'APPROVED'}
                className={`
                  px-8 py-3 text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-3
                  ${executionStatus === 'SENT' 
                    ? 'bg-emerald-600 text-white cursor-default shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : executionStatus === 'PROCESSING'
                    ? 'bg-blue-900 text-blue-200 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]'}
                  ${strategyDetail.governance.status !== 'APPROVED' ? 'opacity-50 cursor-not-allowed grayscale' : ''}
                `}
              >
                {executionStatus === 'SENT' ? (
                  <>
                    <CheckCircle2 size={16} />
                    ORDEN ENVIADA A B7
                  </>
                ) : executionStatus === 'PROCESSING' ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    TRANSMITIENDO...
                  </>
                ) : (
                  <>
                    AUTORIZAR EJECUCIÓN
                    <span className="text-blue-200 opacity-50">↵</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyPage;