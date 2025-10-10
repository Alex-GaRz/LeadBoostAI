import React, { useState } from "react";
import axios from "axios";

interface AttackOrderModalProps {
  opportunity: any;
  onClose: () => void;
}

const AttackOrderModal: React.FC<AttackOrderModalProps> = ({ opportunity, onClose }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lógica principal de lanzamiento
  const handleLaunch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/execute-attack", { opportunity });
      if (response.data.success) {
        alert("¡Campaña generada con éxito!");
        onClose();
      } else {
        setError(response.data.error || "Error desconocido");
      }
    } catch (err: any) {
      setError("Hubo un problema al lanzar la campaña. Por favor, revisa la consola del servidor.");
    } finally {
      setIsLoading(false);
    }
  };

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
            className="px-6 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition disabled:opacity-60"
            onClick={handleLaunch}
            disabled={isLoading}
          >
            {isLoading ? "Lanzando..." : "LANZAR AHORA"}
          </button>
        </div>
        {error && (
          <p className="text-red-500 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};

export default AttackOrderModal;
