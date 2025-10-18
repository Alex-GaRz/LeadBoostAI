import React from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import MicroCampaignDetailView from '../features/hunting/components/MicroCampaignDetailView';
import { useAuth } from '../hooks/useAuth';

const BatchResultsPage: React.FC = () => {
  const location = useLocation();
  const { strategyId } = useParams();
  const { user } = useAuth();
  
  // Leer los resultados del estado de navegación (datos generados)
  const generatedCampaigns = location.state?.results || [];
  
  // Filtrar solo las campañas exitosas
  const successfulCampaigns = generatedCampaigns.filter((campaign: any) => campaign.success);
  
  // Nombre de la empresa del usuario (anunciante)
  const userBusinessName = user?.displayName || user?.email?.split('@')[0] || "Tu Empresa";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ¡Éxito! Se han generado {successfulCampaigns.length} campañas.
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                A continuación, puedes revisar cada una de las campañas personalizadas que la IA ha creado para tus prospectos.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                to={`/hunting/${strategyId}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ← Volver al Panel de Prospectos
              </Link>
              <Link
                to="/generated-campaigns"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Ver Todas las Campañas →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen de resultados */}
      {successfulCampaigns.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campañas Disponibles</h2>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{successfulCampaigns.length}</div>
              <div className="text-sm text-gray-600">Campañas Encontradas</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de campañas exitosas */}
      {successfulCampaigns.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Campañas Generadas</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {successfulCampaigns.map((campaign: any, index: number) => (
              <div
                key={campaign.campaignId || index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Header de la campaña */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {campaign.targetName || `Campaña ${index + 1}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {campaign.companyName}
                  </p>
                  {campaign.campaignId && (
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {campaign.campaignId}
                    </p>
                  )}
                </div>

                {/* Vista previa de la campaña */}
                <div className="p-6">
                  <MicroCampaignDetailView
                    campaignResult={campaign}
                    userBusinessName={userBusinessName}
                  />
                </div>

                {/* Footer con acciones */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>
                      {campaign.ad_variants_count || 3} variantes generadas
                    </span>
                    <span className="text-green-600 font-medium">
                      ✓ Completada
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No se encontraron campañas</h2>
            <p className="text-gray-600">
              No hay campañas generadas para esta estrategia aún.
            </p>
          </div>
        </div>
      )}

      {/* Estado vacío - cuando no hay campañas */}
      {successfulCampaigns.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-6xl text-gray-300 mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No hay campañas generadas
            </h2>
            <p className="text-gray-600 mb-8">
              No se encontraron campañas generadas para esta estrategia. 
              Genera algunas campañas primero desde el panel de prospectos.
            </p>
            <Link
              to={`/hunting/${strategyId}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              ← Volver al Panel de Prospectos
            </Link>
          </div>
        </div>
      )}

      {/* Botones de navegación inferiores */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center space-x-4">
          <Link
            to={`/hunting/${strategyId}`}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ← Volver al Panel de Prospectos
          </Link>
          <Link
            to="/generated-campaigns"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Ir a Todas las Campañas Generadas →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BatchResultsPage;