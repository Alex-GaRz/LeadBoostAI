import React from "react";
import MicroCampaignDetailView from "../features/hunting/components/MicroCampaignDetailView";
import { useLocation, useNavigate } from "react-router-dom";

const MicroCampaignDetailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Espera que campaignResult venga por state
  const campaignResult = location.state?.campaignResult;

  if (!campaignResult) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold mb-4">No hay datos de campaña para mostrar.</h2>
        <button className="px-6 py-2 bg-blue-600 text-white rounded font-bold" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <MicroCampaignDetailView campaignResult={campaignResult} />
    </div>
  );
};

export default MicroCampaignDetailPage;
