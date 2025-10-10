import React, { useEffect, useState } from "react";

import AttackOrderModal from "./AttackOrderModal";
import { useAuth } from "../../../hooks/useAuth";
import { db } from "../../../firebase/firebaseConfig";
import { collection, onSnapshot } from "firebase/firestore";


interface Opportunity {
  id: string;
  source: string;
  signalText: string;
  targetProfile: { name: string; jobTitle: string };
  status: string;
}

interface Props {
  missionId: string;
}

const HuntingDashboard: React.FC<Props> = ({ missionId }) => {
  console.log("PASO 2 (LLEGADA): El Panel de Resultados recibió este ID:", missionId);
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useEffect(() => {
    if (!user?.uid || !missionId) return;
    setIsLoading(true);
    const oppRef = collection(db, `clients/${user.uid}/battle_plans/${missionId}/opportunities`);
    const unsubscribe = onSnapshot(oppRef, (snapshot) => {
      const rawData = snapshot.docs.map(doc => doc.data());
      console.log("Datos crudos de Firestore:", rawData);
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          source: data.source || "N/A",
          signalText: data.signalText || "Sin señal",
          status: data.status || "PENDIENTE",
          targetProfile: {
            name: data.targetProfile?.name || "Prospecto Sin Nombre",
            jobTitle: data.targetProfile?.jobTitle || "Sin Cargo",
            companyName: data.targetProfile?.companyName || "Sin Empresa",
            linkedinURL: data.targetProfile?.linkedinURL || "",
          },
          sourceURL: data.sourceURL || "",
          detectedAt: data.detectedAt || "",
        };
      });
      setOpportunities(docs);
      setIsLoading(false);
    }, (error) => {
      setOpportunities([]);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid, missionId]);

  // Métricas de ejemplo (puedes calcularlas con los datos reales si lo deseas)
  const metrics = {
    signals: opportunities.length,
    profiles: opportunities.length,
    opportunities: opportunities.length
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      {/* Embudo de Inteligencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-blue-50 rounded-xl p-6 text-center shadow">
          <div className="text-4xl font-bold text-blue-600 mb-2">{metrics.signals}</div>
          <div className="text-lg font-semibold text-gray-700">Señales Detectadas</div>
        </div>
        <div className="bg-green-50 rounded-xl p-6 text-center shadow">
          <div className="text-4xl font-bold text-green-600 mb-2">{metrics.profiles}</div>
          <div className="text-lg font-semibold text-gray-700">Perfiles Identificados</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-6 text-center shadow">
          <div className="text-4xl font-bold text-purple-600 mb-2">{metrics.opportunities}</div>
          <div className="text-lg font-semibold text-gray-700">Oportunidades Calificadas</div>
        </div>
      </div>

      {/* Renderizado condicional */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <div className="mt-2">Cargando oportunidades...</div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No se han encontrado oportunidades para esta misión todavía.</div>
      ) : (
        <div className="space-y-6">
          {opportunities.map((opp) => (
            <div key={opp.id} className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row items-center justify-between">
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-800 mb-1">{opp.targetProfile?.name}</div>
                <div className="text-sm text-gray-500 mb-2">{opp.targetProfile?.jobTitle}</div>
                <div className="text-base text-gray-700 mb-2">{opp.signalText}</div>
                <div className="text-xs text-blue-500 font-semibold mb-2">Fuente: {opp.source}</div>
                <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-600">{opp.status}</div>
              </div>
              <div className="mt-4 md:mt-0 md:ml-6">
                <button
                  className="px-5 py-2 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 transition-colors"
                  onClick={() => setSelectedOpportunity(opp)}
                >
                  Revisar y Actuar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal de acción */}
      {selectedOpportunity && (
        <AttackOrderModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </div>
  );
};

export default HuntingDashboard;
