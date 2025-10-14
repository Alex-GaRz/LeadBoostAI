import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../hooks/useAuth";

interface AttackOrderModalProps {
  opportunity: any;
  strategyId: string;
  onClose: () => void;
}

const AttackOrderModal: React.FC<AttackOrderModalProps> = ({ opportunity, strategyId, onClose }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Lógica principal de lanzamiento
  const handleLaunch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Adjuntar el userId al objeto opportunity antes de enviarlo
      const opportunityWithUserId = { ...opportunity, userId: user?.uid };
      const response = await axios.post("/api/execute-attack", { opportunity: opportunityWithUserId, strategyId });
      if (response.data.success) {
        navigate("/micro-campaign-detail", { state: { campaignResult: response.data.campaignResult } });
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
        <>
          <h2 className="text-2xl font-bold mb-4 text-brand-title">
            Confirmar Acción para: {opportunity.targetProfile?.name || "Prospecto"}
          </h2>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-brand-base mb-2">Señal Detectada</h3>
            <div className="bg-brand-bg p-3 rounded text-brand-title">
              {opportunity.signalText || "Sin señal"}
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-brand-base mb-2">Acción a Ejecutar</h3>
            <div className="bg-brand-action/10 p-3 rounded text-brand-action">
              Se lanzará una micro-campaña personalizada a este objetivo.
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded bg-brand-secondary text-brand-base font-semibold hover:bg-brand-secondary/80 transition"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="px-6 py-2 rounded bg-brand-primary text-white font-bold hover:bg-brand-primary/80 transition disabled:opacity-60"
              onClick={handleLaunch}
              disabled={isLoading}
            >
              {isLoading ? "Lanzando..." : "LANZAR AHORA"}
            </button>
          </div>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </>
      </div>
    </div>
  );
};

export default AttackOrderModal;
