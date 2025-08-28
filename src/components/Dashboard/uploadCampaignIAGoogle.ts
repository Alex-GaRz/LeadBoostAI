import { db } from '../../firebase/firebaseConfig';
import { doc, setDoc, collection, addDoc, getDoc } from 'firebase/firestore';

// Importa el JSON de Google Ads (ajusta la ruta si es necesario)
import campaignIAGoogleData from './CampaignIAGoogle.json';

/**
 * Sube los datos IA de Google Ads como subcolección 'ia_data' dentro de una campaña específica.
 * @param userId string - ID del usuario
 * @param campaignId string - ID del documento de campaña principal
 */
export async function subirCampaniaIAGoogle(userId: string, campaignId: string) {
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
  await addDoc(iaColRef, campaignIAGoogleData);
}
