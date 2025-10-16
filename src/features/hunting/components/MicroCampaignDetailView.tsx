import React from "react";
import AdPreview from "../../../components/Dashboard/AdPreview";

interface MicroCampaignDetailViewProps {
  campaignResult: any;
}

const MicroCampaignDetailView: React.FC<MicroCampaignDetailViewProps> = ({ campaignResult }) => {
  
  // --- INICIO DEL ADAPTADOR INTELIGENTE ---

  // 1. Construir el objeto `campaignData` que AdPreview espera.
  const campaignDataForPreview = {
    business_name: campaignResult?.business_name || "Tu Empresa",
    generated_image_url: campaignResult?.generated_image_url || ""
  };

  // 2. Extraer variantes de anuncios del formato moderno
  const variants = campaignResult?.ad_variants || 
                  campaignResult?.copyResult?.ad_variants || 
                  campaignResult?.ai_ad_variants || 
                  campaignResult?.meta_ai_ad_variants || [];

  // 3. Construir el objeto `iaData` complejo que AdPreview espera.
  const iaDataForPreview = {
    "Anuncio generado por IA": {
      "Variante 1": {
        "Título del anuncio": variants?.[0]?.title || "",
        "Texto principal": variants?.[0]?.text || variants?.[0]?.main_text || "",
        "CTA": variants?.[0]?.cta || "Más Información"
      },
      "Variante 2": {
        "Título del anuncio": variants?.[1]?.title || "",
        "Texto principal": variants?.[1]?.text || variants?.[1]?.main_text || "",
        "CTA": variants?.[1]?.cta || "Más Información"
      },
      "Variante 3": {
        "Título del anuncio": variants?.[2]?.title || "",
        "Texto principal": variants?.[2]?.text || variants?.[2]?.main_text || "",
        "CTA": variants?.[2]?.cta || "Más Información"
      }
    }
  };

  // 4. Determinar la plataforma
  const platform = Array.isArray(campaignResult?.ad_platform)
    ? campaignResult.ad_platform[0]
    : (campaignResult?.ad_platform || "Meta Ads");

  // --- FIN DEL ADAPTADOR INTELIGENTE ---

  return (
    <div className="w-full max-w-2xl mx-auto bg-brand-bg rounded-xl shadow-lg p-8 flex flex-col items-center">
      <h3 className="text-2xl font-bold text-brand-success mb-6 text-center">¡Campaña Generada con Éxito!</h3>
      <div className="w-full mb-8">
        <AdPreview
          platform={platform}
          iaData={iaDataForPreview}
          campaignData={campaignDataForPreview}
          variant={1}
          businessName={campaignDataForPreview.business_name}
        />
      </div>
  <h4 className="text-lg font-semibold mt-6 mb-2 w-full text-left text-brand-label">Variantes de Texto Generadas:</h4>
  <div className="w-full flex flex-col gap-4">
        {Array.isArray(variants) && variants.length > 0 ? (
          variants.map((variant: any, idx: number) => (
            <div
              key={idx}
              className="border border-brand-muted rounded-lg p-4 bg-brand-section shadow-sm"
            >
              <div className="font-bold text-brand-base text-base mb-1">{variant.title || `Variante ${idx + 1}`}</div>
              <div className="text-brand-text text-sm mb-2">{variant.text || variant.main_text || "Sin texto principal"}</div>
              {variant.cta && (
                <div className="text-brand-action font-semibold text-sm">CTA: {variant.cta}</div>
              )}
            </div>
          ))
        ) : (
          <p className="text-brand-muted italic">No se encontraron variantes de texto.</p>
        )}
      </div>
    </div>
  );
};

export default MicroCampaignDetailView;
