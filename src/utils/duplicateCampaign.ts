import { collection, doc, getDoc, addDoc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Duplica una campaña y su subcolección ia_data en Firestore.
 * @param userUid UID del usuario
 * @param campaignId ID de la campaña original
 * @param navigate función de navegación (por ejemplo, useNavigate de react-router)
 */
export async function duplicateCampaign(userUid: string, campaignId: string, navigate: (url: string) => void) {
  if (!userUid || !campaignId) return;
  try {
    // 1. Leer datos de la campaña original
    const origRef = doc(db, `clients/${userUid}/campaigns/${campaignId}`);
    const origSnap = await getDoc(origRef);
    if (!origSnap.exists()) throw new Error('No se encontró la campaña original');
    const origData = origSnap.data();
    // 2. Crear nueva campaña
    const campaignsCol = collection(db, `clients/${userUid}/campaigns`);
    const newDocRef = await addDoc(campaignsCol, {
      ...origData,
      nombre: (origData.nombre || origData.business_name || 'Campaña duplicada') + ' (copia)',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    // 3. Copiar subcolección ia_data
    const iaDataCol = collection(db, `clients/${userUid}/campaigns/${campaignId}/ia_data`);
    const iaDataSnap = await getDocs(iaDataCol);
    for (const iaDoc of iaDataSnap.docs) {
      const iaDocRef = doc(db, `clients/${userUid}/campaigns/${newDocRef.id}/ia_data/${iaDoc.id}`);
      await setDoc(iaDocRef, iaDoc.data());
    }
    // 4. Navegar a la nueva campaña
    navigate(`/dashboard/campaign/${newDocRef.id}`);
  } catch (e) {
    alert('Error al duplicar campaña: ' + (e instanceof Error ? e.message : String(e)));
  }
}
