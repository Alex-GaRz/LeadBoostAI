import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardCampaignTabs from '../components/Dashboard/DashboardCampaignTabs';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import CreateCampaignButton from '../components/Dashboard/CreateCampaignButton';
import RecentCampaigns from '../components/Dashboard/RecentCampaigns';
import CompetitorAnalysis from '../components/Dashboard/CompetitorAnalysis';
import ReportsInsights from '../components/Dashboard/ReportsInsights';
import { Calendar } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const location = useLocation();
  // platforms puede venir de location.state si se acaba de crear una campaña
  const platforms = location.state?.platforms || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Si hay plataformas, mostrar las pestañas dinámicas */}
        {platforms.length > 0 ? (
          <DashboardCampaignTabs platforms={platforms} />
        ) : (
          <>
            {/* Botón Crear nueva Campaña */}
            <CreateCampaignButton />
            {/* Campañas recientes */}
            <RecentCampaigns />
            {/* Análisis de competidores */}
            <CompetitorAnalysis />
            {/* Reportes e Insights */}
            <ReportsInsights />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;