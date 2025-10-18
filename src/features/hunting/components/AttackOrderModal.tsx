import React, { useState } from "react";
import Card from '../../../components/Dashboard/Card';
import Modal from '../../../components/Dashboard/Modal';
import Button from '../../../components/Dashboard/Button';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../hooks/useAuth";

interface AttackOrderModalProps {
  opportunity: any;
  strategyId: string;
  onClose: () => void;
  userBusinessName: string;
}

const AttackOrderModal: React.FC<AttackOrderModalProps> = ({ opportunity, strategyId, onClose, userBusinessName }) => {
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
        navigate("/micro-campaign-detail", { 
          state: { 
            campaignResult: response.data.campaignResult,
            userBusinessName: userBusinessName 
          } 
        });
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
    <Modal open={!!opportunity} onClose={onClose} title={`Crear Campaña para: ${opportunity.targetProfile?.name || 'Prospecto'}`}>
      <div className="space-y-6">
        <div>
          <h3 className="text-label font-semibold mb-2">Señal Detectada</h3>
          <Card className="bg-background p-3 rounded text-text mb-2">
            {opportunity.signalText || 'Sin señal'}
            <div className="flex gap-2 mt-2">
              {opportunity.targetProfile?.jobTitle && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold">{opportunity.targetProfile.jobTitle}</span>
              )}
              {opportunity.targetProfile?.companyName && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-semibold">{opportunity.targetProfile.companyName}</span>
              )}
            </div>
          </Card>
        </div>
        <div>
          <h3 className="text-label font-semibold mb-2">Acción a Ejecutar</h3>
          <Card className="bg-primary/10 p-3 rounded text-primary">
            Se generarán campañas personalizadas para este objetivo.
          </Card>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="md" onClick={handleLaunch} disabled={isLoading}>
            {isLoading ? 'Lanzando...' : 'Generar Campañas Ahora'}
          </Button>
        </div>
        {error && (
          <p className="text-error mt-2">{error}</p>
        )}
      </div>
    </Modal>
  );
};

export default AttackOrderModal;
