// src/pages/placeholders/EngineRoom.tsx
import React from 'react';

const EngineRoom: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="border-b border-gray-800 pb-4 mb-6 flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sala de Máquinas (B7/B8)</h1>
            <p className="text-gray-400 mt-1 text-sm font-mono">
            &gt; EJECUCIÓN ACTIVA & LOGS DE AUDITORÍA
            </p>
        </div>
        <div className="text-xs font-mono text-green-500 bg-green-900/20 px-3 py-1 rounded border border-green-900/50">
            ● ACTUADORES ONLINE
        </div>
      </header>

      <div className="bg-[#0A0A0A] border border-gray-800 rounded overflow-hidden">
        <div className="grid grid-cols-4 gap-px bg-gray-900 border-b border-gray-800">
            {['ID CAMPAÑA', 'ESTADO', 'IMPACTO VENTAS', 'ÚLTIMA ACCIÓN'].map(h => (
                <div key={h} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase bg-[#0A0A0A]">{h}</div>
            ))}
        </div>
        <div className="p-12 text-center text-gray-600 font-mono text-sm">
            Esperando instrucciones de la Sala de Estrategia...
        </div>
      </div>
    </div>
  );
};

export default EngineRoom;