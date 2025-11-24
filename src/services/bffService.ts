// src/services/bffService.ts

import { getAuth } from 'firebase/auth';

// 🔌 PUERTOS DEL SISTEMA
const BFF_API_URL = 'http://localhost:8000';   // Python Microservices (Cerebro)
const RADAR_API_URL = 'http://localhost:4000'; // Node.js Ingestion Engine (Ojos)

// --- INTERFACES DE DATOS ---

export interface DashboardSnapshot {
  meta: {
    user: string;
    mode: string;
    status: string;
  };
  radar: {
    health_score: number;
    active_alerts: Array<{
      id: string;
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      message: string;
      timestamp: string;
    }>;
    market_intelligence: Array<{
      id: string;
      source: string;
      topic: string;
      sentiment: 'negative' | 'neutral' | 'positive';
      timestamp: string;
    }>;
  };
  operations: {
    governance: {
      budget_remaining: number;
      approval_status: string;
    };
    execution: Array<{
      id: string;
      platform: string;
      status: string;
      spend: number;
      roas: number;
    }>;
  };
}

export interface Opportunity {
  id: string;
  title: string;
  detected_at: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  source: string;
  status: 'PENDING' | 'ANALYZING' | 'READY_FOR_DECISION' | 'EXECUTED' | 'DISMISSED';
  // Campos adicionales para detalle real
  content?: string;
  url?: string;
}

export interface StrategyDetail {
  id: string;
  opportunity_id: string;
  analysis: {
    summary: string;
    market_context: string;
    ai_debate: Array<{
      agent: 'Growth Officer' | 'Risk Manager' | 'Tech Lead';
      message: string;
      sentiment: 'aggressive' | 'cautious' | 'neutral';
    }>;
  };
  governance: {
    status: 'APPROVED' | 'REJECTED' | 'HITL_REQUIRED';
    score: number;
    checks: Array<{
      rule: string;
      passed: boolean;
      detail: string;
    }>;
  };
  proposal: {
    action_type: string;
    parameters: Record<string, any>;
    estimated_cost: number;
    estimated_impact: string;
  };
}

// --- MÉTODOS DEL SERVICIO ---

const getHeaders = async (): Promise<Record<string, string>> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    // Retornamos headers básicos si no hay usuario, para no romper en dev
    return { 'Content-Type': 'application/json' };
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// 1. SNAPSHOT (Sigue apuntando al BFF Python por ahora)
export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  try {
    // 1. SOLICITUD DE DATOS REALES
    // Pedimos las últimas 15 señales para llenar el tablero
    const headers = await getHeaders();
    const response = await fetch(`${RADAR_API_URL}/api/radar/signals?limit=15`, { 
      method: 'GET', 
      headers 
    });

    let signals = [];
    if (response.ok) {
      const json = await response.json();
      signals = json.data || json.signals || [];
    }

    // 2. PROCESAMIENTO PARA EL DASHBOARD
    
    // A) Para el Ticker de Noticias (Barra Superior)
    // Tomamos las 5 más recientes
    const active_alerts = signals.slice(0, 5).map((s: any) => ({
      id: s.id || Math.random().toString(),
      type: 'NEWS', // Icono genérico
      severity: s.analysis?.urgency === 'high' ? 'CRITICAL' : 'LOW',
      // Usamos el título o un extracto limpio
      message: (s.title || s.cleanContent || s.content_text || 'Señal detectada').substring(0, 100),
      timestamp: s.created_at || new Date().toISOString()
    }));

    // B) Para el Feed de Inteligencia (Columna Derecha)
    // Mapeamos para mostrar fuente y sentimiento
    const market_intelligence = signals.map((s: any) => ({
      id: s.id || Math.random().toString(),
      source: s.source || 'RADAR',
      topic: (s.title || s.cleanContent || '').substring(0, 60) + '...',
      sentiment: s.analysis?.sentimentLabel || 'neutral',
      timestamp: s.created_at || new Date().toISOString()
    }));

    // 3. RETORNO DEL SNAPSHOT FUSIONADO
    return {
      meta: { 
        user: 'Admin', 
        mode: 'LIVE_STREAM', // Indicador visual de que son datos vivos
        status: 'OPTIMAL' 
      },
      radar: {
        health_score: 98, // KPI simulado (B11 pendiente)
        active_alerts: active_alerts.length > 0 ? active_alerts : [
           { id: 'sys', type: 'SYSTEM', severity: 'LOW', message: 'Esperando nuevas señales del satélite...', timestamp: new Date().toISOString() }
        ],
        market_intelligence: market_intelligence
      },
      operations: {
        // Datos financieros simulados (se conectarán con B11 Enterprise en Fase 4)
        governance: { budget_remaining: 12450, approval_status: 'ACTIVE' },
        execution: [
          // Log de ejecución simulado (B7)
          { id: 'EXE-901', platform: 'Meta Ads', status: 'ACTIVE', spend: 450, roas: 2.4 },
          { id: 'EXE-902', platform: 'Google', status: 'LEARNING', spend: 120, roas: 1.1 }
        ]
      }
    };

  } catch (error) {
    console.error("Error fetching dashboard snapshot:", error);
    // Fallback de seguridad para no romper la UI
    return {
      meta: { user: 'Admin', mode: 'OFFLINE', status: 'ERROR' },
      radar: { health_score: 0, active_alerts: [], market_intelligence: [] },
      operations: { governance: { budget_remaining: 0, approval_status: 'ERROR' }, execution: [] }
    };
  }
};

// 2. OPORTUNIDADES REALES (Conectado al Node.js Backend)
// En src/services/bffService.ts

// En src/services/bffService.ts

// ... (resto del código igual)

