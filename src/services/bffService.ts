// src/services/bffService.ts
// VERSIÓN FINAL FASE 19 - LIMPIA Y SIN DUPLICADOS

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
  content?: string;
  url?: string;
  target_sku?: string;
  estimated_cost?: number;
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

// --- INTERFACES BLOQUE 12 (OPTIMIZADOR) ---

export interface MonteCarloSimulationResult {
  recommended_action_type: string;
  projected_roi: number;
  justification: string;
  causal_insights: string;
  probability_distribution: {
    range_1x: number;
    range_2x: number;
    range_3x: number;
    range_4x: number;
  };
}

export interface CausalInsights {
    primary_insight: string;
    secondary_insight: string;
    tertiary_insight: string;
}

// --- INTERFACES FASE 19 (OMNISCIENCIA) ---

export interface SafetyStatus {
    global_lock: boolean;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    active_warnings: string[];
}

export interface VisionSignal {
    id: string;
    source: string;
    content_text: string;
    url?: string;
    sentiment_score: number;
    created_at: string;
}

// --- MÉTODOS DEL SERVICIO ---

const getHeaders = async (): Promise<Record<string, string>> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    return { 'Content-Type': 'application/json' };
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// 1. SNAPSHOT
export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  try {
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

    const active_alerts = signals.slice(0, 5).map((s: any) => ({
      id: s.id || Math.random().toString(),
      type: 'NEWS',
      severity: s.analysis?.urgency === 'high' ? 'CRITICAL' : 'LOW',
      message: (s.title || s.cleanContent || s.content_text || 'Señal detectada').substring(0, 100),
      timestamp: s.created_at || new Date().toISOString()
    }));

    const market_intelligence = signals.map((s: any) => ({
      id: s.id || Math.random().toString(),
      source: s.source || 'RADAR',
      topic: (s.title || s.cleanContent || '').substring(0, 60) + '...',
      sentiment: s.analysis?.sentimentLabel || 'neutral',
      timestamp: s.created_at || new Date().toISOString()
    }));

    return {
      meta: { user: 'Admin', mode: 'LIVE_STREAM', status: 'OPTIMAL' },
      radar: {
        health_score: 98,
        active_alerts: active_alerts.length > 0 ? active_alerts : [
           { id: 'sys', type: 'SYSTEM', severity: 'LOW', message: 'Esperando nuevas señales...', timestamp: new Date().toISOString() }
        ],
        market_intelligence: market_intelligence
      },
      operations: {
        governance: { budget_remaining: 12450, approval_status: 'ACTIVE' },
        execution: [
          { id: 'EXE-901', platform: 'Meta Ads', status: 'ACTIVE', spend: 450, roas: 2.4 },
          { id: 'EXE-902', platform: 'Google', status: 'LEARNING', spend: 120, roas: 1.1 }
        ]
      }
    };

  } catch (error) {
    console.error("Error fetching dashboard snapshot:", error);
    return {
      meta: { user: 'Admin', mode: 'OFFLINE', status: 'ERROR' },
      radar: { health_score: 0, active_alerts: [], market_intelligence: [] },
      operations: { governance: { budget_remaining: 0, approval_status: 'ERROR' }, execution: [] }
    };
  }
};

// 2. OPORTUNIDADES
export const fetchOpportunities = async (): Promise<Opportunity[]> => {
  try {
    const headers = await getHeaders();
    const response = await fetch(`${RADAR_API_URL}/api/radar/signals?limit=10`, { 
      method: 'GET', 
      headers 
    });

    if (!response.ok) throw new Error(`Radar Error: ${response.statusText}`);
    const json = await response.json();
    const items = json.data || json.signals || json.result || [];

    return items.map((signal: any) => {
        let title = signal.title || signal.cleanContent || signal.content_text || signal.message || 'Señal Sin Título';
        if (title.length > 60) title = title.substring(0, 60) + '...';

        let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
        if (signal.analysis?.urgency === 'high') severity = 'CRITICAL';
        else if (signal.analysis?.sentimentScore < -0.5) severity = 'HIGH';

        return {
            id: signal.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            detected_at: signal.created_at || new Date().toISOString(),
            severity: severity,
            source: (signal.source || 'Radar').toUpperCase(),
            status: 'READY_FOR_DECISION',
            content: signal.cleanContent || signal.content_text || '',
            url: signal.url,
            target_sku: 'PROD-001',
            estimated_cost: Math.floor(Math.random() * 5000) + 500
        };
    });

  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return [];
  }
};

