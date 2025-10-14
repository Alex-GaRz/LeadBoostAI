import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RadarConfigForm from "./RadarConfigForm";
import { useAuth } from "../../../hooks/useAuth";
import axios from "axios";

const playbookOptions = [
  "Adquisición de Competidores",
  "Generación de Demanda",
  "Expansión de Mercado",
];

interface BattlePlanWizardProps {
  onMissionCreated?: (id: string) => void;
}

const BattlePlanWizard: React.FC<BattlePlanWizardProps> = ({ onMissionCreated }) => {
  const navigate = useNavigate();
  // Estado para RadarConfigForm
  const [industries, setIndustries] = useState("");
  const [companySizes, setCompanySizes] = useState("");
  const [locations, setLocations] = useState("");
  const [jobTitles, setJobTitles] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [frustrationKeywords, setFrustrationKeywords] = useState("");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [monitorsFunding, setMonitorsFunding] = useState(false);
  const [monitorsHiring, setMonitorsHiring] = useState(false);
  const { user } = useAuth();
  const [planName, setPlanName] = useState("");
  const [playbookType, setPlaybookType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Estado para directivas de imagen
  const [imageStyle, setImageStyle] = useState("");
  const [imageDescription, setImageDescription] = useState("");

  // Si no se pasa la prop, usar función vacía por defecto
  const handleMissionCreated = onMissionCreated || (() => {});

  // Simulación de datos de RadarConfigForm (debería obtenerse vía props o contexto)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    // Recopilar datos del formulario y radarConfig
    const radarConfig = {
      industries,
      companySizes,
      locations,
      jobTitles,
      competitors,
      frustrationKeywords,
      searchKeywords,
      monitorsFunding,
      monitorsHiring,
      imageStyle,
      imageDescription
    };
    const battlePlanData = {
      planName,
      playbookType,
      userId: user?.uid,
      radarConfig
    };
    console.log("battlePlanData enviado:", battlePlanData);
    console.log("battlePlanData enviado:", battlePlanData);
    try {
      const response = await axios.post("/api/battle-plans", battlePlanData);
      if (response.data && response.data.success && response.data.planId) {
        const newMissionId = response.data.planId;
        handleMissionCreated(newMissionId);
        navigate(`/hunting/${newMissionId}`);
      } else {
        setError("No se pudo crear el plan. Intenta de nuevo.");
      }
    } catch (err: any) {
      setError("Error al guardar el plan. Verifica tu conexión o los datos.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
  <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold mb-6 text-brand-title">Configurar Plan de Batalla</h2>
      <div className="mb-4">
  <label className="block text-sm font-medium text-brand-label mb-1">Nombre del Plan</label>
        <input
          type="text"
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-action"
          placeholder="Ejemplo: Plan Q4 Competidores"
        />
      </div>
      <div className="mb-6">
  <label className="block text-sm font-medium text-brand-label mb-2">Tipo de Playbook</label>
        <div className="flex gap-3">
          {playbookOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setPlaybookType(option)}
              className={`px-4 py-2 rounded-md border font-semibold transition-colors duration-150 ${
                playbookType === option
                  ? "bg-brand-action text-white border-brand-action"
                  : "bg-brand-secondary text-brand-base border-brand-secondary hover:bg-brand-action/10"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <RadarConfigForm
  industries={industries}
  setIndustries={setIndustries}
  companySizes={companySizes}
  setCompanySizes={setCompanySizes}
  locations={locations}
  setLocations={setLocations}
  jobTitles={jobTitles}
  setJobTitles={setJobTitles}
  competitors={competitors}
  setCompetitors={setCompetitors}
  frustrationKeywords={frustrationKeywords}
  setFrustrationKeywords={setFrustrationKeywords}
  searchKeywords={searchKeywords}
  setSearchKeywords={setSearchKeywords}
  monitorsFunding={monitorsFunding}
  setMonitorsFunding={setMonitorsFunding}
  monitorsHiring={monitorsHiring}
  setMonitorsHiring={setMonitorsHiring}
  imageStyle={imageStyle}
  setImageStyle={setImageStyle}
  imageDescription={imageDescription}
  setImageDescription={setImageDescription}
      />
      {error && (
        <div className="text-red-600 font-semibold mb-4">{error}</div>
      )}
      <div className="mt-8 text-right">
        <button
          type="submit"
          disabled={isLoading}
          className={`px-6 py-2 bg-brand-primary text-white rounded-md font-bold transition-colors ${isLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-brand-primary/80"}`}
        >
          {isLoading ? "Guardando..." : "Guardar Plan de Batalla"}
        </button>
      </div>
    </form>
  );
};

export default BattlePlanWizard;
