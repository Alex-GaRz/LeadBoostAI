import React from "react";

interface RadarConfigFormProps {
  excludeKeywords?: string;
  setExcludeKeywords?: (v: string) => void;
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
  labels?: Record<string, string>;
  placeholders?: Record<string, string>;
  tooltips?: Record<string, string>;
}

const RadarConfigForm: React.FC<RadarConfigFormProps> = ({
  excludeKeywords,
  setExcludeKeywords,
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
  setImageDescription,
  labels,
  placeholders,
  tooltips
}) => {
  return (
  <div className="p-0 mb-6">
      {/* Perfil del Prospecto Ideal */}
  <h3 className="text-lg font-semibold mb-4 text-brand-base">{labels?.demographics || 'Perfil del Prospecto Ideal'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">{labels?.industries || 'Industrias Objetivo'}</label>
          <input
            type="text"
            value={industries}
            onChange={e => setIndustries(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder={placeholders?.industries || 'Ej: SaaS, Retail, Finanzas'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">{labels?.companySizes || 'Tamaños de Empresa'}</label>
          <input
            type="text"
            value={companySizes}
            onChange={e => setCompanySizes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder={placeholders?.companySizes || 'Ej: 1-50, 51-200, 201+'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">{labels?.locations || 'Ubicaciones'}</label>
          <input
            type="text"
            value={locations}
            onChange={e => setLocations(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder={placeholders?.locations || 'Ej: México, USA, España'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">{labels?.jobTitles || 'Cargos de los Decisores'}</label>
          <input
            type="text"
            value={jobTitles}
            onChange={e => setJobTitles(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder={placeholders?.jobTitles || 'Ej: CEO, Director de Marketing, VP de Ventas'}
          />
        </div>
      </div>

      {/* Signals Section */}
  <h3 className="text-lg font-semibold mb-4 text-brand-base">{labels?.signals || 'Señales de Intención de Compra'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">{labels?.competitors || 'Competidores a Monitorear'}</label>
          <input
            type="text"
            value={competitors}
            onChange={e => setCompetitors(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder={placeholders?.competitors || 'Ej: Salesforce, HubSpot'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">{labels?.frustrationKeywords || 'Problemas o Puntos de Dolor'}</label>
          <input
            type="text"
            value={frustrationKeywords}
            onChange={e => setFrustrationKeywords(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder={placeholders?.frustrationKeywords || 'Ej: "reportes limitados", "mala integración", "precio subió"'}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-label mb-1">{labels?.searchKeywords || 'Frases de Búsqueda Activa'}</label>
          <input
            type="text"
            value={searchKeywords}
            onChange={e => setSearchKeywords(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
            placeholder={placeholders?.searchKeywords || 'Ej: "alternativas a hubspot", "mejor crm para agencias"'}
          />
         <label className="block text-sm font-medium text-brand-label mt-4 mb-1">{labels?.excludeKeywords || 'Palabras Clave a Excluir'}</label>
         <input
           type="text"
           value={excludeKeywords}
           onChange={e => setExcludeKeywords && setExcludeKeywords(e.target.value)}
           className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
           placeholder={placeholders?.excludeKeywords || 'Ej: gratis, empleo, curso'}
         />
        </div>
      </div>

      {/* Directivas de Imagen */}
      {/* Purchase Events Section */}
  <h3 className="text-lg font-semibold mb-4 text-brand-base">{labels?.events || 'Eventos de Compra'}</h3>
      <div className="flex gap-8 mb-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={monitorsFunding}
            onChange={e => setMonitorsFunding(e.target.checked)}
            className="form-checkbox h-5 w-5 text-brand-action"
          />
          <span className="text-brand-base">Monitorear Rondas de Financiación</span>
          <span className="ml-2 cursor-pointer" title={tooltips?.monitorsFunding || ''}>
            <span className="inline-flex items-center justify-center rounded-full bg-gray-300 text-white text-xs font-bold w-5 h-5">?</span>
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={monitorsHiring}
            onChange={e => setMonitorsHiring(e.target.checked)}
            className="form-checkbox h-5 w-5 text-brand-action"
          />
          <span className="text-brand-base">Monitorear Contrataciones</span>
          <span className="ml-2 cursor-pointer" title={tooltips?.monitorsHiring || ''}>
            <span className="inline-flex items-center justify-center rounded-full bg-gray-300 text-white text-xs font-bold w-5 h-5">?</span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default RadarConfigForm;