// 3. ESTRATEGIA
export const fetchStrategyDetail = async (opportunityId: string): Promise<StrategyDetail> => {
  return new Promise(resolve => setTimeout(() => {
    resolve({
      id: `STRAT-${opportunityId.substring(0, 6)}`,
      opportunity_id: opportunityId,
      analysis: {
        summary: `Análisis táctico de señal ID: ${opportunityId}.`,
        market_context: "Tendencia detectada.",
        ai_debate: [
          { agent: 'Growth Officer', message: "Oportunidad viral.", sentiment: 'aggressive' },
          { agent: 'Risk Manager', message: "Verificar fuente.", sentiment: 'cautious' },
          { agent: 'Tech Lead', message: "Factible.", sentiment: 'neutral' }
        ]
      },
      governance: {
        status: 'APPROVED',
        score: 85,
        checks: [{ rule: 'Budget Cap', passed: true, detail: 'OK' }]
      },
      proposal: {
        action_type: 'LINKEDIN_POST',
        parameters: { tone: 'Professional' },
        estimated_cost: 0,
        estimated_impact: "High"
      }
    });
  }, 800));
};

// 4. EJECUCIÓN
export const executeAction = async (strategyId: string): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, 1500));
};

// 5. OPTIMIZADOR (BLOQUE 12)
export const runSimulation = async (
    actionType: string, 
    targetSku: string, 
    currentInventory: number
): Promise<MonteCarloSimulationResult> => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${BFF_API_URL}/optimizer/simulation`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                action_type: actionType,
                target_sku: targetSku,
                current_inventory: currentInventory
            })
        });

        if (!response.ok) throw new Error('Simulation endpoint failed');
        return await response.json();
    } catch (error) {
        console.warn("Simulation Mock Triggered:", error);
        return {
            recommended_action_type: "HOLD",
            projected_roi: 1.5,
            justification: "Simulación Mock (Backend no disponible)",
            causal_insights: "Datos no disponibles",
            probability_distribution: { range_1x: 0.1, range_2x: 0.2, range_3x: 0.5, range_4x: 0.2 }
        };
    }
};

export const getCausalInsights = async (): Promise<CausalInsights> => {
    try {
      const headers = await getHeaders();
      const response = await fetch(`${BFF_API_URL}/optimizer/causality`, { headers });
      if (!response.ok) throw new Error('Causality failed');
      return await response.json();
    } catch (error) {
      return {
          primary_insight: "Datos de causalidad no disponibles.",
          secondary_insight: "Verifique conexión con BFF.",
          tertiary_insight: ""
      };
    }
};

// 6. OMNISCIENCIA (FASE 19)

export const getSafetyStatus = async (): Promise<SafetyStatus> => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${BFF_API_URL}/safety/status`, { headers });
        if (!response.ok) throw new Error('Safety check failed');
        return await response.json();
    } catch (e) {
        return { global_lock: false, risk_level: 'LOW', message: 'Offline Mode', active_warnings: [] };
    }
};

export const getVisionAlerts = async (): Promise<VisionSignal[]> => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${BFF_API_URL}/vision/signals`, { headers });
        if (!response.ok) throw new Error('Vision fetch failed');
        return await response.json();
    } catch (e) {
        console.error("Vision DB Error", e);
        return [];
    }
};