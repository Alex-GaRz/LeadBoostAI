import React from 'react';
import { ArrowRight } from 'lucide-react';

const CompetitorAnalysis: React.FC = () => {
  return (
    <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-8">
      <h2 className="text-xl font-bold text-black mb-1">Análisis de competidores</h2>
      <p className="text-gray-600 mb-4">Mantente un paso adelante de tu competencia</p>

      {/* Apartado adicional */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <h3 className="text-lg font-bold text-black mb-1">¿Quieres análisis más profundos?</h3>
        <p className="text-gray-600 mb-4">Obtén insights detallados sobre las estrategias de tus competidores y recomendaciones personalizadas para superarlos.</p>
        <button className="px-5 py-3 bg-[#2d4792] hover:bg-[#1b3b89] text-white font-semibold rounded-lg shadow transition-colors mx-auto flex items-center gap-2">
          Activar Análisis Avanzado
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
