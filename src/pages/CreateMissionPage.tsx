import React from "react";
import BattlePlanWizard from "../features/hunting/components/BattlePlanWizard";

const CreateMissionPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Crear Nueva Misión de Caza</h1>
      <BattlePlanWizard />
    </div>
  );
};

export default CreateMissionPage;
