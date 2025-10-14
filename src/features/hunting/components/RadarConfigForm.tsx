import React from "react";

interface RadarConfigFormProps {
  industries: string;
  setIndustries: (v: string) => void;
  companySizes: string;
  setCompanySizes: (v: string) => void;
  locations: string;
  setLocations: (v: string) => void;
  jobTitles: string;
  setJobTitles: (v: string) => void;
  competitors: string;
  setCompetitors: (v: string) => void;
  frustrationKeywords: string;
  setFrustrationKeywords: (v: string) => void;
  searchKeywords: string;
  setSearchKeywords: (v: string) => void;
  monitorsFunding: boolean;
  setMonitorsFunding: (v: boolean) => void;
  monitorsHiring: boolean;
  setMonitorsHiring: (v: boolean) => void;
  imageStyle: string;
  setImageStyle: (v: string) => void;
  imageDescription: string;
  setImageDescription: (v: string) => void;
}

const RadarConfigForm: React.FC<RadarConfigFormProps> = ({
  industries,
  setIndustries,
  companySizes,
  setCompanySizes,
  locations,
  setLocations,
  jobTitles,
  setJobTitles,
  competitors,
  setCompetitors,
  frustrationKeywords,
  setFrustrationKeywords,
  searchKeywords,
  setSearchKeywords,
  monitorsFunding,
  setMonitorsFunding,
  monitorsHiring,
  setMonitorsHiring,
  imageStyle,
  setImageStyle,
  imageDescription,
  setImageDescription
}) => {
  return (
    <div className="bg-brand-bg p-6 rounded-lg shadow mb-6">
      {/* Demographics Section */}
  <h3 className="text-lg font-semibold mb-4 text-brand-base">Demographics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Industrias</label>
          <input
            type="text"
            value={industries}
            onChange={e => setIndustries(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: SaaS, Retail, Finanzas"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Tamaños de Empresa</label>
          <input
            type="text"
            value={companySizes}
            onChange={e => setCompanySizes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: 1-50, 51-200, 201+"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Ubicaciones</label>
          <input
            type="text"
            value={locations}
            onChange={e => setLocations(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: México, USA, España"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Puestos de Trabajo</label>
          <input
            type="text"
            value={jobTitles}
            onChange={e => setJobTitles(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: CEO, CTO, Marketing Manager"
          />
        </div>
      </div>

      {/* Signals Section */}
  <h3 className="text-lg font-semibold mb-4 text-brand-base">Señales</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Competidores</label>
          <input
            type="text"
            value={competitors}
            onChange={e => setCompetitors(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: Salesforce, HubSpot"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Palabras Clave de Frustración</label>
          <input
            type="text"
            value={frustrationKeywords}
            onChange={e => setFrustrationKeywords(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: lento, caro, difícil"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Palabras Clave de Búsqueda</label>
          <input
            type="text"
            value={searchKeywords}
            onChange={e => setSearchKeywords(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: CRM, automatización"
          />
        </div>
      </div>

      {/* Directivas de Imagen */}
  <h3 className="text-lg font-semibold mb-4 text-brand-base">Directivas de Imagen</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Estilo de Imagen</label>
          <input
            type="text"
            value={imageStyle}
            onChange={e => setImageStyle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: Fotografía profesional, minimalista"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">Descripción de Imagen</label>
          <input
            type="text"
            value={imageDescription}
            onChange={e => setImageDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder="Ej: Una oficina moderna y limpia con luz natural"
          />
        </div>
      </div>
      {/* Purchase Events Section */}
  <h3 className="text-lg font-semibold mb-4 text-brand-base">Eventos de Compra</h3>
      <div className="flex gap-8 mb-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={monitorsFunding}
            onChange={e => setMonitorsFunding(e.target.checked)}
            className="form-checkbox h-5 w-5 text-brand-action"
          />
          <span className="text-brand-base">Monitorear Rondas de Financiamiento</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={monitorsHiring}
            onChange={e => setMonitorsHiring(e.target.checked)}
            className="form-checkbox h-5 w-5 text-brand-action"
          />
          <span className="text-brand-base">Monitorear Contrataciones</span>
        </label>
      </div>
    </div>
  );
};

export default RadarConfigForm;
