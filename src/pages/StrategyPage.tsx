// src/pages/StrategyPage.tsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchOpportunities, fetchStrategyDetail, executeAction, Opportunity, StrategyDetail } from '../services/bffService';

const StrategyPage: React.FC = () => {
  const { user } = useAuth();
  
  // Estados
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [strategyDetail, setStrategyDetail] = useState<StrategyDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Carga inicial de la lista
  useEffect(() => {
    if (user) {
      fetchOpportunities().then(setOpportunities).finally(() => setLoadingList(false));
    }
  }, [user]);

  // Carga del detalle al seleccionar
  useEffect(() => {
    if (selectedId) {
      setLoadingDetail(true);
      fetchStrategyDetail(selectedId).then(setStrategyDetail).finally(() => setLoadingDetail(false));
    } else {
      setStrategyDetail(null);
    }
  }, [selectedId]);

  const handleExecute = async () => {
    if (!selectedId) return;
    setProcessingAction(true);
    await executeAction(selectedId);
    alert("ORDER DISPATCHED TO ACTUATOR ENGINE (B7)");
    setProcessingAction(false);
    // Aquí idealmente recargaríamos la lista o marcaríamos como ejecutado
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-mono flex pt-16 h-screen overflow-hidden">
      
      {/* LEFT COLUMN: OPPORTUNITY LIST (MASTER) */}
      <div className="w-1/3 border-r border-slate-800 bg-slate-900/20 flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-[#050505]">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"/>
            Tactical Alerts (B4)
          </h2>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {loadingList ? (
            <div className="p-4 text-xs text-slate-500 animate-pulse">SCANNING_HORIZON...</div>
          ) : (
            opportunities.map(op => (
              <div 
                key={op.id}
                onClick={() => setSelectedId(op.id)}
                className={`p-4 border-b border-slate-800 cursor-pointer transition-all hover:bg-slate-800/40 relative
                  ${selectedId === op.id ? 'bg-blue-900/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
                `}
              >
                <div className="flex justify-between mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    op.severity === 'CRITICAL' ? 'bg-red-900/30 text-red-500' : 'bg-amber-900/30 text-amber-500'
                  }`}>
                    {op.severity}
                  </span>
                  <span className="text-[10px] text-slate-600">{new Date(op.detected_at).toLocaleTimeString()}</span>
                </div>
                <h3 className="text-sm text-slate-200 font-bold mb-1">{op.title}</h3>
                <div className="flex justify-between items-end">
                   <span className="text-[10px] text-slate-500 uppercase">{op.source}</span>
                   <span className="text-[10px] text-slate-400">{op.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: STRATEGY ROOM (DETAIL) */}
      <div className="w-2/3 bg-[#080808] flex flex-col relative">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center text-slate-700 flex-col">
            <div className="text-6xl mb-4 opacity-20">⬡</div>
            <p className="text-xs tracking-widest">SELECT A SIGNAL TO INITIATE STRATEGY PROTOCOLS</p>
          </div>
        ) : loadingDetail || !strategyDetail ? (
          <div className="flex-1 flex items-center justify-center text-blue-500 animate-pulse text-xs">
            loading_advisor_intelligence...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* HEADER */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{opportunities.find(o => o.id === selectedId)?.title}</h1>
                <p className="text-sm text-slate-500">{strategyDetail.analysis.summary}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">STRATEGY ID</div>
                <div className="font-mono text-blue-400">{strategyDetail.id}</div>
              </div>
            </div>

            {/* AI ROUNDTABLE (BLOCK 5) */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                // Advisor Roundtable Protocol (B5)
              </h3>
              <div className="grid gap-3">
                {strategyDetail.analysis.ai_debate.map((msg, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-900/40 border border-slate-800/50 rounded-sm">
                    <div className="w-24 flex-shrink-0">
                      <div className="text-xs font-bold text-slate-300">{msg.agent}</div>
                      <div className={`text-[10px] uppercase mt-1 ${
                        msg.sentiment === 'aggressive' ? 'text-red-400' : msg.sentiment === 'cautious' ? 'text-amber-400' : 'text-blue-400'
                      }`}>
                        {msg.sentiment}
                      </div>
                    </div>
                    <div className="text-sm text-slate-400 font-light border-l border-slate-700 pl-4">
                      "{msg.message}"
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GOVERNANCE CHECK (BLOCK 6) */}
            <div className="p-6 bg-slate-900/20 border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                   // Enterprise Governance (B6)
                 </h3>
                 <div className={`flex items-center gap-2 px-3 py-1 border ${
                   strategyDetail.governance.status === 'APPROVED' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                   strategyDetail.governance.status === 'REJECTED' ? 'border-rose-500 text-rose-500 bg-rose-500/10' :
                   'border-amber-500 text-amber-500 bg-amber-500/10'
                 }`}>
                   <span className="w-2 h-2 rounded-full bg-current animate-pulse"/>
                   <span className="text-xs font-bold">{strategyDetail.governance.status}</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {strategyDetail.governance.checks.map((check, idx) => (
                  <div key={idx} className="bg-black/40 p-3 border border-slate-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-slate-500 uppercase">{check.rule}</span>
                      <span className={check.passed ? 'text-emerald-500' : 'text-rose-500'}>
                        {check.passed ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">{check.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION PROPOSAL (BLOCK 7 PREVIEW) */}
            <div className="p-6 border border-blue-900/30 bg-blue-900/5 mt-4">
               <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">
                 // Recommended Execution (B7)
               </h3>
               <div className="grid grid-cols-2 gap-8 text-sm">
                 <div>
                   <span className="text-slate-600 block text-xs mb-1">ACTION TYPE</span>
                   <span className="text-white font-mono">{strategyDetail.proposal.action_type}</span>
                 </div>
                 <div>
                   <span className="text-slate-600 block text-xs mb-1">ESTIMATED COST</span>
                   <span className="text-white font-mono">${strategyDetail.proposal.estimated_cost}</span>
                 </div>
                 <div className="col-span-2">
                   <span className="text-slate-600 block text-xs mb-1">PARAMETERS</span>
                   <code className="text-xs text-blue-300 font-mono">
                     {JSON.stringify(strategyDetail.proposal.parameters)}
                   </code>
                 </div>
               </div>
            </div>

            {/* CONTROL DECK */}
            <div className="h-24" /> {/* Spacer */}
            
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        {selectedId && strategyDetail && (
          <div className="absolute bottom-0 w-full bg-[#0a0a0a] border-t border-slate-800 p-4 flex justify-end gap-4">
            <button className="px-6 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-mono tracking-widest transition-all">
              DISCARD SIGNAL
            </button>
            <button 
              onClick={handleExecute}
              disabled={processingAction}
              className={`px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold tracking-widest transition-all flex items-center gap-2 ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {processingAction ? 'TRANSMITTING...' : 'AUTHORIZE EXECUTION [ENTER]'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyPage;