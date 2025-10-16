import React from 'react';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import MetricCard from '../components/Dashboard/MetricCard';
import RecentOpportunityItem from '../components/Dashboard/RecentOpportunityItem';
import TopStrategyItem from '../components/Dashboard/TopStrategyItem';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  useAuth();
  const [hasData] = React.useState(false); // Cambia manualmente para probar ambos estados

  // Datos de ejemplo para estado poblado
  const metrics = hasData
    ? [
        { title: 'Oportunidades Encontradas (Últ. 7 días)', value: 47, comparisonText: '+12% vs. semana anterior', comparisonColor: 'text-green-500' },
        { title: 'Campañas Lanzadas (Últ. 7 días)', value: 13, comparisonText: '3 activas ahora', comparisonColor: 'text-gray-500' },
        { title: 'Costo por Resultado (Promedio)', value: '$24.50', comparisonText: '-8% vs. semana anterior', comparisonColor: 'text-red-500' },
      ]
    : [
        { title: 'Oportunidades Encontradas (Últ. 7 días)', value: 0 },
        { title: 'Campañas Lanzadas (Últ. 7 días)', value: 0 },
        { title: 'Costo por Resultado (Promedio)', value: '$0' },
      ];

  const opportunities = hasData
    ? [
        { name: 'Ana García', strategy: 'Anti-Asana', signal: 'Harta de la lentitud de nuestra herramienta actual...', strategyColor: 'bg-blue-100 text-blue-700' },
        { name: 'Innovate Corp', strategy: 'Startups Financiadas', signal: 'Acaba de recibir una ronda de financiación de $5M...', strategyColor: 'bg-blue-100 text-blue-700' },
        { name: 'Juan Pérez', strategy: 'Anti-HubSpot', signal: 'Buscando alternativas más económicas a HubSpot...', strategyColor: 'bg-blue-100 text-blue-700' },
      ]
    : [];

  const strategies = hasData
    ? [
        { rank: 1, strategyName: 'Estrategia Anti-Asana', metric: '7 Reuniones Agendadas', roi: '2,500%' },
        { rank: 2, strategyName: 'Estrategia Anti-HubSpot', metric: '4 Reuniones Agendadas', roi: '1,800%' },
        { rank: 3, strategyName: 'Startups Financiadas', metric: '2 Reuniones Agendadas', roi: '950%' },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* El Pulso del Imperio */}
        <section className="mb-8">
          <div className="mb-4 text-gray-700 font-semibold">El Pulso del Imperio</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((m, idx) => (
              <MetricCard key={idx} {...m} />
            ))}
          </div>
        </section>

        {/* Inteligencia Activa */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Inteligencia Activa</h2>
          <div className="text-gray-600 mb-4 text-sm">Oportunidades más recientes detectadas por el radar</div>
          {hasData ? (
            <div>
              {opportunities.map((opp, idx) => (
                <RecentOpportunityItem key={idx} opportunity={opp} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-16 mb-4">
              <div className="mb-4">
                <span className="inline-block bg-blue-100 p-4 rounded-full">
                  <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-14a6 6 0 0 0-6 6c0 1.657.672 3.156 1.757 4.243A6.003 6.003 0 0 0 12 20a6.003 6.003 0 0 0 6-6c0-1.657-.672-3.156-1.757-4.243A6.003 6.003 0 0 0 12 4Z" fill="#2563eb"/></svg>
                </span>
              </div>
              <div className="font-semibold text-gray-700 text-lg mb-2">El radar está listo</div>
              <div className="text-gray-500 mb-4 text-sm text-center max-w-md">Aún no se han encontrado oportunidades porque no has creado ninguna estrategia de búsqueda.</div>
              <Link to="/hunting/new" className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-blue-700 transition">+ Crear mi Primera Estrategia de Búsqueda</Link>
            </div>
          )}
        </section>

        {/* Análisis Estratégico */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Análisis Estratégico</h2>
          <div className="text-gray-600 mb-4 text-sm">Ranking de tus estrategias más rentables</div>
          {hasData ? (
            <div>
              {strategies.map((s, idx) => (
                <TopStrategyItem key={idx} {...s} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-gray-500 text-center">Cuando tus estrategias empiecen a generar resultados, aquí verás un ranking de las más rentables.</div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;