import React from 'react';
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Header eliminado, saludo ahora solo en el header global */}

        {/* Botón Crear nueva Campaña */}
        <CreateCampaignButton />

  {/* Campañas recientes */}
  <RecentCampaigns />

  {/* Análisis de competidores */}
  <CompetitorAnalysis />

  {/* Reportes e Insights */}
  <ReportsInsights />


      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;