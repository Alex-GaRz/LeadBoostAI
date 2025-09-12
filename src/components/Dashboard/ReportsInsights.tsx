import React from 'react';
import { Calendar } from 'lucide-react';

const ReportsInsights: React.FC = () => {
  // Oculto el bloque de estadísticas, pero el código permanece para uso futuro
  return (
    <>
      {false && (
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold text-black mb-1">Estadísticas</h2>
              <p className="text-gray-600">Análisis de rendimiento y oportunidades de optimización</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 inline-flex items-center gap-2 text-[#2d4792] font-semibold text-sm border border-[#e6eaf6] ml-4">
              <Calendar className="w-4 h-4" />
              Últimos 30 días
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsInsights;
