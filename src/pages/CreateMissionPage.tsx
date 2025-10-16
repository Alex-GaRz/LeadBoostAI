import React from "react";
import BattlePlanWizard from "../features/hunting/components/BattlePlanWizard";
import Card from '../components/Dashboard/Card';

const CreateMissionPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 text-text">Crear Nueva Estrategia de Búsqueda</h1>
      <div className="text-base text-muted mb-8">Configurar Estrategia</div>
      <BattlePlanWizard />
    </div>
  );
};

export default CreateMissionPage;
