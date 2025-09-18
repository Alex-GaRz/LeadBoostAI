import React, { useState, useEffect, useRef } from 'react';
// Modal de confirmación para editar campaña
interface ConfirmEditModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  creditCost?: number;
}
const ConfirmEditModal: React.FC<ConfirmEditModalProps> = ({ open, onCancel, onConfirm, creditCost = 1 }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
  <h2 className="text-lg font-bold text-gray-900 mb-5 text-center">¿Estás seguro que quieres editar?</h2>
  <p className="text-gray-700 mb-4">Editar esta campaña consumirá <span className="font-semibold text-blue-600">créditos</span>. ¿Deseas continuar?</p>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">Continuar</button>
        </div>
      </div>
    </div>
  );
};
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import CampaignPDF from './CampaignPDF';
import { Users, UploadCloud, CalendarDays, DollarSign, Target, Edit3, Download } from 'lucide-react';
import AdPreview from './AdPreview';

export interface CampaignData {
  objetivo?: string;
  budget_amount?: string;
  budget_currency?: string;
  duracion?: string;
  target_audience?: string;
  publico?: string;
  locations?: string[];
  lugares?: string[];
  business_name?: string;
  generated_image_url?: string;
  recursos?: string;
  user_image_url?: string;
  product_service?: string;
}

export interface IaData {
  "Anuncio generado por IA"?: {
    [key: string]: {
      "Título del anuncio"?: string;
      "Texto principal"?: string;
      "CTA"?: string;
      "Ideas de imágenes/videos"?: string;
      "Formatos sugeridos"?: string[];
      "Audiencias personalizadas/lookalikes"?: string[];
      "Título sugerido"?: string;
      "Descripción corta"?: string;
      "Keywords recomendadas"?: string[];
      "Estrategia de puja"?: string;
      "Negative keywords"?: string[];
      "Extensiones de anuncio"?: string[];
    };
  };
  "Resultados esperados"?: {
    "Audiencia"?: string;
    "Conversiones"?: string;
    "CPC"?: string;
    "CTR"?: string;
    "Alcance"?: string;
    "ROAS"?: string;
    "Engagement rate"?: string;
  };
  "Nombre de campaña"?: string;
  [key: string]: any; // Permitir indexación dinámica
}
interface DashboardCampaignTabsProps {
  platforms: string[];
  campaignId: string;
  campaignData?: CampaignData;
}

