import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Col, 
  Card, 
  Text, 
  Metric, 
  ProgressBar, 
  Badge, 
  Title,
  Flex
} from '@tremor/react';
import { DashboardSnapshot, getCausalInsights, CausalInsights } from '../../services/bffService';
import IntelligenceFeed from './IntelligenceFeed';
import ThreatMap from './ThreatMap';
import { Zap, CornerDownRight, Activity, ShieldAlert, Globe } from 'lucide-react';

interface Props {
  data: DashboardSnapshot;
}

// Formateador de moneda
const currencyFormatter = (number: number) => 
  `$${Intl.NumberFormat("us").format(number).toString()}`;

const TerminalDashboard: React.FC<Props> = ({ data }) => {
  
  // Estado para la MISIÓN 3: Causalidad
  const [causalInsights, setCausalInsights] = useState<CausalInsights | null>(null);
  
  useEffect(() => {
    // Carga los insights causales del Bloque 12
    getCausalInsights().then(setCausalInsights).catch(console.error);
  }, []);

  // Lógica visual de colores basada en salud
  const healthColor = data.radar.health_score > 80 ? "emerald" : data.radar.health_score > 50 ? "yellow" : "rose";
  const healthText = data.radar.health_score > 80 ? "OPTIMIZADO" : data.radar.health_score > 50 ? "PRECAUCIÓN" : "CRÍTICO";

  return (
    <div className="bg-[#050505] min-h-screen p-6 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* HEADER TÁCTICO */}
      <div className="mb-8 border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-1">
            LeadBoost Intelligence System v2.0
          </h2>
          <h1 className="text-3xl font-bold text-white tracking-tight font-mono flex items-center gap-3">
            PANEL DE CONTROL <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-900/50">B12 ACTIVE</span>
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
          <Text className="font-mono text-xs uppercase text-slate-500 flex items-center gap-2">
             <Activity size={12} /> Salud Operativa
          </Text>
          <Flex justifyContent="start" alignItems="baseline" className="space-x-2 mt-2">
            <Metric className="text-white font-mono text-3xl">{data.radar.health_score}%</Metric>
            <Badge size="xs" color={healthColor} className="rounded-none">{healthText}</Badge>
          </Flex>
          <ProgressBar value={data.radar.health_score} color={healthColor} className="mt-4 h-1 rounded-none" />
        </Card>

        {/* KPI 2: MOTOR CAUSAL (B12) */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none group hover:border-amber-900/50 transition-colors cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 blur-xl rounded-full pointer-events-none"></div>
          <Flex justifyContent="between" alignItems="start">
            <div>
              <Text className="font-mono text-xs uppercase text-slate-500 group-hover:text-amber-500 transition-colors flex items-center gap-2">
                <Zap size={12} className={causalInsights ? "text-amber-500" : "text-slate-600"}/>
                Causalidad (B12)
              </Text>
              <Metric className={`font-mono text-2xl mt-2 ${causalInsights ? 'text-amber-400' : 'text-slate-600'}`}>
                 {causalInsights ? 'CONECTADO' : 'OFFLINE'}
              </Metric>
            </div>
            <div className={`h-2 w-2 rounded-full ${causalInsights ? 'bg-amber-500 animate-pulse' : 'bg-red-900'}`} />
          </Flex>
          <Text className="mt-4 text-[10px] text-slate-500 font-mono truncate">
            {causalInsights ? "Motor de inferencia activo" : "Revisar conexión B12 (Puerto 8000)"}
          </Text>
        </Card>

        {/* KPI 3: PRESUPUESTO */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none">
          <Text className="font-mono text-xs uppercase text-slate-500">Capital Disponible</Text>
          <Metric className="text-blue-400 font-mono text-3xl mt-2">
            {currencyFormatter(data.operations.governance.budget_remaining)}
          </Metric>
          <Text className="mt-4 text-xs text-slate-600 font-mono">
            ESTADO: <span className="text-emerald-500">APROBADO</span>
          </Text>
        </Card>

        {/* KPI 4: AMENAZAS / OPERACIONES */}
        <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none">
          <Flex justifyContent="between" alignItems="start">
             <div>
                <Text className="font-mono text-xs uppercase text-slate-500 flex items-center gap-2">
                    <ShieldAlert size={12} /> Amenazas Activas
                </Text>
                <Metric className="text-white font-mono text-3xl mt-2">{data.radar.active_alerts.length}</Metric>
             </div>
             <div className="text-right">
                <Text className="font-mono text-xs uppercase text-slate-500">Campañas</Text>
                <Metric className="text-white font-mono text-xl mt-1">{data.operations.execution.length}</Metric>
             </div>
          </Flex>
          <div className="mt-4 flex gap-1">
            {data.operations.execution.map((_, i) => (
              <div key={i} className="h-1 w-4 bg-blue-500/50" />
            ))}
            {data.operations.execution.length === 0 && <div className="h-1 w-full bg-slate-800" />}
          </div>
        </Card>
      </Grid>
      
      {/* PANEL DE INSIGHTS DE CAUSALIDAD (B12) */}
      {causalInsights && (
        <div className="bg-slate-900/30 border border-amber-900/20 rounded-sm p-5 mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-1.5 bg-amber-900/20 rounded border border-amber-900/50">
                <Zap size={16} className="text-amber-500" />
             </div>
             <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                    Insights Causales (B12)
                </h3>
                <p className="text-[10px] text-amber-500/60 font-mono">ANÁLISIS DE CORRELACIÓN EN TIEMPO REAL</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            {[causalInsights.primary_insight, causalInsights.secondary_insight, causalInsights.tertiary_insight].map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-black/40 border border-slate-800/50 rounded hover:border-amber-900/30 transition-colors">
                <CornerDownRight size={14} className="flex-shrink-0 mt-0.5 text-amber-500/50" />
                <span className="text-slate-400 leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN CENTRAL: MAPA MUNDIAL + FEED */}
      {/* AUMENTAMOS LA ALTURA AQUÍ: lg:h-[480px] */}
      <Grid numItems={1} numItemsLg={3} className="gap-4 h-auto lg:h-[480px]">
        
        {/* MAPA GLOBAL (AJUSTADO) */}
        <Col numColSpan={1} numColSpanLg={2}>
          <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none h-full relative p-0 overflow-hidden flex flex-col">
             {/* Cabecera Flotante */}
             <div className="absolute top-4 left-4 z-10">
                <Title className="text-white font-mono text-sm uppercase flex items-center gap-2">
                   <Globe size={14} className="text-blue-500"/> Global Signal Origins
                </Title>
                <div className="flex gap-2 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Informational
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Critical
                    </div>
                </div>
             </div>
             
             {/* Indicador Live */}
             <div className="absolute top-4 right-4 z-10">
                 <span className="text-[9px] text-slate-600 font-mono border border-slate-800 px-2 py-1 bg-black/50">
                   LIVE MONITORING
                 </span>
             </div>

             {/* Contenedor del Mapa Centrado */}
             <div className="flex-1 w-full pt-14 flex items-center justify-center">
                <div className="w-full h-full">
                    <ThreatMap />
                </div>
             </div>
          </Card>
        </Col>

        {/* FEED DE INTELIGENCIA */}
        <Col numColSpan={1} className="h-full">
          <IntelligenceFeed signals={data.radar.market_intelligence} />
        </Col>
      </Grid>

      {/* SECCIÓN INFERIOR: LOG DE EJECUCIÓN (B7) */}
      <div className="mt-4">
         <Card className="bg-[#09090b] border border-slate-800 rounded-sm ring-0 shadow-none">
            <Title className="text-xs text-slate-500 font-mono uppercase mb-4 tracking-widest">
               Execution Log (Actuator B7)
            </Title>
            {data.operations.execution.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-600 font-mono border border-dashed border-slate-800">
                    SISTEMA EN ESPERA - SIN OPERACIONES ACTIVAS
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-500 uppercase">
                                <th className="pb-3 pl-2">ID</th>
                                <th className="pb-3">Platform</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 text-right">Spend</th>
                                <th className="pb-3 text-right pr-2">ROAS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {data.operations.execution.map((item) => (
                                <tr key={item.id} className="hover:bg-blue-900/5 transition-colors">
                                    <td className="py-3 pl-2 text-blue-400 font-bold">{item.id}</td>
                                    <td className="py-3 text-white">{item.platform}</td>
                                    <td className="py-3">
                                        <span className={`px-1.5 py-0.5 border text-[10px] rounded-sm uppercase ${
                                            item.status === 'ACTIVE' ? 'border-emerald-900 text-emerald-500 bg-emerald-900/10' : 
                                            item.status === 'LEARNING' ? 'border-blue-900 text-blue-500 bg-blue-900/10' : 'border-slate-800 text-slate-500'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right text-white font-bold">${item.spend}</td>
                                    <td className="py-3 text-right pr-2 text-yellow-500 font-bold">{item.roas}x</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
         </Card>
      </div>
    </div>
  );
};

export default TerminalDashboard;