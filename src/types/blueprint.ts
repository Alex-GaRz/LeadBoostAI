export interface VisualAsset {
    url: string;
    type: 'image/png' | 'image/jpeg';
}

export interface AdCopy {
    headline: string;
    body: string;
}

export interface Segmentation {
    persona: string;
    demographics: string;
    interests: string[];
}

export interface Explanations {
    why_image: string;
    why_text: string;
    why_segmentation: string;
}

export interface Financials {
    expected_roi: number;
    budget: number;
}

export interface DebugMeta {
    model: string;
    latency: string;
}

export interface CampaignBlueprint {
    strategy_id: string;
    status: 'READY_FOR_APPROVAL' | 'REGENERATING' | 'ERROR';
    
    visual_asset: VisualAsset;
    ad_copy: AdCopy;
    
    // Nuevos Campos Fase 20
    segmentation: Segmentation;
    brand_context: string;
    trend_signals: string[];
    quality_score: number;
    explanations: Explanations;
    
    financials: Financials;
    debug_meta: DebugMeta;
}