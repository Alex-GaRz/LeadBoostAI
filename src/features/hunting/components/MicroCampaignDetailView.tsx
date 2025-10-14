import React from "react";
import AdPreview from "../../../components/Dashboard/AdPreview";

interface MicroCampaignDetailViewProps {
  campaignResult: any;
}

// ...existing code...
const MicroCampaignDetailView: React.FC<MicroCampaignDetailViewProps> = ({ campaignResult }) => {
  console.log("--- DATOS CRUDOS QUE LLEGAN AL PREVIEW ---", campaignResult);
  // Extraer la primera variante de anuncio
  const variants = campaignResult?.ai_ad_variants || campaignResult?.meta_ai_ad_variants || [];
  const firstVariant = Array.isArray(variants) && variants.length > 0 ? variants[0] : undefined;
  const imageUrl = campaignResult?.generated_image_url || "https://via.placeholder.com/400x300?text=Sin+Imagen";

  // Adaptar props para AdPreview
  const platform = Array.isArray(campaignResult?.ad_platform)
    ? campaignResult.ad_platform[0]
    : (campaignResult?.ad_platform || "Meta Ads");
  const iaData = {
    "Anuncio generado por IA": {
      "Variante 1": {
        "Título del anuncio": firstVariant?.title || "Título no Disponible",
        "Texto principal": firstVariant?.main_text || "Texto principal no disponible",
        "CTA": firstVariant?.cta || "Más información",
      }
    }
  };
  const campaignData = {
    generated_image_url: imageUrl,
    business_name: campaignResult?.business_name || "Empresa Desconocida",
    // Puedes mapear más campos si AdPreview los requiere
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-brand-bg rounded-xl shadow-lg p-8 flex flex-col items-center">
      <h3 className="text-2xl font-bold text-brand-success mb-6 text-center">¡Campaña Generada con Éxito!</h3>
      <div className="w-full mb-8">
        <AdPreview
          platform={platform}
          iaData={iaData}
          campaignData={campaignData}
          variant={1}
          businessName={campaignResult?.business_name || "Empresa Desconocida"}
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
              <div className="text-brand-text text-sm mb-2">{variant.main_text || "Sin texto principal"}</div>
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
