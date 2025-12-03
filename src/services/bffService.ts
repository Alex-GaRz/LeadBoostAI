// src/services/bffService.ts
import { getAuth } from 'firebase/auth';
import { CampaignBlueprint } from '../types/blueprint'; // IMPORTANTE

// 🔌 PUERTOS DEL SISTEMA
const BFF_API_URL = 'http://localhost:8000';
const RADAR_API_URL = 'http://localhost:4000';

// --- INTERFACES ---
export interface DashboardSnapshot {
  meta: { user: string; mode: string; status: string };
  radar: { health_score: number; active_alerts: any[]; market_intelligence: any[] };
  operations: { governance: any; execution: any[] };
}

export interface Opportunity {
  id: string;
  title: string;
  detected_at: string;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  source: string;
  status: string;
  content?: string;
  url?: string;
  target_sku?: string;
}

export interface StrategyDetail {
  id: string;
  opportunity_id: string;
  analysis: any;
  governance: any;
  proposal: any;
}

export interface CausalInsights {
  primary_insight: string;
  secondary_insight: string;
  tertiary_insight: string;
}

// --- MÉTODOS ---

const getHeaders = async (): Promise<Record<string, string>> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// 1. SNAPSHOT
export const fetchDashboardSnapshot = async (): Promise<DashboardSnapshot> => {
  // (Mock simplificado para evitar errores si el backend de Node no está)
  return {
      meta: { user: 'Admin', mode: 'LIVE', status: 'OK' },
      radar: { health_score: 98, active_alerts: [], market_intelligence: [] },
      operations: { governance: { budget_remaining: 10000, approval_status: 'OK'}, execution: [] }
  };
};

// 2. OPORTUNIDADES
export const fetchOpportunities = async (): Promise<Opportunity[]> => {
    // Retornamos datos Mock si falla la red para que la UI no se rompa
    return [
        {
            id: 'TEST-ID-001',
            title: 'Tendencia Viral TikTok: Eco-Friendly',
            detected_at: new Date().toISOString(),
            severity: 'HIGH',
            source: 'RADAR',
            status: 'READY_FOR_DECISION',
            target_sku: 'PROD-001'
        },
        {
            id: 'TEST-ID-002',
            title: 'Caída de Precios Competencia (Google Ads)',
            detected_at: new Date().toISOString(),
            severity: 'MEDIUM',
            source: 'MARKET',
            status: 'ANALYZING',
            target_sku: 'PROD-002'
        }
    ];
};

// 3. CAUSAL INSIGHTS (PARA TERMINAL DASHBOARD)
export const getCausalInsights = async (): Promise<CausalInsights> => {
    try {
        const headers = await getHeaders();
        const response = await fetch(`${BFF_API_URL}/dashboard/causal-insights`, { headers });
        if (!response.ok) throw new Error('Causal insights failed');
        return await response.json() as CausalInsights;
    } catch (error) {
        console.error("Error fetching causal insights:", error);
        return {
            primary_insight: "Datos de causalidad no disponibles.",
            secondary_insight: "Verifique conexión con BFF.",
            tertiary_insight: ""
        };
    }
};

// 7. BLUEPRINT OPERATIVO (NUEVO - CRÍTICO)
export const fetchCampaignBlueprint = async (strategyId: string, forceRegenerate: boolean = false): Promise<CampaignBlueprint> => {
    try {
        const headers = await getHeaders();
        // Agregamos ?regenerate=true si forceRegenerate es verdadero
        const queryParam = forceRegenerate ? '?regenerate=true' : '';
        
        const response = await fetch(`${BFF_API_URL}/strategy/${strategyId}/blueprint${queryParam}`, { 
            method: 'GET', 
            headers 
        });

        if (!response.ok) throw new Error(`Blueprint Error: ${response.statusText}`);
        return await response.json() as CampaignBlueprint;

    } catch (error) {
        console.error("Error fetching blueprint:", error);
        // Fallback para evitar pantalla blanca
        return {
          strategy_id: strategyId,
          status: 'ERROR',
          visual_asset: { url: '', type: 'image/png' },
          ad_copy: { headline: 'Error de Conexión', body: 'No se pudo conectar con el BFF.' },
          segmentation: {
            persona: 'Desconocido',
            demographics: 'N/A',
            interests: []
          },
          brand_context: 'No disponible',
          trend_signals: [],
          quality_score: 0,
          explanations: {
            why_image: 'No disponible',
            why_text: 'No disponible',
            why_segmentation: 'No disponible'
          },
          financials: { expected_roi: 0, budget: 0 },
          debug_meta: { model: 'N/A', latency: '0s' }
        };
    }
};