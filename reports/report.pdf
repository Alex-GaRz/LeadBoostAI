import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, getDocs as getDocsSub } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { subirCampaniaIAGooMet } from './uploadCampaignIAGooMet';

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
  // Exportar a PDF con plantilla personalizada
  const adPreviewRefs = [useRef(null), useRef(null), useRef(null)];

  const handleExportPDF = async () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  let y = 50;

  // Encabezado principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(44, 71, 146);
  doc.text('Reporte de Campaña Publicitaria', 40, y);
  y += 30;

  // Subtítulo con nombre de campaña
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0,0,0);
  doc.text(campaignData?.business_name || iaTitle || 'Nombre de la campaña', 40, y);
  y += 18;
  doc.setDrawColor(44, 71, 146);
  doc.setLineWidth(1);
  doc.line(40, y, 555, y);
  y += 18;


  // Detalles generales (bloque con fondo, más alto y con separación)
  doc.setFillColor(247, 248, 250);
  doc.roundedRect(35, y, 520, 110, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(44, 71, 146);
  doc.text('Detalles Generales', 50, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0,0,0);
  doc.text(`Plataforma: ${activeTab}`, 50, y + 45);
  doc.text(`Objetivo: ${campaignData?.objetivo || ''}`, 50, y + 63);
  doc.text(`Duración: ${campaignData?.duracion || ''}`, 50, y + 81);
  doc.text(`Presupuesto: ${campaignData?.budget_amount || ''} ${campaignData?.budget_currency || ''}`, 300, y + 45);
  doc.text(`Estado: Pendiente`, 300, y + 63);
  y += 125;

  // --- Resultados esperados (arriba de variantes, mismo formato que detalles generales) ---
  let resultadosEsperadosHeight = 110;
  let resultadosEsperadosLines: string[][] = [];
  if (iaData?.['Resultados esperados']) {
    resultadosEsperadosLines = Object.entries(iaData['Resultados esperados']).map(([key, value]) => {
      return [`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`];
    });
    resultadosEsperadosHeight = 45 + resultadosEsperadosLines.length * 18;
    if (resultadosEsperadosHeight < 110) resultadosEsperadosHeight = 110;
  }
  doc.setFillColor(247, 248, 250);
  doc.roundedRect(35, y, 520, resultadosEsperadosHeight, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(44, 71, 146);
  doc.text('Resultados esperados', 50, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0,0,0);
  if (iaData?.['Resultados esperados']) {
    let yLine = y + 45;
    for (const lineArr of resultadosEsperadosLines) {
      doc.text(lineArr, 50, yLine);
      yLine += 18;
    }
  } else {
    doc.text('No hay resultados esperados disponibles.', 50, y + 45);
  }
  y += resultadosEsperadosHeight + 15;

  // Segmentación sugerida (bloque con fondo, más alto y mejor separación)
  doc.setFillColor(247, 248, 250);
  doc.roundedRect(35, y, 520, 90, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(44, 71, 146);
  doc.text('Segmentación sugerida', 50, y + 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0,0,0);
  doc.text(`Público objetivo: ${campaignData?.publico || '-'}`, 50, y + 45);
  doc.text(`Lugares: ${(Array.isArray(campaignData?.lugares) ? campaignData.lugares.join(', ') : campaignData?.lugares) || '-'}`, 50, y + 63);
  doc.text(`Estilo: ${(campaignData?.estilo || []).join(', ') || '-'}`, 50, y + 81);
  y += 105;
  // Línea divisoria
  doc.setDrawColor(220,220,220);
  doc.setLineWidth(0.5);
  doc.line(40, y, 555, y);
  y += 15;

    // --- Variantes de Anuncio ---
    const maxWidth = 500;
    for (let v = 1; v <= 3; v++) {
      doc.addPage();
      y = 50;
      // Bloque de variante (más alto y con separación)
      const previewNode = adPreviewRefs[v-1].current;
      let pdfHeight = 0;
      let imgData = null;
      if (previewNode) {
        // eslint-disable-next-line no-await-in-loop
        const canvas = await html2canvas(previewNode, { backgroundColor: '#fff', scale: 2 });
        imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = 400;
        pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      }
      let fields: { label: string; value: string }[] = [];
      if (activeTab === 'Meta Ads') {
        fields = [
          { label: 'Título', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Título del anuncio'] || '-' },
          { label: 'Texto principal', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Texto principal'] || '-' },
          { label: 'CTA', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.CTA || '-' },
          { label: 'Ideas de imágenes/videos', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Ideas de imágenes/videos'] || '-' },
          { label: 'Formatos sugeridos', value: (iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Formatos sugeridos'] || []).join(', ') },
          { label: 'Audiencias personalizadas/lookalikes', value: (iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Audiencias personalizadas/lookalikes'] || []).join(', ') },
        ];
      } else if (activeTab === 'Google Ads') {
        fields = [
          { label: 'Título sugerido', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Título sugerido'] || '-' },
          { label: 'Descripción corta', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Descripción corta'] || '-' },
          { label: 'Keywords recomendadas', value: (iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Keywords recomendadas'] || []).join(', ') },
          { label: 'CTA', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.CTA || '-' },
          { label: 'Estrategia de puja', value: iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Estrategia de puja'] || '-' },
          { label: 'Negative keywords', value: (iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Negative keywords'] || []).join(', ') },
          { label: 'Extensiones de anuncio', value: (iaData?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Extensiones de anuncio'] || []).join(', ') },
        ];
      }
      let yVarCalc = 45;
      for (const field of fields) {
        const lines = doc.splitTextToSize(`${field.label}: ${field.value}`, maxWidth-30);
        yVarCalc += lines.length * 13 + 2;
      }
      const textHeight = yVarCalc - 45;
      const imageHeight = pdfHeight > 0 ? pdfHeight + 20 : 0;
      const blockHeight = 40 + textHeight + imageHeight;
      doc.setFillColor(255,255,255);
      doc.roundedRect(35, y, 520, blockHeight, 8, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(44, 71, 146);
      let lines = doc.splitTextToSize(`Variante ${v} (${activeTab})`, maxWidth);
      doc.text(lines, 50, y + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0,0,0);
      let yVar = y + 45;
      for (const field of fields) {
        lines = doc.splitTextToSize(`${field.label}: ${field.value}`, maxWidth-30);
        doc.text(lines, 60, yVar);
        yVar += lines.length * 13 + 2;
      }
      // Vista previa
      if (previewNode && imgData) {
        const pdfWidth = 400;
        const imgX = 35 + (520 - pdfWidth) / 2;
        doc.addImage(imgData, 'PNG', imgX, yVar + 10, pdfWidth, pdfHeight);
        yVar += pdfHeight + 20;
      }
      y += blockHeight + 15;
    }
  doc.save('campaña.pdf');
  };

  // Helper: get correct IA data block depending on campaign type and active tab
  const isMixta = platforms.some(p => p === 'MetaAds' || p === 'Meta Ads') && platforms.some(p => p === 'GoogleAds' || p === 'Google Ads');
  // For mixed campaigns, IA data is nested under iaData["Meta Ads"] or iaData["Google Ads"]
  const currentIaData = isMixta && iaData ? iaData[activeTab] : iaData;
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
      await subirCampaniaIAGooMet(user.uid, campaignId);
      setUploadMsg('Campaña IA Mixta subida correctamente.');
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

  {/* Botón Exportar a PDF eliminado para evitar duplicados, se conecta el botón original */}
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
          {/* Vista Previa */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={adPreviewRefs[0]}>
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
          {/* Vista Previa */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={adPreviewRefs[1]}>
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
          {/* Vista Previa */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg bg-white p-6 flex items-center justify-center min-h-[220px]" ref={adPreviewRefs[2]}>
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
            <button
              className="flex-1 px-5 py-3 bg-[#2d4792] hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-3"
              onClick={async () => {
                if (!user || !campaignId) return;
                try {
                  // 1. Leer datos de la campaña original
                  const origRef = doc(db, `clients/${user.uid}/campaigns/${campaignId}`);
                  const origSnap = await getDoc(origRef);
                  if (!origSnap.exists()) throw new Error('No se encontró la campaña original');
                  const origData = origSnap.data();
                  // 2. Crear nueva campaña
                  const campaignsCol = collection(db, `clients/${user.uid}/campaigns`);
                  const newDocRef = await addDoc(campaignsCol, {
                    ...origData,
                    nombre: (origData.nombre || origData.business_name || 'Campaña duplicada') + ' (copia)',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                  // 3. Copiar subcolección ia_data
                  const iaDataCol = collection(db, `clients/${user.uid}/campaigns/${campaignId}/ia_data`);
                  const iaDataSnap = await getDocsSub(iaDataCol);
                  for (const iaDoc of iaDataSnap.docs) {
                    const iaDocRef = doc(db, `clients/${user.uid}/campaigns/${newDocRef.id}/ia_data/${iaDoc.id}`);
                    await setDoc(iaDocRef, iaDoc.data());
                  }
                  // 4. Navegar a la nueva campaña
                  navigate(`/dashboard/campaign/${newDocRef.id}`);
                } catch (e) {
                  alert('Error al duplicar campaña: ' + (e instanceof Error ? e.message : String(e)));
                }
              }}
            >
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
      {/* Botón para subir campaña IA de prueba según la plataforma activa */}
      {/* Botón único para subir campaña IA Mixta si la campaña es MetaAds + GoogleAds */}
      {/* Botones para subir IA según el tipo de campaña */}
      {(() => {
        const isMeta = platforms.length === 1 && (platforms[0] === 'MetaAds' || platforms[0] === 'Meta Ads');
        const isGoogle = platforms.length === 1 && (platforms[0] === 'GoogleAds' || platforms[0] === 'Google Ads');
        const isMixta = platforms.some(p => p === 'MetaAds' || p === 'Meta Ads') && platforms.some(p => p === 'GoogleAds' || p === 'Google Ads');
        if (isMeta) {
          return (
            <div className="mt-10 flex flex-col items-center">
              <button
                className="px-6 py-3 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-lg shadow mb-2 disabled:opacity-60"
                onClick={async () => {
                  setUploading(true);
                  setUploadMsg(null);
                  try {
                    const { subirCampaniaIA } = await import('./uploadCampaignIA');
                    if (!user) {
                      setUploadMsg('Debes iniciar sesión.');
                    } else {
                      await subirCampaniaIA(user.uid, campaignId);
                      setUploadMsg('Campaña IA de Meta Ads subida correctamente.');
                    }
                  } catch {
                    setUploadMsg('Error al subir la campaña IA.');
                  }
                  setUploading(false);
                }}
                disabled={uploading}
              >
                {uploading ? 'Subiendo campaña IA Meta Ads...' : 'Subir campaña IA Meta Ads'}
              </button>
              {uploadMsg && <span className="text-sm text-gray-600 mt-1">{uploadMsg}</span>}
            </div>
          );
        }
        if (isGoogle) {
          return (
            <div className="mt-10 flex flex-col items-center">
              <button
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow mb-2 disabled:opacity-60"
                onClick={async () => {
                  setUploading(true);
                  setUploadMsg(null);
                  try {
                    const { subirCampaniaIAGoogle } = await import('./uploadCampaignIAGoogle');
                    if (!user) {
                      setUploadMsg('Debes iniciar sesión.');
                    } else {
                      await subirCampaniaIAGoogle(user.uid, campaignId);
                      setUploadMsg('Campaña IA de Google Ads subida correctamente.');
                    }
                  } catch {
                    setUploadMsg('Error al subir la campaña IA.');
                  }
                  setUploading(false);
                }}
                disabled={uploading}
              >
                {uploading ? 'Subiendo campaña IA Google Ads...' : 'Subir campaña IA Google Ads'}
              </button>
              {uploadMsg && <span className="text-sm text-gray-600 mt-1">{uploadMsg}</span>}
            </div>
          );
        }
        if (isMixta) {
          return (
            <div className="mt-10 flex flex-col items-center">
              <button
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow mb-2 disabled:opacity-60"
                onClick={handleUploadMixta}
                disabled={uploading}
              >
                {uploading ? 'Subiendo campaña IA Mixta...' : 'Subir campaña IA Mixta'}
              </button>
              {uploadMsg && <span className="text-sm text-gray-600 mt-1">{uploadMsg}</span>}
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}

// ...existing code...
export default DashboardCampaignTabs;