export const fetchOpportunities = async (): Promise<Opportunity[]> => {
  try {
    const headers = await getHeaders();
    console.log("📡 [BFF] Solicitando oportunidades a:", `${RADAR_API_URL}/api/radar/signals`);
    
    const response = await fetch(`${RADAR_API_URL}/api/radar/signals?limit=10`, { 
      method: 'GET', 
      headers 
    });

    if (!response.ok) {
      console.error(`❌ [BFF] Error HTTP: ${response.status}`);
      throw new Error(`Radar Error: ${response.statusText}`);
    }
    
    const json = await response.json();
    console.log("📦 [BFF] Datos recibidos:", json);

    const items = json.data || json.signals || json.result || [];
    
    if (items.length === 0) {
      console.warn("⚠️ [BFF] La lista de señales está vacía.");
    }

    // MAPEO INTELIGENTE: Adapta cualquier formato de señal al formato de la UI
    return items.map((signal: any) => {
        // 1. Determinar el Título
        let title = signal.title;
        if (!title && signal.cleanContent) title = signal.cleanContent.substring(0, 60) + '...';
        if (!title && signal.content_text) title = signal.content_text.substring(0, 60) + '...';
        if (!title && signal.message) title = signal.message;
        if (!title) title = 'Señal Sin Título Detectada';

        // 2. Determinar la Severidad
        let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (signal.analysis?.urgency === 'high') severity = 'CRITICAL';
        else if (signal.analysis?.sentimentScore < -0.5) severity = 'HIGH';
        else if (signal.test) severity = 'LOW';

        // 3. Determinar la Fuente
        let source = signal.source || 'Radar System';
        if (signal.test) source = 'System Test';

        return {
            id: signal.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            detected_at: signal.created_at || signal.ingested_at || new Date().toISOString(),
            severity: severity,
            source: source.toUpperCase(),
            status: 'READY_FOR_DECISION',
            content: signal.cleanContent || signal.content_text || signal.message || '',
            url: signal.url || signal.original_url
        };
    });

  } catch (error) {
    console.error("🚨 [BFF] Fallo crítico al obtener oportunidades:", error);
    return [
      { 
        id: 'MOCK-ERR', 
        title: '⚠️ Error de Conexión - Revisa la Consola', 
        detected_at: new Date().toISOString(), 
        severity: 'CRITICAL', 
        source: 'SYSTEM', 
        status: 'PENDING' 
      }
    ];
  }
};

const AGENT_PERSONALITIES = {
  growth: ["Esta noticia es viral. Recomiendo publicar opinión experta.", "Oportunidad de Newsjacking detectada.", "El interés de búsqueda está subiendo, ¡actuemos ya!"],
  risk: ["Verificar veracidad de la fuente antes de compartir.", "Cuidado con el sentimiento negativo en los comentarios.", "Riesgo de marca si nos asociamos a este tema polémico."],
  tech: ["Contenido técnico relevante. Aprobado.", "La tecnología mencionada es emergente.", "Coincide con nuestro stack tecnológico."]
};

// Actualiza esta función para que reciba el título/contexto (Simulado por ahora recuperando del ID o pasando el objeto)
// NOTA: Para esta fase, simularemos que el ID contiene info o haremos un lookup rápido si tuvieramos estado global.
// Como BFF es stateless, generaremos un análisis genérico pero COHERENTE con el hecho de ser una noticia.

export const fetchStrategyDetail = async (opportunityId: string): Promise<StrategyDetail> => {
  // Simulamos latencia de "Pensamiento de IA"
  return new Promise(resolve => setTimeout(() => {
    
    // Generamos variaciones aleatorias para que no parezca siempre lo mismo
    const randomGrowth = AGENT_PERSONALITIES.growth[Math.floor(Math.random() * AGENT_PERSONALITIES.growth.length)];
    const randomRisk = AGENT_PERSONALITIES.risk[Math.floor(Math.random() * AGENT_PERSONALITIES.risk.length)];
    
    resolve({
      id: `STRAT-${opportunityId.substring(0, 6).toUpperCase()}`,
      opportunity_id: opportunityId,
      analysis: {
        summary: `Análisis táctico de señal entrante ID: ${opportunityId}. Se detecta relevancia alta para los objetivos de la campaña.`,
        market_context: "Tendencia alcista detectada en sector tecnológico (Cross-reference: Google Trends).",
        ai_debate: [
          { agent: 'Growth Officer', message: randomGrowth, sentiment: 'aggressive' },
          { agent: 'Risk Manager', message: randomRisk, sentiment: 'cautious' },
          { agent: 'Tech Lead', message: "Factibilidad técnica confirmada. Relevancia semántica: 89%.", sentiment: 'neutral' }
        ]
      },
      governance: {
        status: Math.random() > 0.3 ? 'APPROVED' : 'HITL_REQUIRED', // 30% de probabilidad de requerir humano
        score: Math.floor(Math.random() * (99 - 75) + 75),
        checks: [
          { rule: 'Source Credibility', passed: true, detail: 'Verified Publisher (NewsAPI)' },
          { rule: 'Brand Safety', passed: true, detail: 'Sentiment Analysis > 0.2' },
          { rule: 'Budget Cap', passed: true, detail: 'Estimated cost within limits' }
        ]
      },
      proposal: {
        action_type: 'LINKEDIN_SMART_POST',
        parameters: { 
          tone: 'Thought Leader', 
          hashtags: ['#TechNews', '#Innovation', '#AI'],
          posting_time: 'Immediate' 
        },
        estimated_cost: 0,
        estimated_impact: "+850 Impressions Est."
      }
    });
  }, 800)); // 800ms de "pensamiento"
};

// 4. EJECUCIÓN (Simulada hacia B7)
export const executeAction = async (strategyId: string): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, 1500));
};