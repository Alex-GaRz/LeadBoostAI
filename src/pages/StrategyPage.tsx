import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchOpportunities, fetchCampaignBlueprint, Opportunity } from '../services/bffService';
import { CampaignBlueprint } from '../types/blueprint';
import { 
    CheckCircle2, AlertOctagon, BrainCircuit, Target, 
    Zap, HelpCircle, Eye, ShieldCheck, TrendingUp 
} from 'lucide-react';

// --- COMPONENTES UI ---

const QualityScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    // Protección contra valores nulos
    const safeScore = score || 0;
    let color = 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
    if (safeScore < 80) color = 'text-amber-400 border-amber-500/30 bg-amber-950/20';
    if (safeScore < 60) color = 'text-rose-400 border-rose-500/30 bg-rose-950/20';

    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-lg border ${color}`}>
            <span className="text-3xl font-black tracking-tighter">{safeScore}</span>
            <span className="text-[9px] uppercase tracking-widest opacity-80">Quality Score</span>
        </div>
    );
};

const ExplanationCard: React.FC<{ title: string; content: string; icon: React.ReactNode }> = ({ title, content, icon }) => (
    <div className="bg-slate-900/40 p-3 rounded border border-slate-800/60 mb-3">
        <div className="flex items-center gap-2 mb-1 text-slate-400">
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{title}</span>
        </div>
        <p className="text-xs text-slate-300 font-light leading-relaxed border-l-2 border-blue-500/30 pl-2">
            {content || "Análisis no disponible."}
        </p>
    </div>
);

const InstagramPostMockup: React.FC<{ blueprint: CampaignBlueprint | null; isLoading: boolean }> = ({ blueprint, isLoading }) => {
    if (isLoading || !blueprint) return <div className="h-96 flex items-center justify-center text-slate-600 text-xs animate-pulse">Generando vista previa...</div>;

    return (
        <div className="bg-black border border-slate-800 rounded-xl overflow-hidden max-w-sm mx-auto shadow-2xl">
            <div className="p-3 bg-[#0d0d0d] flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-tr from-yellow-400 to-purple-600 rounded-full" />
                <span className="text-xs font-bold text-white">LeadBoost_Official</span>
            </div>
            <div className="aspect-square bg-slate-900 relative flex items-center justify-center overflow-hidden">
                 {blueprint.visual_asset?.url ? (
                    <img src={blueprint.visual_asset.url} className="w-full h-full object-cover" alt="Ad" />
                 ) : (
                    <span className="text-xs text-slate-600">Imagen no disponible</span>
                 )}
            </div>
            <div className="p-3 bg-[#111111]">
                <div className="mb-2">
                    <span className="font-bold text-sm text-white mr-2">LeadBoost_Official</span>
                    <span className="text-sm text-slate-300 font-light">{blueprint.ad_copy?.body || "..."}</span>
                </div>
                <div className="text-[10px] text-blue-400 font-mono uppercase border border-blue-900/30 inline-block px-1 rounded">
                    {blueprint.ad_copy?.headline || "Headline"}
                </div>
            </div>
        </div>
    );
};

// --- PÁGINA PRINCIPAL ---

const StrategyPage: React.FC = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<CampaignBlueprint | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [execStatus, setExecStatus] = useState<'IDLE'|'PROCESSING'|'SENT'>('IDLE');

  useEffect(() => {
    if (user) fetchOpportunities().then(setOpportunities).finally(() => setLoadingList(false));
  }, [user]);

  useEffect(() => {
    if (selectedId) {
        setLoading(true);
        setBlueprint(null); 
        // Llamada normal (forceRegenerate = false por defecto)
        fetchCampaignBlueprint(selectedId).then(setBlueprint).finally(() => setLoading(false));
    }
  }, [selectedId]);

  const handleExecute = async () => {
     setExecStatus('PROCESSING');
     await new Promise(r => setTimeout(r, 1500));
     setExecStatus('SENT');
  };

  const handleRegenerate = async () => {
     if(!selectedId) return;
     setLoading(true);
     // Aquí SÍ pasamos 'true' para forzar a OpenAI
     fetchCampaignBlueprint(selectedId, true).then(setBlueprint).finally(() => setLoading(false));
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-200 font-mono overflow-hidden">
        
        {/* COLUMNA 1: SEÑALES */}
        <div className="w-64 border-r border-slate-900 bg-[#080808] flex flex-col">
            <div className="p-4 border-b border-slate-900"><h2 className="text-xs font-bold text-slate-500 uppercase">Señales Detectadas</h2></div>
            <div className="flex-1 overflow-y-auto">
                {loadingList ? (
                     <div className="p-4 text-xs text-slate-600 animate-pulse">Cargando señales...</div>
                ) : opportunities.map(op => (
                    <div key={op.id} onClick={() => setSelectedId(op.id)} className={`p-4 border-b border-slate-900 cursor-pointer hover:bg-slate-900/50 ${selectedId === op.id ? 'bg-blue-900/10 border-l-2 border-l-blue-500' : ''}`}>
                        <div className="text-[10px] text-amber-500 font-bold mb-1">{op.severity}</div>
                        <div className="text-xs font-bold text-slate-300">{op.title}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA 2: VISUALIZACIÓN & SCORE */}
        <div className="flex-1 flex flex-col md:flex-row min-w-0">
            
            {/* AREA VISUAL (Centro) */}
            <div className="flex-1 bg-[#0a0a0a] p-6 flex flex-col border-r border-slate-900 overflow-y-auto">
                {!blueprint ? (
                    <div className="m-auto text-slate-600 text-xs flex flex-col items-center gap-2">
                        {loading ? <span className="animate-pulse">CONECTANDO CON CEREBRO...</span> : "SELECCIONA UNA ESTRATEGIA"}
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-lg font-bold text-white mb-1">Blueprint Operativo</h1>
                                <div className="flex gap-2 text-[10px] text-slate-400">
                                    <span className="bg-slate-900 px-2 py-0.5 rounded text-blue-400">ID: {blueprint.strategy_id}</span>
                                    <span className="bg-slate-900 px-2 py-0.5 rounded text-emerald-400">{blueprint.status}</span>
                                </div>
                            </div>
                            <QualityScoreBadge score={blueprint.quality_score} />
                        </div>

                        {/* PREVIEW */}
                        <div className="flex-1 flex items-center justify-center mb-6">
                            <InstagramPostMockup blueprint={blueprint} isLoading={loading} />
                        </div>

                        {/* FINANCIALS MINI */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-900/30 p-4 rounded border border-slate-800">
                             <div>
                                <div className="text-[10px] text-slate-500 uppercase">ROI Esperado</div>
                                <div className="text-xl font-bold text-emerald-400">{blueprint.financials?.expected_roi || 0}x</div>
                             </div>
                             <div>
                                <div className="text-[10px] text-slate-500 uppercase">Presupuesto</div>
                                <div className="text-xl font-bold text-white">${blueprint.financials?.budget || 0}</div>
                             </div>
                        </div>
                    </>
                )}
            </div>

            {/* AREA EXPLICATIVA (Panel Lateral Derecho - "The Why") */}
            {blueprint && !loading && (
                <div className="w-80 bg-[#080808] border-l border-slate-900 flex flex-col h-full">
                    <div className="p-4 border-b border-slate-900 bg-[#050505]">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <BrainCircuit size={14} /> Lógica del Sistema
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
                        
                        {/* 1. BRAND & TRENDS - AQUÍ ESTABA EL ERROR */}
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">Contexto Estratégico</div>
                            <div className="text-xs text-slate-300 mb-2 italic">"{blueprint.brand_context || 'N/A'}"</div>
                            <div className="flex flex-wrap gap-1">
                                {(blueprint.trend_signals || []).map((t, i) => (
                                    <span key={i} className="text-[9px] bg-purple-900/20 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <TrendingUp size={8}/> {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 2. EXPLICACIONES */}
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-3 border-t border-slate-900 pt-3">Justificación de IA</div>
                            <ExplanationCard 
                                title="¿Por qué esta imagen?" 
                                content={blueprint.explanations?.why_image} 
                                icon={<Eye size={12}/>} 
                            />
                            <ExplanationCard 
                                title="¿Por qué este texto?" 
                                content={blueprint.explanations?.why_text} 
                                icon={<HelpCircle size={12}/>} 
                            />
                            <ExplanationCard 
                                title="¿Por qué esta audiencia?" 
                                content={blueprint.explanations?.why_segmentation} 
                                icon={<Target size={12}/>} 
                            />
                        </div>

                        {/* 3. SEGMENTACIÓN DETALLADA */}
                        <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2 border-t border-slate-900 pt-3">Deep Segmentation</div>
                            <div className="bg-slate-900/20 p-2 rounded text-xs space-y-2">
                                <div><span className="text-slate-500 block text-[9px]">Persona</span>{blueprint.segmentation?.persona || 'N/A'}</div>
                                <div><span className="text-slate-500 block text-[9px]">Demografía</span>{blueprint.segmentation?.demographics || 'N/A'}</div>
                                <div>
                                    <span className="text-slate-500 block text-[9px] mb-1">Intereses</span>
                                    <div className="flex flex-wrap gap-1">
                                        {(blueprint.segmentation?.interests || []).map((i, idx) => (
                                            <span key={idx} className="bg-slate-800 text-slate-300 px-1 rounded text-[9px]">{i}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="p-4 border-t border-slate-900 bg-[#050505] space-y-2">
                        <button 
                            onClick={handleRegenerate}
                            className="w-full py-2 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold uppercase rounded-sm flex justify-center items-center gap-2 transition-colors"
                        >
                            <Zap size={12} /> Regenerar Estrategia
                        </button>
                        <button 
                            onClick={handleExecute}
                            disabled={execStatus !== 'IDLE'}
                            className={`w-full py-3 text-xs font-bold uppercase rounded-sm flex justify-center items-center gap-2 transition-all
                                ${execStatus === 'SENT' ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}
                            `}
                        >
                            {execStatus === 'SENT' ? <><CheckCircle2 size={14}/> Aprobado</> : <><ShieldCheck size={14}/> Aprobar Ejecución</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default StrategyPage;