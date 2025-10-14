import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../hooks/useAuth';

interface Strategy {
  id: string;
  planName: string;
  [key: string]: any;
}

interface Campaign {
  id: string;
  name: string;
  strategyId: string;
  [key: string]: any;
}

const GeneratedCampaignsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const strategiesRef = collection(db, `clients/${user.uid}/battle_plans`);
    const campaignsRef = collection(db, `clients/${user.uid}/campaigns`);

    const unsubStrategies = onSnapshot(strategiesRef, (snapshot) => {
      setStrategies(
        snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            planName: typeof data.planName === 'string' ? data.planName : '',
            ...data
          };
        })
      );
    });
    const unsubCampaigns = onSnapshot(campaignsRef, (snapshot) => {
      setCampaigns(
        snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: typeof data.name === 'string' ? data.name : '',
            strategyId: typeof data.strategyId === 'string' ? data.strategyId : '',
            ...data
          };
        })
      );
      setIsLoading(false);
    });
    return () => {
      unsubStrategies();
      unsubCampaigns();
    };
  }, [user]);

  const groupedStrategies = useMemo(() => {
    return strategies.map(strategy => ({
      ...strategy,
      generatedCampaigns: campaigns.filter(c => c.strategyId === strategy.id)
    }));
  }, [strategies, campaigns]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Panel de Campañas Generadas</h1>
      <div className="flex items-center mb-6 gap-2">
        <input
          type="text"
          placeholder="Buscar estrategia..."
          className="border rounded px-3 py-2 w-full max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Filtrar</button>
        <button className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold">Ordenar</button>
      </div>
      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : (
        <div className="space-y-4">
          {groupedStrategies
            .filter(strategy => strategy.planName?.toLowerCase().includes(search.toLowerCase()))
            .map(strategy => (
              <div key={strategy.id} className="border rounded-lg shadow-sm bg-white">
                <button
                  className="w-full flex justify-between items-center px-6 py-4 text-lg font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none"
                  onClick={() => setExpandedStrategyId(expandedStrategyId === strategy.id ? null : strategy.id)}
                >
                  <span>{strategy.planName || 'Sin nombre'}</span>
                  <span className="text-sm text-gray-500">{strategy.generatedCampaigns.length} campañas</span>
                </button>
                {expandedStrategyId === strategy.id && (
                  <div className="border-t px-6 py-4 bg-gray-50">
                    {strategy.generatedCampaigns.length === 0 ? (
                      <div className="text-gray-400">No hay campañas generadas para esta estrategia.</div>
                    ) : (
                      <ul className="space-y-2">
                        {strategy.generatedCampaigns.map((campaign: Campaign) => (
                          <li key={campaign.id} className="p-3 rounded bg-white border hover:shadow flex justify-between items-center">
                            <div className="font-medium text-gray-800">{campaign.name || 'Sin nombre'}</div>
                            <button
                              className="ml-4 px-4 py-1 bg-blue-600 text-white rounded text-sm font-semibold"
                              onClick={() => navigate('/micro-campaign-detail', { state: { campaignResult: campaign } })}
                            >
                              Ver Detalle
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default GeneratedCampaignsPage;
