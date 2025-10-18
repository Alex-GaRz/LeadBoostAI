import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/Dashboard/Card';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
  const [searchParams] = useSearchParams();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStrategyId, setExpandedStrategyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Leer el filtro de estrategia de la URL
  const strategyFilter = searchParams.get('strategy_id');

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    
    const strategiesRef = collection(db, `clients/${user.uid}/battle_plans`);
    const campaignsRef = collection(db, `clients/${user.uid}/campaigns`);

    // Configurar la consulta de campañas con filtro condicional
    const campaignsQuery = strategyFilter 
      ? query(campaignsRef, where('strategyId', '==', strategyFilter))
      : campaignsRef;

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

    const unsubCampaigns = onSnapshot(campaignsQuery, (snapshot) => {
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

    // Auto-expandir estrategia si viene filtrada por URL
    if (strategyFilter) {
      setExpandedStrategyId(strategyFilter);
    }

    return () => {
      unsubStrategies();
      unsubCampaigns();
    };
  }, [user, strategyFilter]);

  const groupedStrategies = useMemo(() => {
    let filteredStrategies = strategies;
    
    // Si hay filtro de URL, mostrar solo esa estrategia
    if (strategyFilter) {
      filteredStrategies = strategies.filter(s => s.id === strategyFilter);
    }
    
    return filteredStrategies.map(strategy => ({
      ...strategy,
      generatedCampaigns: campaigns.filter(c => c.strategyId === strategy.id)
    }));
  }, [strategies, campaigns, strategyFilter]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-heading-2 font-bold text-text">
          {strategyFilter ? 'Campañas de la Estrategia' : 'Panel de Campañas Generadas'}
        </h1>
        {strategyFilter && (
          <button 
            onClick={() => navigate('/generated-campaigns')}
            className="text-sm text-accent hover:text-primary transition-colors flex items-center gap-1"
          >
            ← Ver todas las estrategias
          </button>
        )}
      </div>
      
      {strategyFilter && (
        <Card className="mb-4 p-4 bg-accent/10 border-accent/20">
          <p className="text-sm text-accent">
            📍 Mostrando campañas de una estrategia específica
          </p>
        </Card>
      )}
      
      <Card className="mb-6 p-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Buscar estrategia..."
          className="border border-border rounded px-3 py-2 w-full max-w-xs text-body"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="px-4 py-2 rounded-lg bg-secondary text-text font-semibold hover:bg-card transition">Filtrar</button>
        <button className="px-4 py-2 rounded-lg bg-secondary text-text font-semibold hover:bg-card transition">Ordenar</button>
      </Card>
      {isLoading ? (
        <Card className="text-label text-center py-10">Cargando...</Card>
      ) : (
        <div className="space-y-4">
          {groupedStrategies
            .filter(strategy => strategy.planName?.toLowerCase().includes(search.toLowerCase()))
            .map(strategy => (
              <Card key={strategy.id} className="p-0">
                <button
                  className="w-full flex justify-between items-center px-6 py-4 text-lg font-semibold text-text hover:bg-background focus:outline-none"
                  onClick={() => setExpandedStrategyId(expandedStrategyId === strategy.id ? null : strategy.id)}
                >
                  <span>{strategy.planName || 'Sin nombre'}</span>
                  <span className="text-sm text-label">{strategy.generatedCampaigns.length} campañas</span>
                </button>
                {expandedStrategyId === strategy.id && (
                  <div className="border-t border-border px-6 py-4 bg-background">
                    {strategy.generatedCampaigns.length === 0 ? (
                      <div className="text-label">No hay campañas generadas para esta estrategia.</div>
                    ) : (
                      <ul className="space-y-2">
                        {strategy.generatedCampaigns.map((campaign: Campaign) => (
                          <li key={campaign.id} className="p-3 rounded bg-card border border-border hover:shadow flex justify-between items-center">
                            <div className="font-medium text-text">{campaign.name || 'Sin nombre'}</div>
                            <button
                              className="ml-4 px-4 py-1 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-accent transition"
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
              </Card>
            ))}
        </div>
      )}
    </div>
  );
};

export default GeneratedCampaignsPage;