const DashboardCampaignTabs: React.FC<DashboardCampaignTabsProps> = ({ platforms, campaignId, campaignData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(platforms[0] || '');
  const [iaTitle, setIaTitle] = useState<string | null>(null);
  const [iaData, setIaData] = useState<IaData | null>(null);
  const [showOtherPreviews, setShowOtherPreviews] = useState(false); // Estado para vistas previas ocultas
  const [showPreview, setShowPreview] = useState(true); // Estado para la vista de solo texto
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);




  // Refs separados para Meta Ads y Google Ads
  const metaAdPreviewRefs = [useRef(null), useRef(null), useRef(null)];
  const googleAdPreviewRefs = [useRef(null), useRef(null), useRef(null)];

  const handleExportPDF = async () => {
    if (!iaData) {
      console.error("No IA data available to generate PDF.");
      return;
    }

    // Generate the PDF blob
    const blob = await pdf(<CampaignPDF campaignData={campaignData} iaData={iaData} />).toBlob();

    // Sanitize the business name for the filename
    const businessName = campaignData?.business_name || 'Campaña';
    const safeFileName = businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Save the PDF
    saveAs(blob, `Reporte_Campaña_${safeFileName}.pdf`);
  };

  // Helper: get correct IA data block depending on campaign type and active tab
  const isMixta = platforms.some(p => p === 'MetaAds' || p === 'Meta Ads') && platforms.some(p => p === 'GoogleAds' || p === 'Google Ads');
  let currentIaData = iaData;
  if (isMixta && iaData && (iaData as any)[activeTab]) {
    currentIaData = (iaData as any)[activeTab];
  }

  // Determina la otra plataforma para las vistas ocultas
  const otherPlatform = activeTab === 'Meta Ads' ? 'Google Ads' : 'Meta Ads';
  const otherIaData = isMixta && iaData ? (iaData as any)[otherPlatform] : null;
  const otherRefs = activeTab === 'Meta Ads' ? googleAdPreviewRefs : metaAdPreviewRefs;

  // Función para mapear los datos de la IA de Firestore a los nombres esperados por el dashboard
  function mapAIDataFromFirestore(docData: any): IaData {
    // Mapeo para campañas mixtas y simples
    const result: IaData = {};
    // Google Ads
    if (Array.isArray(docData.google_ai_ad_variants)) {
      const googleVariants: { [key: string]: any } = {};
      docData.google_ai_ad_variants.forEach((variant: any, idx: number) => {
        googleVariants[`Variante ${idx + 1}`] = {
          "Título sugerido": variant.suggested_title,
          "Descripción corta": variant.short_description,
          "Keywords recomendadas": variant.recommended_keywords,
          "CTA": variant.cta,
          "Estrategia de puja": variant.bidding_strategy,
          "Negative keywords": variant.negative_keywords,
          "Extensiones de anuncio": variant.ad_extensions,
        };
      });
      result["Google Ads"] = {
        "Anuncio generado por IA": googleVariants,
        "Resultados esperados": {
          "Audiencia": docData.google_ai_expected_results?.audience_size,
          "Conversiones": docData.google_ai_expected_results?.conversions,
          "CPC": docData.google_ai_expected_results?.cpc,
          "CTR": docData.google_ai_expected_results?.ctr,
          "Alcance": docData.google_ai_expected_results?.reach,
          "ROAS": docData.google_ai_expected_results?.roas,
          "Engagement rate": docData.google_ai_expected_results?.engagement_rate,
        }
      };
    }
    // Meta Ads
    if (Array.isArray(docData.meta_ai_ad_variants)) {
      const metaVariants: { [key: string]: any } = {};
      docData.meta_ai_ad_variants.forEach((variant: any, idx: number) => {
        metaVariants[`Variante ${idx + 1}`] = {
          "Título del anuncio": variant.title,
          "Texto principal": variant.main_text,
          "CTA": variant.cta,
          "Ideas de imágenes/videos": variant.image_video_ideas,
          "Formatos sugeridos": variant.recommended_formats,
          "Audiencias personalizadas/lookalikes": variant.audiences,
        };
      });
      result["Meta Ads"] = {
        "Anuncio generado por IA": metaVariants,
        "Resultados esperados": {
          "Audiencia": docData.meta_ai_expected_results?.audience_size,
          "Conversiones": docData.meta_ai_expected_results?.conversions,
          "CPC": docData.meta_ai_expected_results?.cpc,
          "CTR": docData.meta_ai_expected_results?.ctr,
          "Alcance": docData.meta_ai_expected_results?.reach,
          "ROAS": docData.meta_ai_expected_results?.roas,
          "Engagement rate": docData.meta_ai_expected_results?.engagement_rate,
        }
      };
    }
    // Para campañas simples (solo un array genérico)
    if (Array.isArray(docData.ai_ad_variants)) {
      const variants: { [key: string]: any } = {};
      docData.ai_ad_variants.forEach((variant: any, idx: number) => {
        if (
          variant.suggested_title !== undefined ||
          variant.short_description !== undefined ||
          variant.recommended_keywords !== undefined
        ) {
          // Google Ads
          variants[`Variante ${idx + 1}`] = {
            "Título sugerido": variant.suggested_title,
            "Descripción corta": variant.short_description,
            "Keywords recomendadas": variant.recommended_keywords,
            "CTA": variant.cta,
            "Estrategia de puja": variant.bidding_strategy,
            "Negative keywords": variant.negative_keywords,
            "Extensiones de anuncio": variant.ad_extensions,
          };
        } else if (
          variant.title !== undefined ||
          variant.main_text !== undefined ||
          variant.image_video_ideas !== undefined
        ) {
          // Meta Ads
          variants[`Variante ${idx + 1}`] = {
            "Título del anuncio": variant.title,
            "Texto principal": variant.main_text,
            "CTA": variant.cta,
            "Ideas de imágenes/videos": variant.image_video_ideas,
            "Formatos sugeridos": variant.recommended_formats,
            "Audiencias personalizadas/lookalikes": variant.audiences,
          };
        }
      });
      result["Anuncio generado por IA"] = variants;
      result["Resultados esperados"] = {
        "Audiencia": docData.ai_expected_results?.audience_size,
        "Conversiones": docData.ai_expected_results?.conversions,
        "CPC": docData.ai_expected_results?.cpc,
        "CTR": docData.ai_expected_results?.ctr,
        "Alcance": docData.ai_expected_results?.reach,
        "ROAS": docData.ai_expected_results?.roas,
        "Engagement rate": docData.ai_expected_results?.engagement_rate,
      };
    }
    result["Nombre de campaña"] = docData.campaign_name;
    return result;
  }

  // Leer el título IA al cargar el dashboard o cambiar campaignId
  useEffect(() => {
    const fetchIaData = async () => {
      if (!campaignId) return;
      try {
        const iaColRef = collection(db, `clients/${user?.uid}/campaigns/${campaignId}/ia_data`);
        const snapshot = await getDocs(iaColRef);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          console.log('[DEBUG] Datos Firestore IA:', docData);
          // Detecta plataforma activa para mapeo (si hay varias, toma la primera)
          const mappedData = mapAIDataFromFirestore(docData);
          console.log('[DEBUG] Datos IA mapeados para dashboard:', mappedData);
          setIaTitle(mappedData["Nombre de campaña"] || null);
          setIaData(mappedData);
        } else {
          setIaTitle(null);
          setIaData(null);
        }
      } catch (e) {
        setIaTitle(null);
        setIaData(null);
        console.error('[DEBUG] Error obteniendo datos IA:', e);
      }
    };
    fetchIaData();
  }, [campaignId, user, platforms]);



  // DEBUG: Mostrar campaignData y business_name en consola
  console.log('DashboardCampaignTabs campaignData:', campaignData);
  console.log('DashboardCampaignTabs business_name:', campaignData?.business_name);

  return (

  <div className="w-full">
      {/* Agrupación de título, resumen y detalles generales */}
  <div className="bg-white rounded-xl shadow p-7 mb-0 flex flex-col items-center w-full" id="bloque-cabecera-campana">
  <h2 className="text-2xl font-bold text-black mb-2 text-center">{iaTitle || 'Nombre de la campaña'}</h2>
        <p className="text-sm font-normal mb-4 text-center" style={{ color: '#6B7280' }}>Resumen y gestión de tu campaña publicitaria</p>
        <div className="flex border-b border-gray-200 mb-4 w-full justify-center">
          {platforms.map((platform) => (
            <button
              key={platform}
              className={`px-8 py-3 font-semibold border-b-2 transition-colors duration-200 text-lg ${
                activeTab === platform
                  ? 'border-blue-600 text-black bg-gray-100'
                  : 'border-transparent text-gray-500 hover:text-black bg-transparent'
              }`}
              onClick={() => setActiveTab(platform)}
              style={{ color: activeTab === platform ? '#000' : '#6B7280', borderRadius: '12px 12px 0 0' }}
            >
              {platform}
            </button>
          ))}
        </div>
        {/* Detalles Generales agrupados */}
        <div className="w-full">
          {/* Título 'Detalles Generales' eliminado por requerimiento */}
          <div className="flex flex-row flex-wrap gap-10 text-gray-600 items-center justify-center">
            {/* ...eliminado plataforma visual aquí... */}
            {/* Objetivo */}
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-semibold text-[18px] flex items-center gap-1 justify-center"><Target className="w-4 h-4" style={{color:'#2d4792'}} /> Objetivo</span>
              <div className="font-semibold text-[14px] mt-1" style={{color:'#6B7280'}}>{campaignData?.objetivo || 'Conseguir más clientes'}</div>
            </div>
            {/* Presupuesto */}
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-semibold text-[18px] flex items-center gap-1 justify-center"><DollarSign className="w-4 h-4" style={{color:'#2d4792'}} /> Presupuesto</span>
              <div className="font-semibold text-[14px] mt-1" style={{color:'#6B7280'}}>
                {campaignData?.budget_amount && campaignData?.budget_currency
                  ? `${campaignData.budget_amount} ${campaignData.budget_currency}`
                  : '$5,000 MXN'}
              </div>
            </div>
            {/* Duración */}
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-semibold text-[18px] flex items-center gap-1 justify-center"><CalendarDays className="w-4 h-4" style={{color:'#2d4792'}} /> Duración</span>
              <div className="font-semibold text-[14px] mt-1" style={{color:'#6B7280'}}>{campaignData?.duracion || '1 mes'}</div>
            </div>
            {/* Público objetivo */}
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-semibold text-[18px] flex items-center gap-1 justify-center"><Users className="w-4 h-4" style={{color:'#2d4792'}} /> Público objetivo</span>
              <div className="font-semibold text-[14px] mt-1" style={{color:'#6B7280'}}>{campaignData?.target_audience || campaignData?.publico || 'No especificado'}</div>
            </div>
            {/* Ubicación geográfica */}
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-semibold text-[18px] flex items-center gap-1 justify-center"><Users className="w-4 h-4" style={{color:'#2d4792'}} /> Ubicación</span>
              <div className="font-semibold text-[14px] mt-1" style={{color:'#6B7280'}}>{(campaignData?.locations && Array.isArray(campaignData.locations) && campaignData.locations.length > 0)
                ? campaignData.locations.join(', ')
                : (campaignData?.lugares && campaignData.lugares.length > 0 ? campaignData.lugares.join(', ') : 'No especificado')}</div>
            </div>
          </div>
          {/* ...fin de detalles generales... */}
        </div>
      </div>
      <div className="w-full mt-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
            </button>
          </div>
          {currentIaData && currentIaData["Anuncio generado por IA"] && (
            <div className="flex items-center">
              <button
                onClick={() => setCurrentVariantIndex(currentVariantIndex - 1)}
                disabled={currentVariantIndex === 0}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &lt;
              </button>
              <div className="mx-4 text-lg font-semibold">{`${currentVariantIndex + 1} de ${Object.keys(currentIaData["Anuncio generado por IA"]).length}`}</div>
              <button
                onClick={() => setCurrentVariantIndex(currentVariantIndex + 1)}
                disabled={currentVariantIndex === Object.keys(currentIaData["Anuncio generado por IA"]).length - 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        <div className="relative min-h-[450px]">
          {currentIaData && currentIaData["Anuncio generado por IA"] && Object.keys(currentIaData["Anuncio generado por IA"]).map((variantKey, index) => {
            const variantNumber = index + 1;
            const variantData = currentIaData["Anuncio generado por IA"] ? currentIaData["Anuncio generado por IA"][variantKey] : undefined;

            return (
              <div key={variantKey} className={`transition-opacity duration-500 ${currentVariantIndex === index ? 'opacity-100' : 'opacity-0 absolute top-0 left-0 w-full'}`}>
                <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-4 h-full">
                  <div className={`${showPreview ? 'hidden' : ''}`}>
                    <h3 className="font-bold text-lg text-black mb-3 flex items-center gap-2">
                      <Edit3 className="w-5 h-5" style={{ color: '#2d4792' }} /> {variantKey}
                    </h3>
                    {activeTab === 'Meta Ads' ? (
                      <>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Título del anuncio</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Título del anuncio"] || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Texto principal</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Texto principal"] || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">CTA</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData.CTA || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Ideas de imágenes/videos</span>
                          <div className="font-semibold text-xs mt-1 italic text-[#6B7280]">{variantData && variantData["Ideas de imágenes/videos"] || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Formatos sugeridos</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Formatos sugeridos"]?.join(', ') || '-'}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-sm">Audiencias personalizadas/lookalikes</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
                        </div>
                      </>
                    ) : activeTab === 'Google Ads' ? (
                      <>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Título sugerido</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Título sugerido"] || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Descripción corta</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Descripción corta"] || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Keywords recomendadas</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Keywords recomendadas"]?.join(', ') || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">CTA</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData.CTA || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Estrategia de puja</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Estrategia de puja"] || '-'}</div>
                        </div>
                        <div className="mb-3">
                          <span className="font-semibold text-sm">Negative keywords</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Negative keywords"]?.join(', ') || '-'}</div>
                        </div>
                        <div>
                          <span className="font-semibold text-sm">Extensiones de anuncio</span>
                          <div className="font-semibold text-xs mt-1 text-[#6B7280]">{variantData && variantData["Extensiones de anuncio"]?.join(', ') || '-'}</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className={`flex items-center justify-center min-h-[380px] ${showPreview ? '' : 'hidden'}`} ref={activeTab === 'Meta Ads' ? metaAdPreviewRefs[index] : googleAdPreviewRefs[index]}>
                    <AdPreview platform={activeTab} iaData={currentIaData} campaignData={campaignData} variant={variantNumber as 1 | 2 | 3} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Acciones disponibles */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mt-8 w-full">
          <h3 className="mb-4 font-semibold text-lg text-black">Acciones disponibles</h3>
          <div className="flex gap-4 mb-2 w-full">
            <button
              className="flex-1 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow transition-colors text-base flex items-center justify-center gap-2"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 className="w-5 h-5" style={{ color: '#fff' }} /> Editar Campaña
            </button>
            <ConfirmEditModal
              open={showEditModal}
              creditCost={1}
              onCancel={() => setShowEditModal(false)}
              onConfirm={() => {
                setShowEditModal(false);
                navigate(`/dashboard/campaign/edit/${campaignId}`);
              }}
            />
            <button
              className="flex-1 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow transition-colors text-base flex items-center justify-center gap-2"
              onClick={handleExportPDF}
            >
              <UploadCloud className="w-5 h-5" style={{ color: '#fff' }} /> Exportar a PDF
            </button>
            <button
              className="flex-1 px-6 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold rounded-lg shadow transition-colors text-base flex items-center justify-center gap-2"
              onClick={async () => {
                if (!campaignData?.generated_image_url) return;
                try {
                  const response = await fetch(campaignData.generated_image_url, { mode: 'cors' });
                  if (!response.ok) throw new Error('Network response was not ok');
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = 'anuncio.png';
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    a.remove();
                  }, 100);
                } catch (e: any) {
                  if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
                    alert('No se pudo descargar la imagen por restricciones de CORS. Pide al administrador que configure los permisos públicos o CORS en Firebase Storage.');
                  } else {
                    alert('No se pudo descargar la imagen.');
                  }
                }
              }}
            >
              <Download className="w-5 h-5" style={{ color: '#fff' }} /> Descargar anuncio
            </button>
          </div>
          <p className="text-xs text-gray-400">* Publicar campaña estará disponible cuando se integren las APIs de Meta Ads o Google Ads.</p>
        </div>
      </div>
      {/* Vistas previas ocultas para campañas mixtas */}
      {isMixta && showOtherPreviews && (
        <div style={{ position: 'absolute', left: '-10000px', width: '500px', height: 'auto' }}>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={otherRefs[0]}>
            <AdPreview platform={otherPlatform} iaData={otherIaData} campaignData={campaignData} variant={1} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={otherRefs[1]}>
            <AdPreview platform={otherPlatform} iaData={otherIaData} campaignData={campaignData} variant={2} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={otherRefs[2]}>
            <AdPreview platform={otherPlatform} iaData={otherIaData} campaignData={campaignData} variant={3} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
        </div>
      )}

  {/* Botones para subir campaña eliminados */}
    </div>
  );
};

export default DashboardCampaignTabs;