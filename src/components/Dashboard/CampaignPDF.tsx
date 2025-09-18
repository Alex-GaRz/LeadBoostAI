import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { CampaignData, IaData } from './DashboardCampaignTabs';

// Registrar fuentes (opcional, pero recomendado para un buen diseño)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3iWkU9c2wyw1g5G_w.woff', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/TK3hWkU9c2wyw1g5G-s.woff', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#333',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  campaignTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3f51b5',
    marginBottom: 10,
    borderBottom: '2px solid #3f51b5',
    paddingBottom: 5,
  },
  field: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  fieldLabel: {
    fontWeight: 'bold',
    marginRight: 5,
    width: 150,
  },
  fieldValue: {
    flex: 1,
  },
  variantBlock: {
    marginTop: 20,
    marginBottom: 20,
    padding: 18,
    border: '1px solid #ddd',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  variantTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a237e',
  },
  previewImage: {
    width: '100%',
    height: 'auto',
    marginTop: 10,
    borderRadius: 5,
  },
});

interface CampaignPDFProps {
  campaignData: CampaignData | undefined;
  iaData: IaData | null;
}

const CampaignPDF: React.FC<CampaignPDFProps> = ({ campaignData, iaData }) => (

  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.campaignTitle}>{iaData?.['Nombre de campaña'] || 'Reporte de Campaña'}</Text>
      </View>

      {/* Bloque combinado: Detalles de la Campaña */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles de la Campaña</Text>
        {/* Resumen */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Nombre de la Empresa:</Text>
          <Text style={styles.fieldValue}>{campaignData?.business_name || 'No especificado'}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Producto/Servicio:</Text>
          <Text style={styles.fieldValue}>{campaignData?.product_service || 'No especificado'}</Text>
        </View>
        {/* Estrategia */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Objetivos:</Text>
          <Text style={styles.fieldValue}>{campaignData?.objetivo || 'Conseguir más clientes'}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Público Objetivo:</Text>
          <Text style={styles.fieldValue}>{campaignData?.target_audience || campaignData?.publico || 'No especificado'}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ubicación:</Text>
          <Text style={styles.fieldValue}>{(campaignData?.locations && Array.isArray(campaignData.locations) && campaignData.locations.length > 0) ? campaignData.locations.join(', ') : (campaignData?.lugares && campaignData.lugares.length > 0 ? campaignData.lugares.join(', ') : 'No especificado')}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Presupuesto:</Text>
          <Text style={styles.fieldValue}>{`${campaignData?.budget_amount || ''} ${campaignData?.budget_currency || ''}`.trim() || 'No especificado'}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Duración:</Text>
          <Text style={styles.fieldValue}>{campaignData?.duracion || '1 mes'}</Text>
        </View>
      </View>

      {/* Sección de Variantes de Anuncio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Variantes de Anuncio (Generadas por IA)</Text>
        {iaData?.['Anuncio generado por IA'] && Object.keys(iaData['Anuncio generado por IA']).map((variantKey) => {
          const variant = iaData['Anuncio generado por IA']?.[variantKey];
          if (!variant) return null;

          return (
            <View key={variantKey} style={styles.variantBlock} wrap={false}>
              <Text style={styles.variantTitle}>{variantKey}</Text>
              {Object.entries(variant).map(([key, value]) => (
                <View key={key} style={styles.field}>
                  <Text style={styles.fieldLabel}>{key}:</Text>
                  <Text style={styles.fieldValue}>{Array.isArray(value) ? value.join(', ') : value}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </Page>

    {/* Vista Previa en una hoja diferente */}
    {(campaignData?.user_image_url || campaignData?.generated_image_url) && (
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista Previa del Anuncio</Text>
          <Image
            style={styles.previewImage}
            src={campaignData.user_image_url || campaignData.generated_image_url || ''}
          />
        </View>
      </Page>
    )}
  </Document>
);

export default CampaignPDF;
