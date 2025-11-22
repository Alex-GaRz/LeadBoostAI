import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface AlertsTickerProps {
  alerts: Alert[];
}

const AlertsTicker: React.FC<AlertsTickerProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 h-10 flex items-center overflow-hidden z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="bg-emerald-900/80 px-4 h-full flex items-center z-10 border-r border-emerald-700">
        <span className="text-xs font-mono font-bold text-emerald-100 uppercase tracking-widest flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          LIVE FEED
        </span>
      </div>
      
      <div className="flex whitespace-nowrap animate-ticker hover:[animation-play-state:paused]">
        {alerts.map((alert) => (
          <div key={alert.id} className="inline-flex items-center mx-8 gap-2">
            {alert.severity === 'HIGH' ? (
              <ExclamationTriangleIcon className="h-4 w-4 text-rose-500" />
            ) : alert.severity === 'MEDIUM' ? (
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            ) : (
              <InformationCircleIcon className="h-4 w-4 text-blue-500" />
            )}
            <span className={`text-xs font-mono uppercase font-bold ${
              alert.severity === 'HIGH' ? 'text-rose-400' : 
              alert.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'
            }`}>
              [{alert.type}]
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {alert.message}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {/* Duplicamos para efecto infinito si hay pocas alertas */}
        {alerts.length < 5 && alerts.map((alert) => (
           <div key={`dup-${alert.id}`} className="inline-flex items-center mx-8 gap-2 opacity-50">
             <span className="text-xs text-slate-500">...</span>
           </div>
        ))}
      </div>
    </div>
  );
};

export default AlertsTicker;
