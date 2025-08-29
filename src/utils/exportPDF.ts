import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exporta la campaña a PDF con el formato LeadBoost
 * @param {object} params - Parámetros para exportar
 * @param {any} campaignData - Datos generales de la campaña
 * @param {any} iaData - Datos IA de la campaña
 * @param {string} activeTab - Plataforma activa (Meta Ads, Google Ads, etc)
 * @param {React.RefObject[]} adPreviewRefs - Referencias a los nodos de vista previa de variantes
 * @param {object} adPreviewRefsMixto - Referencias para campañas mixtas
 */
export async function exportPDF({
  campaignData,
  iaData,
  activeTab,
  adPreviewRefs,
  adPreviewRefsMixto
}: {
  campaignData: any,
  iaData: any,
  activeTab: string,
  adPreviewRefs: React.RefObject<any>[],
  adPreviewRefsMixto?: {
    [platform: string]: React.RefObject<any>[]
  }
}) {
  // Detectar si es campaña mixta (Meta Ads y Google Ads)
  const isMixta = iaData && iaData['Meta Ads'] && iaData['Google Ads'];
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  // Helper para exportar una plataforma (Google Ads o Meta Ads)
  async function exportPlataforma({
    nombrePlataforma,
    iaDataPlataforma,
    adPreviewRefsPlataforma
  }: {
    nombrePlataforma: string,
    iaDataPlataforma: any,
    adPreviewRefsPlataforma: React.RefObject<any>[]
  }) {
    let y = 50;
    // Encabezado principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(44, 71, 146);
    doc.text(`Reporte de Campaña Publicitaria - ${nombrePlataforma}`, 40, y);
    y += 30;

    // Subtítulo con nombre de campaña
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(campaignData?.business_name || campaignData?.nombre_marca || 'Nombre de la campaña', 40, y);
    y += 18;
    doc.setDrawColor(44, 71, 146);
    doc.setLineWidth(1);
    doc.line(40, y, 555, y);
    y += 18;

    // Detalles generales
    doc.setFillColor(247, 248, 250);
    doc.roundedRect(35, y, 520, 110, 8, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(44, 71, 146);
    doc.text('Detalles Generales', 50, y + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Plataforma: ${nombrePlataforma}`, 50, y + 45);
    doc.text(`Objetivo: ${campaignData?.objetivo || ''}`, 50, y + 63);
    doc.text(`Duración: ${campaignData?.duracion || ''}`, 50, y + 81);
    doc.text(`Presupuesto: ${campaignData?.budget_amount || ''} ${campaignData?.budget_currency || ''}`, 300, y + 45);
    doc.text(`Estado: Pendiente`, 300, y + 63);
    y += 125;

    // Resultados esperados
    let resultadosEsperadosHeight = 110;
    let resultadosEsperadosLines: string[][] = [];
    if (iaDataPlataforma?.['Resultados esperados']) {
      resultadosEsperadosLines = Object.entries(iaDataPlataforma['Resultados esperados']).map(([key, value]) => {
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
    doc.setTextColor(0, 0, 0);
    if (iaDataPlataforma?.['Resultados esperados']) {
      let yLine = y + 45;
      for (const lineArr of resultadosEsperadosLines) {
        doc.text(lineArr, 50, yLine);
        yLine += 18;
      }
    } else {
      doc.text('No hay resultados esperados disponibles.', 50, y + 45);
    }
    y += resultadosEsperadosHeight + 15;

    // Segmentación sugerida
    doc.setFillColor(247, 248, 250);
    doc.roundedRect(35, y, 520, 90, 8, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(44, 71, 146);
    doc.text('Segmentación sugerida', 50, y + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Público objetivo: ${campaignData?.publico || '-'}`, 50, y + 45);
    doc.text(`Lugares: ${(Array.isArray(campaignData?.lugares) ? campaignData.lugares.join(', ') : campaignData?.lugares) || '-'}`, 50, y + 63);
    doc.text(`Estilo: ${(campaignData?.estilo || []).join(', ') || '-'}`, 50, y + 81);
    y += 105;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(40, y, 555, y);
    y += 15;

    // Variantes de anuncio (cada una en una hoja)
    const maxWidth = 500;
    for (let v = 1; v <= 3; v++) {
      doc.addPage();
      y = 50;
      const previewNode = adPreviewRefsPlataforma[v - 1]?.current;
      let pdfHeight = 0;
      let imgData = null;
      if (previewNode) {
        const canvas = await html2canvas(previewNode, { backgroundColor: '#fff', scale: 2 });
        imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = 400;
        pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      }
      let fields: { label: string; value: string }[] = [];
      if (nombrePlataforma === 'Meta Ads') {
        fields = [
          { label: 'Título', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Título del anuncio'] || '-' },
          { label: 'Texto principal', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Texto principal'] || '-' },
          { label: 'CTA', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.CTA || '-' },
          { label: 'Ideas de imágenes/videos', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Ideas de imágenes/videos'] || '-' },
          { label: 'Formatos sugeridos', value: (iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Formatos sugeridos'] || []).join(', ') },
          { label: 'Audiencias personalizadas/lookalikes', value: (iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Audiencias personalizadas/lookalikes'] || []).join(', ') },
        ];
      } else if (nombrePlataforma === 'Google Ads') {
        fields = [
          { label: 'Título sugerido', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Título sugerido'] || '-' },
          { label: 'Descripción corta', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Descripción corta'] || '-' },
          { label: 'Keywords recomendadas', value: (iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Keywords recomendadas'] || []).join(', ') },
          { label: 'CTA', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.CTA || '-' },
          { label: 'Estrategia de puja', value: iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Estrategia de puja'] || '-' },
          { label: 'Negative keywords', value: (iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Negative keywords'] || []).join(', ') },
          { label: 'Extensiones de anuncio', value: (iaDataPlataforma?.['Anuncio generado por IA']?.[`Variante ${v}`]?.['Extensiones de anuncio'] || []).join(', ') },
        ];
      }
      let yVarCalc = 45;
      for (const field of fields) {
        const lines = doc.splitTextToSize(`${field.label}: ${field.value}`, maxWidth - 30);
        yVarCalc += lines.length * 13 + 2;
      }
      const textHeight = yVarCalc - 45;
      const imageHeight = pdfHeight > 0 ? pdfHeight + 20 : 0;
      const blockHeight = 40 + textHeight + imageHeight;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(35, y, 520, blockHeight, 8, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(44, 71, 146);
      let lines = doc.splitTextToSize(`Variante ${v} (${nombrePlataforma})`, maxWidth);
      doc.text(lines, 50, y + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      let yVar = y + 45;
      for (const field of fields) {
        lines = doc.splitTextToSize(`${field.label}: ${field.value}`, maxWidth - 30);
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
  }

  if (isMixta) {
    // Exportar ambas plataformas para campañas mixtas
    const googleRefs = adPreviewRefsMixto?.['Google Ads'] || adPreviewRefs;
    const metaRefs = adPreviewRefsMixto?.['Meta Ads'] || adPreviewRefs;
    await exportPlataforma({
      nombrePlataforma: 'Google Ads',
      iaDataPlataforma: iaData['Google Ads'],
      adPreviewRefsPlataforma: googleRefs
    });
    doc.addPage();
    await exportPlataforma({
      nombrePlataforma: 'Meta Ads',
      iaDataPlataforma: iaData['Meta Ads'],
      adPreviewRefsPlataforma: metaRefs
    });
  } else {
    // Exportar solo la plataforma activa para campañas individuales
    await exportPlataforma({
      nombrePlataforma: activeTab,
      iaDataPlataforma: iaData,
      adPreviewRefsPlataforma: adPreviewRefs
    });
  }

  doc.save('campaña.pdf');
}