import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { subirCampaniaIA } from './uploadCampaignIA';

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
  const [activeTab, setActiveTab] = useState(platforms[0] || '');
  const [iaTitle, setIaTitle] = useState<string | null>(null);
  const [iaData, setIaData] = useState<any>(null);
  // Leer el título IA al cargar el dashboard o cambiar campaignId
  useEffect(() => {
    const fetchIaData = async () => {
      if (!campaignId) return;
      try {
        const iaColRef = collection(db, `clients/${user?.uid}/campaigns/${campaignId}/ia_data`);
        const snapshot = await getDocs(iaColRef);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setIaTitle(docData["Nombre de campaña"] || null);
          setIaData(docData);
        } else {
          setIaTitle(null);
          setIaData(null);
        }
      } catch {
        setIaTitle(null);
        setIaData(null);
      }
    };
    fetchIaData();
  }, [campaignId, user]);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const handleUploadIA = async () => {
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
  await subirCampaniaIA(user.uid, campaignId);
      setUploadMsg('Campaña IA subida correctamente.');
    } catch (e) {
      setUploadMsg('Error al subir la campaña IA.');
    }
    setUploading(false);
  };

  // DEBUG: Mostrar campaignData y business_name en consola
  // eslint-disable-next-line no-console
  console.log('DashboardCampaignTabs campaignData:', campaignData);
  // eslint-disable-next-line no-console
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

      {/* Tarjetas separadas */}
  <div className="grid grid-cols-1 gap-6">
        {/* Detalles Generales */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><FileBarChart className="w-5 h-5" style={{color:'#2d4792'}} /> Detalles Generales</h3>
          <div className="flex flex-row flex-wrap gap-8 text-gray-600 items-center justify-center">
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><Layers className="w-4 h-4" style={{color:'#2d4792'}} /> Plataforma</span>
              <div className="text-gray-700 mt-1">
                {activeTab}
              </div>
            </div>
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><CalendarDays className="w-4 h-4" style={{color:'#2d4792'}} /> Estado</span>
              <div className="text-gray-700 mt-1">Pendiente</div>
            </div>
            <div className="flex flex-col items-center min-w-[120px] text-center">
              <span className="font-bold flex items-center gap-1 justify-center"><Target className="w-4 h-4" style={{color:'#2d4792'}} /> Objetivo</span>
              <div className="text-gray-700 mt-1">
                {campaignData?.objetivo || 'Conseguir más clientes'}
              </div>
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
              <div className="text-gray-700 mt-1">
                {campaignData?.duracion || '1 mes'}
              </div>
            </div>
          </div>
        </div>

        {/* Creatividad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2 col-span-1 md:col-span-2">
          <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Anuncio generado por IA</h3>
            {activeTab === 'Meta Ads' && iaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título del anuncio</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Título del anuncio"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Texto principal</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Texto principal"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Ideas de imágenes/videos</span>
                  <div className="text-gray-700 mt-1 italic">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Ideas de imágenes/videos"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Formatos sugeridos</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : activeTab === 'Google Ads' && iaData ? (
              <>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Título sugerido</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Título del anuncio"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Descripción corta</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Texto principal"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">CTA</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.CTA || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Ideas de imágenes/videos</span>
                  <div className="text-gray-700 mt-1 italic">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Ideas de imágenes/videos"] || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Formatos sugeridos</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
                </div>
                <div className="mb-4 text-gray-600">
                  <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                  <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 1"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
                </div>
              </>
            ) : null}
          </div>
          {/* Vista Previa */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]">
            <AdPreview platform={activeTab} iaData={iaData} variant={1} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
        </div>

        {/* Variante 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2 col-span-1 md:col-span-2">
          <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Variante 2</h3>
          {activeTab === 'Meta Ads' && iaData ? (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título del anuncio</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Título del anuncio"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Texto principal</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Texto principal"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.CTA || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Ideas de imágenes/videos</span>
                <div className="text-gray-700 mt-1 italic">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Ideas de imágenes/videos"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Formatos sugeridos</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
              </div>
            </>
          ) : activeTab === 'Google Ads' && iaData ? (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título sugerido</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Título del anuncio"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Descripción corta</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Texto principal"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.CTA || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Ideas de imágenes/videos</span>
                <div className="text-gray-700 mt-1 italic">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Ideas de imágenes/videos"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Formatos sugeridos</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 2"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
              </div>
            </>
          ) : null}
          </div>
          {/* Vista Previa */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]">
            <AdPreview platform={activeTab} iaData={iaData} variant={2} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
          </div>
        </div>

        {/* Variante 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2 col-span-1 md:col-span-2">
          <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5" style={{color:'#2d4792'}} /> Variante 3</h3>
          {activeTab === 'Meta Ads' && iaData ? (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título del anuncio</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Título del anuncio"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Texto principal</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Texto principal"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.CTA || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Ideas de imágenes/videos</span>
                <div className="text-gray-700 mt-1 italic">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Ideas de imágenes/videos"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Formatos sugeridos</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
              </div>
            </>
          ) : activeTab === 'Google Ads' && iaData ? (
            <>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Título sugerido</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Título del anuncio"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Descripción corta</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Texto principal"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">CTA</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.CTA || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Ideas de imágenes/videos</span>
                <div className="text-gray-700 mt-1 italic">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Ideas de imágenes/videos"] || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Formatos sugeridos</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Formatos sugeridos"]?.join(', ') || '-'}</div>
              </div>
              <div className="mb-4 text-gray-600">
                <span className="font-bold">Audiencias personalizadas/lookalikes</span>
                <div className="text-gray-700 mt-1">{iaData["Anuncio generado por IA"]?.["Variante 3"]?.["Audiencias personalizadas/lookalikes"]?.join(', ') || '-'}</div>
              </div>
            </>
          ) : null}
          </div>
          {/* Vista Previa */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]">
            <AdPreview platform={activeTab} iaData={iaData} variant={3} businessName={campaignData?.business_name ? String(campaignData.business_name) : undefined} />
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
            <button className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3">
              <Edit3 className="w-6 h-6" style={{color:'#fff'}} /> Editar anuncio
            </button>
            <button className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3">
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

        {/* Resultados simulados - horizontal con iconos */}
        <div className="border-2 border-white rounded-lg bg-[#f7f8fa] p-6 mb-2 col-span-1 md:col-span-2">
          <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" style={{color:'#2d4792'}} /> Resultados esperados</h3>
          <div className="flex flex-wrap gap-8 items-center justify-center mb-2 mt-4">
            <div className="flex flex-col items-center">
              <TrendingUp className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">Alcance</span>
              <div className="text-gray-500 mt-1">{iaData?.["Resultados esperados"]?.["Alcance"] || '-'}</div>
            </div>
            <div className="flex flex-col items-center">
              <Users className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">Audiencia</span>
              <div className="text-gray-500 mt-1">{iaData?.["Resultados esperados"]?.["Audiencia"] || '-'}</div>
            </div>
            <div className="flex flex-col items-center">
              <DollarSign className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">CPC</span>
              <div className="text-gray-500 mt-1">{iaData?.["Resultados esperados"]?.["CPC"] || '-'}</div>
            </div>
            <div className="flex flex-col items-center">
              <Target className="w-8 h-8" style={{color:'#2d4792'}} />
              <span className="font-bold text-gray-700">CTR</span>
              <div className="text-gray-500 mt-1">{iaData?.["Resultados esperados"]?.["CTR"] || '-'}</div>
            </div>
            {activeTab === 'Meta Ads' && iaData?.["Resultados esperados"] ? (
              <>
                <div className="flex flex-col items-center">
                  <BarChart3 className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">Engagement rate</span>
                  <div className="text-gray-500 mt-1">{iaData["Resultados esperados"]["Engagement rate"] || '-'}</div>
                </div>
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">Conversiones</span>
                  <div className="text-gray-500 mt-1">{iaData["Resultados esperados"]["Conversiones"] || '-'}</div>
                </div>
                <div className="flex flex-col items-center">
                  <DollarSign className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">ROAS</span>
                  <div className="text-gray-500 mt-1">{iaData["Resultados esperados"]["ROAS"] || '-'}</div>
                </div>
              </>
            ) : null}
            {activeTab === 'Google Ads' && iaData?.["Resultados esperados"] ? (
              <>
                <div className="flex flex-col items-center">
                  <TrendingUp className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">Conversiones</span>
                  <div className="text-gray-500 mt-1">{iaData["Resultados esperados"]["Conversiones"] || '-'}</div>
                </div>
                <div className="flex flex-col items-center">
                  <DollarSign className="w-8 h-8" style={{color:'#2d4792'}} />
                  <span className="font-bold text-gray-700">ROAS</span>
                  <div className="text-gray-500 mt-1">{iaData["Resultados esperados"]["ROAS"] || '-'}</div>
                </div>
              </>
            ) : null}
          </div>
          <p className="text-xs text-gray-400 mt-2">* Estos resultados son simulados y pueden variar en campañas reales.</p>
        </div>
      </div>
      {/* Botón temporal para subir campaña IA de prueba */}
      <div className="mt-10 flex flex-col items-center">
        <button
          className="px-6 py-3 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-lg shadow mb-2 disabled:opacity-60"
          onClick={handleUploadIA}
          disabled={uploading}
        >
          {uploading ? 'Subiendo campaña IA...' : 'Subir campaña IA de prueba'}
        </button>
        {uploadMsg && <span className="text-sm text-gray-600 mt-1">{uploadMsg}</span>}
      </div>
    </div>
  );
}

// ...existing code...
export default DashboardCampaignTabs;
