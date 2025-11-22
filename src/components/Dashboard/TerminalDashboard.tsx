import React from 'react';
import { 
  Grid, 
  Col, 
  Card, 
  Text, 
  Metric, 
  ProgressBar, 
  Badge, 
  AreaChart, 
  Title,
  Flex
} from '@tremor/react';
import { DashboardSnapshot } from '../../services/bffService';

interface Props {
  data: DashboardSnapshot;
}

// Formateador de moneda estilo financiero
const currencyFormatter = (number: number) => 
  `$${Intl.NumberFormat("us").format(number).toString()}`;

const TerminalDashboard: React.FC<Props> = ({ data }) => {
  
  // Transformación de datos para el gráfico (Simulación de serie temporal)
  const chartData = [
    { time: "09:00", Riesgo: 20, Ejecucion: 15 },
    { time: "10:00", Riesgo: 25, Ejecucion: 30 },
    { time: "11:00", Riesgo: 10, Ejecucion: 45 },
    { time: "12:00", Riesgo: 5,  Ejecucion: 60 },
    { time: "13:00", Riesgo: 40, Ejecucion: 55 },
    { time: "14:00", Riesgo: 30, Ejecucion: 70 }, // Actual
  ];

  // Colores de estado según Health Score
  const healthColor = data.radar.health_score > 80 ? "emerald" : data.radar.health_score > 50 ? "yellow" : "rose";

  return (
    <div className="bg-[#050505] min-h-screen p-6 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* HEADER TÁCTICO */}
      <div className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-1">LeadBoost System v2.1</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight">COMMAND_TERMINAL</h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 font-mono">USER_ID: {data.meta.user}</div>
          <div className="flex items-center gap-2 justify-end mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-emerald-500">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
        
        {/* KPI 1: HEALTH SCORE */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-none ring-0 shadow-none">
          <Text className="font-mono text-xs uppercase text-slate-500">System Integrity</Text>
          <Flex justifyContent="start" alignItems="baseline" className="space-x-2 mt-2">
            <Metric className="text-white font-mono text-3xl">{data.radar.health_score}%</Metric>
            <Badge size="xs" color={healthColor} className="rounded-none">STABLE</Badge>
          </Flex>
          <ProgressBar value={data.radar.health_score} color={healthColor} className="mt-4 h-1 rounded-none" />
        </Card>

        {/* KPI 2: ALERTAS ACTIVAS */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-none ring-0 shadow-none group hover:border-rose-900 transition-colors">
          <Flex justifyContent="between" alignItems="start">
            <div>
              <Text className="font-mono text-xs uppercase text-slate-500 group-hover:text-rose-500 transition-colors">Active Threats</Text>
              <Metric className="text-white font-mono text-3xl mt-2">{data.radar.active_alerts.length}</Metric>
            </div>
            <div className={`h-2 w-2 rounded-full ${data.radar.active_alerts.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
          </Flex>
          <Text className="mt-4 text-xs text-slate-600 font-mono">
            {data.radar.active_alerts.length > 0 ? "⚠ ACTION REQUIRED" : "✓ SECTOR CLEAR"}
          </Text>
        </Card>

        {/* KPI 3: PRESUPUESTO */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-none ring-0 shadow-none">
          <Text className="font-mono text-xs uppercase text-slate-500">Capital Allocation</Text>
          <Metric className="text-blue-400 font-mono text-3xl mt-2">{currencyFormatter(data.operations.governance.budget_remaining)}</Metric>
          <Text className="mt-4 text-xs text-slate-600 font-mono">
            STATUS: <span className="text-emerald-500">AUTHORIZED</span>
          </Text>
        </Card>

        {/* KPI 4: CAMPAÑAS */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-none ring-0 shadow-none">
          <Text className="font-mono text-xs uppercase text-slate-500">Active Ops</Text>
          <Metric className="text-white font-mono text-3xl mt-2">{data.operations.execution.length}</Metric>
          <div className="mt-4 flex gap-1">
            {data.operations.execution.map((_, i) => (
              <div key={i} className="h-1 w-4 bg-blue-500/50" />
            ))}
          </div>
        </Card>
      </Grid>

      {/* SECCIÓN CENTRAL: GRÁFICOS Y LOGS */}
      <Grid numItems={1} numItemsLg={3} className="gap-4">
        
        {/* GRÁFICO PRINCIPAL */}
        <Col numColSpan={1} numColSpanLg={2}>
          <Card className="bg-[#09090b] border border-slate-800 rounded-none ring-0 shadow-none h-full">
            <div className="flex justify-between items-center mb-6">
              <Title className="text-white font-mono text-sm uppercase">Anomaly Detection Trend</Title>
              <div className="flex gap-2">
                 <span className="text-[10px] text-blue-400 font-mono border border-blue-900/50 px-2 py-1">LIVE DATA</span>
              </div>
            </div>
            <AreaChart
              className="h-72 mt-4"
              data={chartData}
              index="time"
              categories={["Riesgo", "Ejecucion"]}
              colors={["rose", "blue"]}
              valueFormatter={(number) => `${number}%`}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
              curveType="monotone"
              autoMinValue={true}
            />
          </Card>
        </Col>

        {/* LOG DE ALERTAS (ESTILO CONSOLA) */}
        <Col numColSpan={1}>
          <Card className="bg-[#09090b] border border-slate-800 rounded-none ring-0 shadow-none h-full flex flex-col">
            <Title className="text-white font-mono text-sm uppercase mb-4 border-b border-slate-800 pb-2">
              Intelligence Feed
            </Title>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {data.radar.active_alerts.length === 0 ? (
                <div className="text-xs font-mono text-slate-600 italic pt-10 text-center">
                  No active signals intercepted.
                </div>
              ) : (
                data.radar.active_alerts.map((alert) => (
                  <div key={alert.id} className="border-l-2 border-rose-500 pl-3 py-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-rose-400 font-mono font-bold uppercase">{alert.type}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-tight">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Grid>
    </div>
  );
};

export default TerminalDashboard;
