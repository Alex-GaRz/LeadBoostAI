import React from 'react';
import { Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const CreateCampaignButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="mb-6 w-full h-full">
      <div className="border-2 border-white rounded-lg p-6 flex flex-col items-center bg-[#f7f8fa] w-full min-w-[280px] text-center h-full">
        <Layers className="w-14 h-14 text-[#2d4792] mb-6" />
        <div className="mb-4">
          <h2 className="text-2xl font-extrabold text-black mb-2">Crea tu próxima campaña exitosa</h2>
          <p className="text-black text-base">Lanza campañas optimizadas con IA en Google Ads, Meta Ads o ambas plataformas simultáneamente.</p>
        </div>
        <button
          className="flex items-center px-5 py-3 bg-[#2d4792] hover:bg-[#1b3b89] text-white font-semibold rounded-lg shadow transition-colors mt-2"
          onClick={() => navigate('/crear-campana')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear nueva Campaña
        </button>
      </div>
    </div>
  );
};

export default CreateCampaignButton;
