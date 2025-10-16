import React, { useState } from "react";
import BattlePlanWizard from "../features/hunting/components/BattlePlanWizard";
import HuntingDashboard from "../features/hunting/components/HuntingDashboard";

const HuntingPage: React.FC = () => {
  const [missionId, setMissionId] = useState<string>("");

  // Esta función se pasará al wizard para actualizar el missionId cuando se cree una misión
  const handleMissionCreated = (newMissionId: string) => {
    setMissionId(newMissionId);
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-text">Crear Nueva Misión de Caza</h1>
        <div className="text-base text-muted mb-8">Configurar Plan de Batalla</div>
        <div className="bg-white rounded-xl shadow p-8 mb-10">
          <BattlePlanWizard onMissionCreated={handleMissionCreated} />
        </div>
        {missionId && (
          <div className="mt-10">
            <HuntingDashboard strategyId={missionId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HuntingPage;
