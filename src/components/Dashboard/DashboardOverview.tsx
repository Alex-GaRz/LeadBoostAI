import React from 'react';
import { Grid, Col, Card, Text, Metric, Flex, ProgressBar, BadgeDelta, DonutChart, Legend, AreaChart } from '@tremor/react';
import { DashboardSnapshot } from '../../services/bffService';

interface OverviewProps {
  data: DashboardSnapshot;
}

const valueFormatter = (number: number) => 
  `$ ${new Intl.NumberFormat("us").format(number).toString()}`;

const DashboardOverview: React.FC<OverviewProps> = ({ data }) => {
  
  // Datos derivados para gráficos (Simulación de histórico basada en snapshot actual)
  const chartData = [
    { date: "00:00", Spend: data.operations.execution.reduce((acc, c) => acc + c.spend * 0.8, 0) },
    { date: "06:00", Spend: data.operations.execution.reduce((acc, c) => acc + c.spend * 0.9, 0) },
    { date: "12:00", Spend: data.operations.execution.reduce((acc, c) => acc + c.spend, 0) }, // Actual
    { date: "18:00", Spend: data.operations.execution.reduce((acc, c) => acc + c.spend * 1.1, 0) }, // Proyección
  ];

  const platformDistribution = data.operations.execution.map(c => ({
    name: c.platform,
    value: c.spend
  }));

  return (
    <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-6">
      
      {/* COL 1: Métricas Principales */}
      <Col numColSpan={1} numColSpanLg={2}>
        <Grid numItems={1} numItemsSm={3} className="gap-6">
          
          {/* Health Score */}
          <Card decoration="top" decorationColor="emerald" className="bg-slate-900 ring-slate-800">
            <Flex justifyContent="start" className="space-x-4">
              <div className="truncate">
                <Text className="font-mono uppercase tracking-wider text-slate-500 text-xs">System Health</Text>
                <Metric className="text-emerald-400 font-mono">{data.radar.health_score}%</Metric>
              </div>
              <BadgeDelta deltaType="increase" isIncreasePositive={true} size="xs">+2.1%</BadgeDelta>
            </Flex>
            <ProgressBar value={data.radar.health_score} color="emerald" className="mt-3" />
          </Card>

          {/* Budget */}
          <Card decoration="top" decorationColor="blue" className="bg-slate-900 ring-slate-800">
            <Text className="font-mono uppercase tracking-wider text-slate-500 text-xs">Budget Available</Text>
            <Metric className="text-blue-400 font-mono">{valueFormatter(data.operations.governance.budget_remaining)}</Metric>
            <Text className="mt-2 text-slate-500 text-xs">Status: {data.operations.governance.approval_status}</Text>
          </Card>

          {/* Active Alerts */}
          <Card decoration="top" decorationColor="amber" className="bg-slate-900 ring-slate-800">
            <Text className="font-mono uppercase tracking-wider text-slate-500 text-xs">Threat Level</Text>
            <Flex justifyContent="start" alignItems="baseline" className="space-x-1">
              <Metric className="text-amber-400 font-mono">{data.radar.active_alerts.length}</Metric>
              <Text className="text-slate-500">active signals</Text>
            </Flex>
          </Card>
        </Grid>

        {/* Gráfico Principal */}
        <Card className="mt-6 bg-slate-900 ring-slate-800">
          <Text className="font-mono uppercase tracking-wider text-slate-500 text-xs">Spend Velocity (24h)</Text>
          <AreaChart
            className="h-72 mt-4"
            data={chartData}
            index="date"
            categories={["Spend"]}
            colors={["cyan"]}
            valueFormatter={valueFormatter}
            showLegend={false}
            showGridLines={false}
            startEndOnly={true}
            curveType="monotone"
          />
        </Card>
      </Col>

      {/* COL 2: Distribución y Mapa (Stack Vertical) */}
      <Col numColSpan={1} numColSpanLg={1}>
        <div className="flex flex-col gap-6 h-full">
          
          {/* Distribución de Gasto */}
          <Card className="bg-slate-900 ring-slate-800">
            <Text className="font-mono uppercase tracking-wider text-slate-500 text-xs mb-4">Platform Allocation</Text>
            <DonutChart
              className="mt-6"
              data={platformDistribution}
              category="value"
              index="name"
              valueFormatter={valueFormatter}
              colors={["indigo", "violet", "fuchsia"]}
            />
            <Legend
              className="mt-3"
              categories={platformDistribution.map(p => p.name)}
              colors={["indigo", "violet", "fuchsia"]}
            />
          </Card>

          {/* Espacio para Mapa (Placeholder o Componente Real) */}
          <div className="flex-grow min-h-[200px]">
             {/* Aquí inyectaremos el mapa en el layout principal */}
             <div className="h-full w-full bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-slate-600 text-xs font-mono">
                [MAP MODULE ACTIVE]
             </div>
          </div>
        </div>
      </Col>
    </Grid>
  );
};

export default DashboardOverview;
