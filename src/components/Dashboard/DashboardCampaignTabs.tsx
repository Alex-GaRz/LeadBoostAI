import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { exportPDF } from '../../utils/exportPDF'; // Asegúrate de que esta importación sea correcta
import { Layers, Users, BarChart3, Zap, UploadCloud, CalendarDays, DollarSign, Target, TrendingUp, FileBarChart, Edit3, Copy, Send } from 'lucide-react';
import AdPreview from './AdPreview';

interface DashboardCampaignTabsProps {
  platforms: string[]; // Ejemplo: ['Meta Ads'], ['Google Ads'], ['Meta Ads', 'Google Ads']
  campaignId: string;
  campaignData?: {
    plataforma?: string;
    objetivo?: string;
    duracion?: string;
    publico?: string;
    lugares?: string[];
    estilo?: string[];
    budget_amount?: string | number;
    budget_currency?: string;
    marca?: string;
    nombre_marca?: string;
    brand?: string;
    business_name?: string;
  };
}

const DashboardCampaignTabs: React.FC<DashboardCampaignTabsProps> = ({ platforms, campaignId, campaignData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(platforms[0] || '');
  const [iaTitle, setIaTitle] = useState<string | null>(null);
  const [iaData, setIaData] = useState<any>(null);
  const [showOtherPreviews, setShowOtherPreviews] = useState(false); // Estado para vistas previas ocultas

  // Refs separados para Meta Ads y Google Ads
  const metaAdPreviewRefs = [useRef(null), useRef(null), useRef(null)];
  const googleAdPreviewRefs = [useRef(null), useRef(null), useRef(null)];

  const handleExportPDF = async () => {
    const isMixta = platforms.some(p => p === 'MetaAds' || p === 'Meta Ads') && platforms.some(p => p === 'GoogleAds' || p === 'Google Ads');

    if (isMixta) {
      setShowOtherPreviews(true);
      // Esperar a que React renderice las vistas ocultas
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      await exportPDF({
        campaignData,
        iaData,
        activeTab,
        adPreviewRefs: activeTab === 'Meta Ads' ? metaAdPreviewRefs : googleAdPreviewRefs,
        adPreviewRefsMixto: isMixta ? {
          'Meta Ads': metaAdPreviewRefs,
          'Google Ads': googleAdPreviewRefs
        } : undefined
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }

    if (isMixta) {
      setShowOtherPreviews(false);
    }
  };

  // Helper: get correct IA data block depending on campaign type and active tab
  const isMixta = platforms.some(p => p === 'MetaAds' || p === 'Meta Ads') && platforms.some(p => p === 'GoogleAds' || p === 'Google Ads');
  let currentIaData = iaData;
  if (isMixta && iaData && iaData[activeTab]) {
    currentIaData = iaData[activeTab];
  }

  // Determina la otra plataforma para las vistas ocultas
  const otherPlatform = activeTab === 'Meta Ads' ? 'Google Ads' : 'Meta Ads';
  const otherIaData = isMixta && iaData ? iaData[otherPlatform] : null;
  const otherRefs = activeTab === 'Meta Ads' ? googleAdPreviewRefs : metaAdPreviewRefs;

  // Función para mapear los datos de la IA de Firestore a los nombres esperados por el dashboard
  function mapAIDataFromFirestore(docData: any) {
    // Mapeo para campañas mixtas y simples
    const result: any = {};
    // Google Ads
    if (Array.isArray(docData.google_ai_ad_variants)) {
      const googleVariants: any = {};
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
      const metaVariants: any = {};
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
      const variants: any = {};
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

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const handleUploadMixta = async () => {
    if (!user) {
      setUploadMsg('Debes iniciar sesión.');
      return;
    }
    if (!campaignId) {
      setUploadMsg('No se encontró el ID de la campaña.');
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
  // subirCampaniaIAGooMet eliminado
  setUploadMsg('Campaña IA Mixta subida correctamente.');
    } catch (e) {
      setUploadMsg('Error al subir la campaña IA.');
    }
    setUploading(false);
  };

  // DEBUG: Mostrar campaignData y business_name en consola
  console.log('DashboardCampaignTabs campaignData:', campaignData);
  console.log('DashboardCampaignTabs business_name:', campaignData?.business_name);

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-black mb-1">{iaTitle || 'Nombre de la campaña'}</h2>
      <p className="text-gray-600 mb-4">Resumen y gestión de tu campaña publicitaria</p>
      <div className="flex border-b border-gray-200 mb-6">
        {platforms.map((platform) => (
          <button
            key={platform}
            className={`px-6 py-2 font-bold border-b-2 transition-colors duration-200 ${
              activeTab === platform
                ? 'border-blue-600 text-black'
                : 'border-transparent text-gray-500 hover:text-black'
            }`}
            onClick={() => setActiveTab(platform)}
            style={{ color: activeTab === platform ? '#000' : '#555' }}
          >
            {platform}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Detalles Generales */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><FileBarChart className="w-5 h-5" style={{color:'#2d4792'}} /> Detalles Generales</h3>
          <div className="flex flex-row flex-wrap gap-8 text-gray-600 items-center justify-center">
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><Layers className="w-4 h-4" style={{color:'#2d4792'}} /> Plataforma</span>
              <div className="text-gray-700 mt-1">{activeTab}</div>
            </div>
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><CalendarDays className="w-4 h-4" style={{color:'#2d4792'}} /> Estado</span>
              <div className="text-gray-700 mt-1">Pendiente</div>
            </div>
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><Target className="w-4 h-4" style={{color:'#2d4792'}} /> Objetivo</span>
              <div className="text-gray-700 mt-1">{campaignData?.objetivo || 'Conseguir más clientes'}</div>
            </div>
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><DollarSign className="w-4 h-4" style={{color:'#2d4792'}} /> Presupuesto</span>
              <div className="text-gray-700 mt-1">
                {campaignData?.budget_amount && campaignData?.budget_currency
                  ? `${campaignData.budget_amount} ${campaignData.budget_currency}`
                  : '$5,000 MXN'}
              </div>
            </div>
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><CalendarDays className="w-4 h-4" style={{color:'#2d4792'}} /> Duración</span>
              <div className="text-gray-700 mt-1">{campaignData?.duracion || '1 mes'}</div>
            </div>
          </div>
        </div>

        {/* Creatividad - Variante 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2 col-span-1 md:col-span-2">
          <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Anuncio generado por IA</h3>
            {activeTab === 'Meta Ads' && currentIaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título del anuncio</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Título del anuncio"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Texto principal</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Texto principal"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Ideas de imágenes/videos</span>
                  <div className="text-gray-700 mt-1 italic">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Ideas de imágenes/videos"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Formatos sugeridos</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : activeTab === 'Google Ads' && currentIaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título sugerido</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Título sugerido"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Descripción corta</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Descripción corta"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Keywords recomendadas</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Keywords recomendadas"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Estrategia de puja</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Estrategia de puja"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Negative keywords</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Negative keywords"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Extensiones de anuncio</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 1"]?.["Extensiones de anuncio"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : null}
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={activeTab === 'Meta Ads' ? metaAdPreviewRefs[0] : googleAdPreviewRefs[0]}>
            <AdPreview platform={activeTab} iaData={currentIaData} variant={1} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
        </div>

        {/* Variante 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2 col-span-1 md:col-span-2">
          <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Variante 2</h3>
            {activeTab === 'Meta Ads' && currentIaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título del anuncio</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Título del anuncio"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Texto principal</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Texto principal"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Ideas de imágenes/videos</span>
                  <div className="text-gray-700 mt-1 italic">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Ideas de imágenes/videos"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Formatos sugeridos</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : activeTab === 'Google Ads' && currentIaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título sugerido</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Título sugerido"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Descripción corta</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Descripción corta"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Keywords recomendadas</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Keywords recomendadas"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Estrategia de puja</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Estrategia de puja"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Negative keywords</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Negative keywords"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Extensiones de anuncio</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 2"]?.["Extensiones de anuncio"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : null}
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={activeTab === 'Meta Ads' ? metaAdPreviewRefs[1] : googleAdPreviewRefs[1]}>
            <AdPreview platform={activeTab} iaData={currentIaData} variant={2} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
        </div>

        {/* Variante 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2 col-span-1 md:col-span-2">
          <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Variante 3</h3>
            {activeTab === 'Meta Ads' && currentIaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título del anuncio</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Título del anuncio"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Texto principal</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Texto principal"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Ideas de imágenes/videos</span>
                  <div className="text-gray-700 mt-1 italic">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Ideas de imágenes/videos"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Formatos sugeridos</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : activeTab === 'Google Ads' && currentIaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título sugerido</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Título sugerido"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Descripción corta</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Descripción corta"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Keywords recomendadas</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Keywords recomendadas"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Estrategia de puja</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Estrategia de puja"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Negative keywords</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Negative keywords"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Extensiones de anuncio</span>
                  <div className="text-gray-700 mt-1">{currentIaData["Anuncio generado por IA"]?.["Variante 3"]?.["Extensiones de anuncio"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : null}
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={activeTab === 'Meta Ads' ? metaAdPreviewRefs[2] : googleAdPreviewRefs[2]}>
            <AdPreview platform={activeTab} iaData={currentIaData} variant={3} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
        </div>

        {/* Segmentación sugerida */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Users className="w-5 h-5" style={{color:'#2d4792'}} /> Segmentación sugerida</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
            <div>
              <span className="font-bold">Público objetivo</span>
              <div className="text-gray-700 mt-1">{campaignData?.publico || 'No especificado'}</div>
            </div>
            <div>
              <span className="font-bold">Ubicación geográfica</span>
              <div className="text-gray-700 mt-1">{campaignData?.lugares && campaignData.lugares.length > 0 ? campaignData.lugares.join(', ') : 'No especificado'}</div>
            </div>
            <div>
              <span className="font-bold">Estilo de comunicación</span>
              <div className="text-gray-700 mt-1">{campaignData?.estilo && campaignData.estilo.length > 0 ? campaignData.estilo.join(', ') : 'No especificado'}</div>
            </div>
          </div>
        </div>

        {/* Acciones disponibles */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2 w-full">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Zap className="w-5 h-5" style={{color:'#2d4792'}} /> Acciones disponibles</h3>
          <div className="flex gap-4 mb-2 w-full">
            <button
              className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3"
              onClick={() => navigate(`/dashboard/campaign/edit/${campaignId}`)}
            >
              <Edit3 className="w-6 h-6" style={{color:'#fff'}} /> Editar anuncio
            </button>
            <button
              className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3"
              onClick={handleExportPDF}
            >
              <UploadCloud className="w-6 h-6" style={{color:'#fff'}} /> Exportar a PDF
            </button>
            <button className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3">
              <Copy className="w-6 h-6" style={{color:'#fff'}} /> Duplicar campaña
            </button>
            <button className="flex-1 px-5 py-3 bg-blue-300 text-white font-semibold rounded-lg shadow cursor-not-allowed flex items-center justify-center gap-3" disabled>
              <Send className="w-6 h-6" style={{color:'#fff'}} /> Publicar campaña
            </button>
          </div>
          <p className="text-xs text-gray-400">* Publicar campaña estará disponible cuando se integren las APIs de Meta Ads o Google Ads.</p>
        </div>

        {/* Resultados esperados */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" style={{color:'#2d4792'}} /> Resultados esperados</h3>
          <div className="flex flex-wrap gap-8 items-center justify-center mb-2 mt-4">
            <div className="flex flex-col items-center">
              <TrendingUp className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">Alcance</span>
              <div className="text-gray-500 mt-1">{currentIaData?.["Resultados esperados"]?.["Alcance"] || '-'}</div>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">Audiencia</span>
              <div className="text-gray-500 mt-1">{currentIaData?.["Resultados esperados"]?.["Audiencia"] || '-'}</div>
            </div>
            <div className="flex flex-col items-center">
              <DollarSign className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">CPC</span>
              <div className="text-gray-500 mt-1">{currentIaData?.["Resultados esperados"]?.["CPC"] || '-'}</div>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">CTR</span>
              <div className="text-gray-500 mt-1">{currentIaData?.["Resultados esperados"]?.["CTR"] || '-'}</div>
            </div>
            {activeTab === 'Meta Ads' && currentIaData?.["Resultados esperados"] ? (
              <>
                <div className="flex flex-col items-center">
                  <BarChart3 className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">Engagement rate</span>
                  <div className="text-gray-500 mt-1">{currentIaData["Resultados esperados"]["Engagement rate"] || '-'}</div>
                </div>
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">Conversiones</span>
                  <div className="text-gray-500 mt-1">{currentIaData["Resultados esperados"]["Conversiones"] || '-'}</div>
                </div>
                <div className="flex flex-col items-center">
                  <DollarSign className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">ROAS</span>
                  <div className="text-gray-500 mt-1">{currentIaData["Resultados esperados"]["ROAS"] || '-'}</div>
                </div>
              </>
            ) : null}
            {activeTab === 'Google Ads' && currentIaData?.["Resultados esperados"] ? (
              <>
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">Conversiones</span>
                  <div className="text-gray-500 mt-1">{currentIaData["Resultados esperados"]["Conversiones"] || '-'}</div>
                </div>
                <div className="flex flex-col items-center">
                  <DollarSign className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">ROAS</span>
                  <div className="text-gray-500 mt-1">{currentIaData["Resultados esperados"]["ROAS"] || '-'}</div>
                </div>
              </>
            ) : null}
          </div>
          <p className="text-xs text-gray-400 mt-2">* Estos resultados son simulados y pueden variar en campañas reales.</p>
        </div>
      </div>

      {/* Vistas previas ocultas para campañas mixtas */}
      {isMixta && showOtherPreviews && (
        <div style={{ position: 'absolute', left: '-10000px', width: '500px', height: 'auto' }}>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={otherRefs[0]}>
            <AdPreview platform={otherPlatform} iaData={otherIaData} variant={1} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={otherRefs[1]}>
            <AdPreview platform={otherPlatform} iaData={otherIaData} variant={2} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={otherRefs[2]}>
            <AdPreview platform={otherPlatform} iaData={otherIaData} variant={3} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
        </div>
      )}

  {/* Botones para subir campaña eliminados */}
    </div>
  );
};

export default DashboardCampaignTabs;