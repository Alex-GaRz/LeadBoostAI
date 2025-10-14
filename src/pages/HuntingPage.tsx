import React, { useState } from "react";
import BattlePlanWizard from "../features/hunting/components/BattlePlanWizard";
import HuntingDashboard from "../features/hunting/components/HuntingDashboard";

const HuntingPage: React.FC = () => {
  const [missionId, setMissionId] = useState<string>("");

  // Esta función se pasará al wizard para actualizar el missionId cuando se cree una misión
  const handleMissionCreated = (newMissionId: string) => {
    console.log("PASO 1 (ÉXITO): La Campaña se creó. El ID es:", newMissionId);
    setMissionId(newMissionId);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Configuración de Hunting</h1>
        <BattlePlanWizard onMissionCreated={handleMissionCreated} />
  <HuntingDashboard strategyId={missionId} />
      </div>
    </div>
  );
};

export default HuntingPage;
