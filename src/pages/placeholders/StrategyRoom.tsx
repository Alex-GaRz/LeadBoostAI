// src/pages/placeholders/StrategyRoom.tsx
import React from 'react';

const StrategyRoom: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="border-b border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Sala de Estrategia (B5/B6)</h1>
        <p className="text-gray-400 mt-1 text-sm font-mono">
          &gt; MÓDULO DE GOBERNANZA Y TOMA DE DECISIONES
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placeholder para el Debate B5 */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-gray-800 rounded p-6 min-h-[400px] flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
                <div className="text-indigo-500 text-4xl mb-4 opacity-20">⚖</div>
                <h3 className="text-gray-300 font-bold mb-2">Mesa Redonda (AI Debate)</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                   El sistema Consejero está esperando input del Radar (B1) para iniciar simulaciones de debate.
                </p>
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-900 to-transparent opacity-50"></div>
        </div>

        {/* Placeholder para Semáforo B6 */}
        <div className="bg-[#0A0A0A] border border-gray-800 rounded p-6 flex items-center justify-center">
             <div className="text-center space-y-4 w-full">
                <div className="h-32 bg-black/40 rounded border border-gray-800 flex items-center justify-center text-xs text-gray-600 font-mono">
                    [RISK METRICS PENDING]
                </div>
                <button disabled className="w-full py-3 bg-gray-800 text-gray-500 font-bold rounded cursor-not-allowed">
                    APROBAR ESTRATEGIA
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyRoom;