import React from 'react';
import { Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const CreateCampaignButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="mb-6 w-full h-full">
      <div className="border-2 border-white rounded-lg p-6 flex flex-col items-center bg-[#f7f8fa] w-full min-w-[280px] text-center h-full">
        <Layers className="w-14 h-14 text-[#2d4792] mb-6" />
        <div className="mb-6">
          <h2 className="text-3xl font-semibold text-black mb-4">Crea tu próxima campaña exitosa</h2>
          <p className="text-base font-semibold" style={{ color: '#6B7280' }}>Lanza campañas optimizadas con IA en Google Ads, Meta Ads o ambas plataformas simultáneamente.</p>
        </div>
        <button
          className="flex items-center justify-center px-8 min-h-[48px] text-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-xl shadow-lg transition-all duration-200 my-6 group"
          style={{ boxShadow: '0 2px 8px 0 rgba(37,99,235,0.10)' }}
          onClick={() => navigate('/crear-campana')}
        >
          <Plus className="w-8 h-8 mr-2 group-hover:scale-110 transition-transform duration-200" />
          <span className="ml-2 font-semibold">Crear nueva Campaña</span>
        </button>
      </div>
    </div>
  );
};

export default CreateCampaignButton;
