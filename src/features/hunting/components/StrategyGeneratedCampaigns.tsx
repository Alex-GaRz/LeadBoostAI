import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useAuth } from '../../../hooks/useAuth';
import MicroCampaignDetailView from './MicroCampaignDetailView';
import { Search, Filter, Calendar, Building2 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  strategyId: string;
  generated_image_url?: string;
  ad_variants?: Array<any>;
  status: 'active' | 'paused' | 'completed';
  createdAt: Timestamp;
  targetProfile?: {
    name: string;
    companyName: string;
  };
}

interface StrategyGeneratedCampaignsProps {
  strategyId: string;
  missionName: string;
  onCampaignCountChange?: (count: number) => void;
}

const StrategyGeneratedCampaigns: React.FC<StrategyGeneratedCampaignsProps> = ({
  strategyId,
  missionName,
  onCampaignCountChange
}) => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user?.uid || !strategyId) return;

    setIsLoading(true);
    const campaignsRef = collection(db, `clients/${user.uid}/campaigns`);
    const campaignsQuery = query(campaignsRef, where('strategyId', '==', strategyId));

    const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
      const campaignData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Campaña Sin Nombre',
          strategyId: data.strategyId,
          generated_image_url: data.generated_image_url,
          ad_variants: data.ad_variants,
          status: data.status || 'completed',
          createdAt: data.createdAt,
          targetProfile: data.targetProfile || {
            name: 'Prospecto',
            companyName: 'Empresa'
          },
          ...data
        };
      });
      
      setCampaigns(campaignData);
      setIsLoading(false);
      
      // Notificar al componente padre sobre el cambio de cantidad
      onCampaignCountChange?.(campaignData.length);
    });

    return () => unsubscribe();
  }, [user?.uid, strategyId, onCampaignCountChange]);

  // Filtrar campañas basado en búsqueda y filtros
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.targetProfile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.targetProfile?.companyName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl text-gray-300 mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay campañas generadas
        </h3>
        <p className="text-gray-600 mb-6">
          Aún no se han generado campañas para la estrategia "{missionName}".
          Ve al Panel de Prospectos para generar algunas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Campañas Generadas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredCampaigns.length} de {campaigns.length} campañas
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar campañas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Filtro por estado */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none bg-white"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="paused">Pausadas</option>
                <option value="completed">Completadas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de campañas */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Header de la campaña */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {campaign.targetProfile?.name || 'Prospecto'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Building2 className="h-4 w-4 mr-1" />
                      {campaign.targetProfile?.companyName || 'Empresa'}
                    </p>
                  </div>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'}
                  `}>
                    {campaign.status === 'active' ? 'Activa' :
                     campaign.status === 'paused' ? 'Pausada' : 'Completada'}
                  </span>
                </div>
                
                {campaign.createdAt && (
                  <p className="text-xs text-gray-500 flex items-center mt-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(campaign.createdAt.toDate()).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Vista previa de la campaña */}
              <div className="p-6">
                <MicroCampaignDetailView
                  campaignResult={campaign}
                  userBusinessName={user?.displayName || user?.email?.split('@')[0] || "Tu Empresa"}
                />
              </div>

              {/* Footer con estadísticas */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {campaign.ad_variants?.length || 3} variantes
                  </span>
                  <span className="text-green-600 font-medium">
                    ✓ Generada
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron campañas
          </h3>
          <p className="text-gray-600">
            Intenta ajustar los filtros de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
};

export default StrategyGeneratedCampaigns;