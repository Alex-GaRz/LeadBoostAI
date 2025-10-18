import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Users, Layers, Settings } from 'lucide-react';
import TabNavigation from '../components/Dashboard/TabNavigationFixed';
import HuntingDashboard from '../features/hunting/components/HuntingDashboard';
import StrategyGeneratedCampaigns from '../features/hunting/components/StrategyGeneratedCampaigns';
import StrategyConfiguration from '../features/hunting/components/StrategyConfiguration';

interface Mission {
  id: string;
  planName: string;
  status: string;
  createdAt: any;
  radarConfig?: any;
}

const MissionDetailPageWithTabs: React.FC = () => {
  const { missionId: strategyId } = useParams<{ missionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState<string>(() => {
    return searchParams.get('tab') || 'prospects';
  });
  const [missionData, setMissionData] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para contadores dinámicos
  const [opportunitiesCount, setOpportunitiesCount] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);

  // Configuración de pestañas según el plan
  const tabs = [
    {
      id: 'prospects',
      label: 'Panel de Prospectos',
      icon: Users,
      count: opportunitiesCount
    },
    {
      id: 'campaigns',
      label: 'Campañas Generadas',
      icon: Layers,
      count: campaignsCount
    },
    {
      id: 'configuration',
      label: 'Configuración',
      icon: Settings,
    }
  ];

  // Callback para manejar cambio de pestañas con URL sync
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  }, [setSearchParams]);

  // Callbacks para actualizar contadores dinámicos
  const handleOpportunityCountChange = useCallback((count: number) => {
    setOpportunitiesCount(count);
  }, []);

  const handleCampaignCountChange = useCallback((count: number) => {
    setCampaignsCount(count);
  }, []);

  // Función de renderizado condicional de pestañas
  const renderActiveTab = () => {
    if (!strategyId || !user?.uid) return null;

    switch (activeTab) {
      case 'prospects':
        return (
          <HuntingDashboard 
            strategyId={strategyId}
            userBusinessName={user?.displayName || user?.email?.split('@')[0] || "Tu Empresa"}
          />
        );
      case 'campaigns':
        return (
          <StrategyGeneratedCampaigns 
            strategyId={strategyId} 
            missionName={missionData?.planName || 'Misión'}
            onCampaignCountChange={handleCampaignCountChange}
          />
        );
      case 'configuration':
        return (
          <StrategyConfiguration 
            strategyId={strategyId}
            userId={user.uid}
          />
        );
      default:
        return (
          <HuntingDashboard 
            strategyId={strategyId}
            userBusinessName={user?.displayName || user?.email?.split('@')[0] || "Tu Empresa"}
          />
        );
    }
  };

  // Cargar datos de la misión
  useEffect(() => {
    const loadMissionData = async () => {
      if (!user?.uid || !strategyId) return;

      try {
        setIsLoading(true);
        const missionRef = doc(db, `clients/${user.uid}/battle_plans/${strategyId}`);
        const missionSnap = await getDoc(missionRef);

        if (missionSnap.exists()) {
          const data = missionSnap.data();
          setMissionData({
            id: missionSnap.id,
            planName: data.planName || 'Misión Sin Nombre',
            status: data.status || 'active',
            createdAt: data.createdAt,
            radarConfig: data.radarConfig
          });
        }
      } catch (error) {
        console.error('Error loading mission data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMissionData();
  }, [user?.uid, strategyId]);

  // Listener en tiempo real para conteo de oportunidades
  useEffect(() => {
    if (!user?.uid || !strategyId) return;

    const opportunitiesRef = collection(db, `clients/${user.uid}/battle_plans/${strategyId}/opportunities`);
    const unsubscribe = onSnapshot(opportunitiesRef, (snapshot) => {
      setOpportunitiesCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user?.uid, strategyId]);

  // Listener en tiempo real para conteo de campañas
  useEffect(() => {
    if (!user?.uid || !strategyId) return;

    const campaignsRef = collection(db, `clients/${user.uid}/campaigns`);
    const campaignsQuery = query(campaignsRef, where('strategyId', '==', strategyId));
    const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
      setCampaignsCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, [user?.uid, strategyId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando misión...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!missionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-300 mb-4">❌</div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Misión no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            La misión que buscas no existe o no tienes permisos para verla.
          </p>
          <button
            onClick={() => navigate('/hunting')}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Misiones
          </button>
        </div>
      </div>
    );
  }

  // Main render - Centro de Mando con Pestañas
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <button
                    onClick={() => navigate('/hunting')}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Misiones
                  </button>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2 text-gray-400">/</span>
                  <span className="text-gray-900 font-medium">
                    {missionData.planName}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Header Title and Stats */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Centro de Mando: {missionData.planName}
              </h1>
              <p className="text-gray-600">
                Gestiona todos los aspectos de tu estrategia de prospección
              </p>
            </div>
            
            {/* Statistics Cards */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{opportunitiesCount}</div>
                <div className="text-sm text-gray-500">Prospectos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{campaignsCount}</div>
                <div className="text-sm text-gray-500">Campañas</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${missionData.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                  {missionData.status === 'active' ? '🟢' : '⏸️'}
                </div>
                <div className="text-sm text-gray-500">Estado</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation 
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Active Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div 
          id={`${activeTab}-panel`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
        >
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
};

export default MissionDetailPageWithTabs;