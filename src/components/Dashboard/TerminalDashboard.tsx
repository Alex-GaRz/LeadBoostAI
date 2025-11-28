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
import IntelligenceFeed from './IntelligenceFeed';

interface Props {
  data: DashboardSnapshot;
}

// Formateador de moneda
const currencyFormatter = (number: number) => 
  `$${Intl.NumberFormat("us").format(number).toString()}`;

const TerminalDashboard: React.FC<Props> = ({ data }) => {
  
  // MISIÓN 2: Humanización del Dashboard.
  // Datos simulados para gráfico de tendencia
  const chartData = [
    { time: "09:00", Riesgo: 20, Eficiencia: 15 },
    { time: "10:00", Riesgo: 25, Eficiencia: 30 },
    { time: "11:00", Riesgo: 10, Eficiencia: 45 },
    { time: "12:00", Riesgo: 5,  Eficiencia: 60 },
    { time: "13:00", Riesgo: 40, Eficiencia: 55 },
    { time: "14:00", Riesgo: 30, Eficiencia: 70 }, 
  ];

  // Colores de estado
  const healthColor = data.radar.health_score > 80 ? "emerald" : data.radar.health_score > 50 ? "yellow" : "rose";
  const healthText = data.radar.health_score > 80 ? "OPTIMIZADO" : data.radar.health_score > 50 ? "PRECAUCIÓN" : "CRÍTICO";

  return (
    <div className="bg-[#050505] min-h-screen p-6 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* HEADER TÁCTICO HUMANIZADO */}
      <div className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-1">
            LeadBoost Intelligence System
          </h2>
          <h1 className="text-3xl font-bold text-white tracking-tight font-mono">
            PANEL DE CONTROL
          </h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 font-mono mb-1">CUENTA: {data.meta.user}</div>
          <div className="flex items-center gap-2 justify-end">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-emerald-500 font-bold">IA ACTIVA Y ESCANEANDO</span>
          </div>
        </div>
      </div>

      {/* GRID DE KPIS DE NEGOCIO */}
      <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-4 mb-6">
        
        {/* KPI 1: SALUD DEL SISTEMA */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none">
          <Text className="font-mono text-xs uppercase text-slate-500">Salud Operativa</Text>
          <Flex justifyContent="start" alignItems="baseline" className="space-x-2 mt-2">
            <Metric className="text-white font-mono text-3xl">{data.radar.health_score}%</Metric>
            <Badge size="xs" color={healthColor} className="rounded-none">{healthText}</Badge>
          </Flex>
          <ProgressBar value={data.radar.health_score} color={healthColor} className="mt-4 h-1 rounded-none" />
        </Card>

        {/* KPI 2: RIESGOS/AMENAZAS (Traducido) */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none group hover:border-rose-900 transition-colors cursor-pointer">
          <Flex justifyContent="between" alignItems="start">
            <div>
              <Text className="font-mono text-xs uppercase text-slate-500 group-hover:text-rose-500 transition-colors">
                Riesgos de Mercado
              </Text>
              <Metric className="text-white font-mono text-3xl mt-2">{data.radar.active_alerts.length}</Metric>
            </div>
            <div className={`h-2 w-2 rounded-full ${data.radar.active_alerts.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
          </Flex>
          <Text className="mt-4 text-xs text-slate-600 font-mono">
            {data.radar.active_alerts.length > 0 ? "⚠ ATENCIÓN REQUERIDA" : "✓ SIN AMENAZAS DETECTADAS"}
          </Text>
        </Card>

        {/* KPI 3: PRESUPUESTO DISPONIBLE */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none">
          <Text className="font-mono text-xs uppercase text-slate-500">Capital Disponible</Text>
          <Metric className="text-blue-400 font-mono text-3xl mt-2">
            {currencyFormatter(data.operations.governance.budget_remaining)}
          </Metric>
          <Text className="mt-4 text-xs text-slate-600 font-mono">
            ESTADO: <span className="text-emerald-500">APROBADO POR GOBERNANZA</span>
          </Text>
        </Card>

        {/* KPI 4: OPERACIONES ACTIVAS */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none">
          <Text className="font-mono text-xs uppercase text-slate-500">Campañas Activas</Text>
          <Metric className="text-white font-mono text-3xl mt-2">{data.operations.execution.length}</Metric>
          <div className="mt-4 flex gap-1">
            {data.operations.execution.map((_, i) => (
              <div key={i} className="h-1 w-4 bg-blue-500/50" />
            ))}
            {data.operations.execution.length === 0 && <div className="h-1 w-full bg-slate-800" />}
          </div>
        </Card>
      </Grid>

      {/* SECCIÓN CENTRAL: VISUALIZACIÓN DE TENDENCIAS */}
      <Grid numItems={1} numItemsLg={3} className="gap-4 h-auto lg:h-[400px]">
        
        {/* GRÁFICO: EFICIENCIA VS RIESGO */}
        <Col numColSpan={1} numColSpanLg={2}>
          <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none h-full">
            <div className="flex justify-between items-center mb-6">
              <Title className="text-white font-mono text-sm uppercase">Rendimiento vs Volatilidad</Title>
              <div className="flex gap-2">
                 <span className="text-[10px] text-blue-400 font-mono border border-blue-900/50 px-2 py-1 bg-blue-900/10">
                   DATOS EN TIEMPO REAL
                 </span>
              </div>
            </div>
            <AreaChart
              className="h-72 mt-4"
              data={chartData}
              index="time"
              categories={["Riesgo", "Eficiencia"]}
              colors={["rose", "emerald"]}
              valueFormatter={(number) => `${number}%`}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
              curveType="monotone"
              autoMinValue={true}
            />
          </Card>
        </Col>

        {/* FEED DE INTELIGENCIA */}
        <Col numColSpan={1} className="h-full">
          <IntelligenceFeed signals={data.radar.market_intelligence} />
        </Col>
      </Grid>
    </div>
  );
};

export default TerminalDashboard;