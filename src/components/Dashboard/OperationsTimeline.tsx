import React, { useEffect, useState } from 'react';
import { Card, Title } from '@tremor/react';
import { Radio, Search, BrainCircuit, Crosshair, ShieldCheck, Flag, CheckCircle2 } from 'lucide-react';
import { socketService } from '../../services/socketService';

type StageStatus = 'IDLE' | 'PROCESSING' | 'COMPLETE' | 'ERROR';

interface Stage {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: StageStatus;
  meta?: string;
}

const OperationsTimeline: React.FC = () => {
  // AHORA SON 6 PASOS SEGÚN FASE 22
  const [stages, setStages] = useState<Stage[]>([
    { id: 'radar', label: 'RADAR', icon: <Radio size={14}/>, status: 'COMPLETE', meta: 'Scanning...' },
    { id: 'analyst', label: 'ANALYST', icon: <Search size={14}/>, status: 'IDLE', meta: 'Pending' },
    { id: 'advisor', label: 'ADVISOR', icon: <BrainCircuit size={14}/>, status: 'IDLE', meta: 'Locked' },
    { id: 'actuator', label: 'ACTUATOR', icon: <Crosshair size={14}/>, status: 'IDLE', meta: 'Locked' },
    { id: 'quality', label: 'QUALITY', icon: <ShieldCheck size={14}/>, status: 'IDLE', meta: 'Locked' },
    { id: 'result', label: 'REPORT', icon: <Flag size={14}/>, status: 'IDLE', meta: 'Locked' },
  ]);

  useEffect(() => {
    const unsubscribe = socketService.subscribe((msg: any) => {
        if (msg.type === 'SYSTEM_EVENT') {
            const { source, status, meta } = msg.payload;
            updateStage(source, status, meta);
        }
    });
    return unsubscribe;
  }, []);

  const updateStage = (stageId: string, newStatus: StageStatus, newMeta?: string) => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        return { ...stage, status: newStatus, meta: newMeta || stage.meta };
      }
      return stage;
    }));
  };

  const getStatusColor = (status: StageStatus) => {
    switch(status) {
        case 'PROCESSING': return 'text-amber-400 border-amber-400/50 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]';
        case 'COMPLETE': return 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10';
        case 'ERROR': return 'text-rose-500 border-rose-500/50 bg-rose-500/10';
        default: return 'text-slate-700 border-slate-800 bg-slate-900/50';
    }
  };

  return (
    <Card className="bg-[#09090b] border border-slate-800 rounded-sm p-5 mb-6 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <Title className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
           Live Operations Chain
        </Title>
        <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded border border-slate-800/50">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
            </span>
            <span className="text-[9px] text-blue-400 font-mono tracking-wider">SYNCED</span>
        </div>
      </div>

      <div className="relative flex items-center justify-between mt-2 px-2 lg:px-6">
        {/* Línea conectora */}
        <div className="absolute left-0 top-[18px] w-full px-8 lg:px-12">
             <div className="h-[1px] w-full bg-slate-800/60" />
        </div>
        
        {stages.map((stage, index) => {
          const isFirst = index === 0;
          const isLast = index === stages.length - 1;
          
          let textAlignmentClass = "items-center text-center";
          if (isFirst) textAlignmentClass = "items-start text-left";
          if (isLast) textAlignmentClass = "items-end text-right";

          return (
            <div key={stage.id} className={`relative z-10 flex flex-col ${textAlignmentClass} group`}>
              <div className={`
                  w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-500 bg-[#09090b]
                  ${getStatusColor(stage.status)}
                  ${stage.status === 'PROCESSING' ? 'animate-pulse ring-2 ring-amber-500/20' : ''}
              `}>
                {stage.status === 'COMPLETE' ? <CheckCircle2 size={14}/> : stage.icon}
              </div>
              
              <div className={`absolute top-10 flex flex-col w-24 ${textAlignmentClass}`}>
                  <span className={`text-[8px] font-bold font-mono tracking-widest transition-colors uppercase ${
                      stage.status === 'IDLE' ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                      {stage.label}
                  </span>
                  <span className={`text-[8px] font-mono mt-0.5 truncate max-w-full ${
                      stage.status === 'PROCESSING' ? 'text-amber-500 animate-pulse' : 'text-slate-600'
                  }`}>
                      {stage.meta}
                  </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="h-8" />
    </Card>
  );
};

export default OperationsTimeline;