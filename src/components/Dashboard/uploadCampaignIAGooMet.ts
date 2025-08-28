import { db } from '../../firebase/firebaseConfig';
import { doc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';
import campaignIAGooMetData from './CampaignIAGooMet.json';

/**
 * Sube los datos IA de una campaña Mixta (Meta Ads + Google Ads) como subcolección 'ia_data' dentro de una campaña específica.
 * Ambos tipos de datos se guardan en el mismo documento.
 * @param userId string - ID del usuario
 * @param campaignId string - ID del documento de campaña principal
 */
export async function subirCampaniaIAGooMet(userId: string, campaignId: string) {
  // Referencia al documento de campaña principal
  const campaignDocRef = doc(db, `clients/${userId}/campaigns/${campaignId}`);
  // Verifica si existe el documento de campaña
  const campaignSnap = await getDoc(campaignDocRef);
  if (!campaignSnap.exists()) {
    // Si no existe, crea un documento vacío o con datos mínimos
    await setDoc(campaignDocRef, { createdAt: new Date() });
  }
  // Ahora sí, agrega la subcolección
  const iaColRef = collection(campaignDocRef, 'ia_data');
  // Guardar ambos tipos de datos en el mismo documento
  const docToSave = {
    "Nombre de campaña": campaignIAGooMetData["Nombre de campaña"],
    "Meta Ads": campaignIAGooMetData["Meta Ads"],
    "Google Ads": campaignIAGooMetData["Google Ads"]
  };
  await addDoc(iaColRef, docToSave);
}
