import React from 'react';
import { Plus, Image as ImageIcon, Video, Layers } from 'lucide-react';


const CreateCampaignButton: React.FC = () => {
  return (
    <div className="mb-6">
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* Cuadro principal grande */}
  <div className="border-2 border-white rounded-lg p-6 flex flex-col items-center bg-[#f7f8fa] flex-[2] min-w-[280px] text-center">
          <Layers className="w-14 h-14 text-[#2d4792] mb-6" />
          <div className="mb-4">
            <h2 className="text-2xl font-extrabold text-black mb-2">Crea tu próxima campaña exitosa</h2>
            <p className="text-black text-base">Lanza campañas optimizadas con IA en Google Ads, Meta Ads o ambas plataformas simultáneamente.</p>
          </div>
          <button
            className="flex items-center px-5 py-3 bg-[#2d4792] hover:bg-[#1b3b89] text-white font-semibold rounded-lg shadow transition-colors mt-2"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear nueva Campaña
          </button>
        </div>
        {/* Columna derecha con dos cuadros apilados */}
        <div className="flex flex-col gap-4 flex-1 min-w-[220px]">
          {/* Cuadro Generar Imágenes */}
          <div className="border-2 border-white rounded-lg p-6 flex flex-col items-center bg-[#f7f8fa] h-full min-h-[90px] text-center cursor-pointer shadow hover:bg-[#e6eaf6] transition-colors group">
            <ImageIcon className="w-8 h-8 text-[#2d4792] mb-2 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-bold text-black mb-1">Generar Imágenes</h2>
            <p className="text-black text-sm">Crea creatividades con IA</p>
          </div>
          {/* Cuadro Generar Videos */}
          <div className="border-2 border-white rounded-lg p-6 flex flex-col items-center bg-[#f7f8fa] h-full min-h-[90px] text-center cursor-pointer shadow hover:bg-[#e6eaf6] transition-colors group">
            <Video className="w-8 h-8 text-[#2d4792] mb-2 group-hover:scale-110 transition-transform" />
            <h2 className="text-lg font-bold text-black mb-1">Generar Videos</h2>
            <p className="text-black text-sm">Videos publicitarios con IA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignButton;
