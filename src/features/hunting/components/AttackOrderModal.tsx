import React from "react";

interface AttackOrderModalProps {
  opportunity: any;
  onClose: () => void;
}

const AttackOrderModal: React.FC<AttackOrderModalProps> = ({ opportunity, onClose }) => {
  if (!opportunity) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 relative">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Confirmar Acción para: {opportunity.targetProfile?.name || "Prospecto"}
        </h2>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Señal Detectada</h3>
          <div className="bg-gray-100 p-3 rounded text-gray-800">
            {opportunity.signalText || "Sin señal"}
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Acción a Ejecutar</h3>
          <div className="bg-blue-50 p-3 rounded text-blue-800">
            Se lanzará una micro-campaña personalizada a este objetivo.
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-6 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition"
            onClick={() => {/* Acción futura */}}
          >
            LANZAR AHORA
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttackOrderModal;
