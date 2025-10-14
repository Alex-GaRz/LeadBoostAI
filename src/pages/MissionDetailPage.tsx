import React from "react";
import { useParams } from "react-router-dom";
import HuntingDashboard from "../features/hunting/components/HuntingDashboard";

const MissionDetailPage: React.FC = () => {
  const { missionId: strategyId } = useParams<{ missionId: string }>();
  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Detalle de la Misión</h1>
      <HuntingDashboard strategyId={strategyId || ""} />
    </div>
  );
};

export default MissionDetailPage;
