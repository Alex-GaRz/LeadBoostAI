import React, { useEffect, useState } from 'react';
import { ShieldCheck, Terminal, Cpu, Database, Radio } from 'lucide-react';

interface BootStep {
  text: string;
  delay: number;
  icon?: React.ReactNode;
}

const BOOT_SEQUENCE: BootStep[] = [
  { text: "INITIALIZING KERNEL...", delay: 200, icon: <Terminal size={14}/> },
  { text: "ESTABLISHING SECURE UPLINK (TLS 1.3)...", delay: 800, icon: <Radio size={14}/> },
  { text: "SYNCHRONIZING COLD STORAGE...", delay: 1400, icon: <Database size={14}/> },
  { text: "LOADING NEURAL WEIGHTS (B12)...", delay: 2100, icon: <Cpu size={14}/> },
  { text: "VERIFYING INTEGRITY LOCKS...", delay: 2800, icon: <ShieldCheck size={14}/> },
  { text: "SYSTEM READY. WELCOME, COMMANDER.", delay: 3200, icon: <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"/> }
];

interface Props {
  onComplete: () => void;
}

const SystemBoot: React.FC<Props> = ({ onComplete }) => {
  const [logs, setLogs] = useState<BootStep[]>([]);
  
  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    BOOT_SEQUENCE.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setLogs(prev => [...prev, step]);
        if (index === BOOT_SEQUENCE.length - 1) {
          setTimeout(onComplete, 800); // Small pause after final message
        }
      }, step.delay);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center font-mono text-xs cursor-wait">
      <div className="w-full max-w-md p-6">
        <div className="mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
            <span className="text-slate-500">BOOT_SEQ_V22.0</span>
            <span className="text-emerald-500 animate-pulse">● LIVE</span>
        </div>
        
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-300 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-slate-600 w-4">{log.icon}</span>
              <span className="tracking-wider">{log.text}</span>
              {i === logs.length - 1 && i !== BOOT_SEQUENCE.length - 1 && (
                 <span className="w-2 h-4 bg-emerald-500 animate-pulse inline-block ml-1 align-middle"/>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 h-1 w-full bg-slate-900 overflow-hidden">
            <div 
                className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${(logs.length / BOOT_SEQUENCE.length) * 100}%` }}
            />
        </div>
      </div>
    </div>
  );
};

export default SystemBoot;
