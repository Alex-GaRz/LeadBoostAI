import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardCampaignTabs from '../components/Dashboard/DashboardCampaignTabs';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import CreateCampaignButton from '../components/Dashboard/CreateCampaignButton';
import RecentCampaigns from '../components/Dashboard/RecentCampaigns';
import CompetitorAnalysis from '../components/Dashboard/CompetitorAnalysis';
import ReportsInsights from '../components/Dashboard/ReportsInsights';
import ContentGallery from '../components/Dashboard/ContentGallery';

const DashboardPage: React.FC = () => {
  useAuth();
  const location = useLocation();
  const recentRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  // platforms puede venir de location.state si se acaba de crear una campaña
  const platforms = location.state?.platforms || [];

  useEffect(() => {
    if (location.hash === '#crear-campana' && createRef.current) {
      createRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (location.hash === '#campanias-recientes' && recentRef.current) {
      recentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (location.hash === '#reportes-insights' && reportsRef.current) {
      reportsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    if (location.hash === '#galeria-contenido' && galleryRef.current) {
      galleryRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Si hay plataformas, mostrar las pestañas dinámicas */}
        {platforms.length > 0 ? (
          <DashboardCampaignTabs platforms={platforms} campaignId={''} />
        ) : (
          <>
            {/* Botón Crear nueva Campaña */}
            <div id="crear-campana" ref={createRef}>
              <CreateCampaignButton />
            </div>
            {/* Campañas recientes */}
            <div id="campanias-recientes" ref={recentRef}>
              <RecentCampaigns />
            </div>
            {/* Análisis de competidores */}
            <CompetitorAnalysis />
            {/* Reportes e Insights */}
            <div id="reportes-insights" ref={reportsRef}>
              <ReportsInsights />
            </div>
            {/* Galería de Contenidos */}
            <div id="galeria-contenido" ref={galleryRef}>
              <ContentGallery />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;