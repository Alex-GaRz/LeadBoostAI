import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, storage } from '../firebase/firebaseConfig';
import { ref, listAll, getDownloadURL, getBytes, uploadBytes } from 'firebase/storage';
import { generateId } from './generateId';

// Función para duplicar archivos en Storage de una ruta a otra
const duplicateStorageFiles = async (sourcePath: string, destinationPath: string): Promise<string[]> => {
  try {
    const sourceRef = ref(storage, sourcePath);
    const sourceFiles = await listAll(sourceRef);

    if (sourceFiles.items.length === 0) {
      return []; // No hay archivos que duplicar en esta ruta
    }

    const uploadPromises = sourceFiles.items.map(async (itemRef) => {
      const fileBytes = await getBytes(itemRef);
      const destinationFileRef = ref(storage, `${destinationPath}/${itemRef.name}`);
      await uploadBytes(destinationFileRef, fileBytes);
      return getDownloadURL(destinationFileRef);
    });

    return Promise.all(uploadPromises);
  } catch (error) {
    // Si la carpeta no existe, listAll puede fallar. Lo ignoramos.
    if (error.code !== 'storage/object-not-found') {
      console.error(`Error duplicating files from ${sourcePath} to ${destinationPath}:`, error);
      throw error;
    }
    return [];
  }
};

export const duplicateCampaign = async (
  userId: string,
  originalCampaignId: string
): Promise<string> => {
  if (!userId || !originalCampaignId) {
    throw new Error('User ID and original campaign ID are required.');
  }

  const newCampaignId = generateId();
  const batch = writeBatch(db);

  // 1. Duplicar el documento principal de la campaña
  const originalCampaignRef = doc(db, `clients/${userId}/campaigns/${originalCampaignId}`);
  const originalCampaignSnap = await getDoc(originalCampaignRef);

  if (!originalCampaignSnap.exists()) {
    throw new Error('Original campaign not found.');
  }

  const originalCampaignData = originalCampaignSnap.data();
  let newCampaignData = {
    ...originalCampaignData,
    campaign_id: newCampaignId,
    business_name: `${originalCampaignData.business_name} (Copia)`,
    createdAt: new Date(),
    generated_image_url: '',
    assets: { images_videos: [] },
  };

  // 3. Duplicar archivos en Firebase Storage y obtener nuevas URLs
  const originalStoragePath = `clients/${userId}/campaigns/${originalCampaignId}`;
  const newStoragePath = `clients/${userId}/campaigns/${newCampaignId}`;

  // Duplicar 'user_uploads' y obtener nuevas URLs
  const newUserUploadsUrls = await duplicateStorageFiles(
    `${originalStoragePath}/user_uploads`,
    `${newStoragePath}/user_uploads`
  );
  if (newUserUploadsUrls.length > 0) {
    newCampaignData.assets.images_videos = newUserUploadsUrls;
  }

  // Duplicar 'ia_data' y obtener la nueva URL de la imagen generada
  const newIaDataUrls = await duplicateStorageFiles(
    `${originalStoragePath}/ia_data`,
    `${newStoragePath}/ia_data`
  );
  if (newIaDataUrls.length > 0) {
    newCampaignData.generated_image_url = newIaDataUrls[0]; // Asumimos que solo hay una imagen generada
  }

  const newCampaignRef = doc(db, `clients/${userId}/campaigns/${newCampaignId}`);
  batch.set(newCampaignRef, newCampaignData);

  // 2. Duplicar la subcolección 'ia_data'
  const originalIaDataCollection = collection(db, `clients/${userId}/campaigns/${originalCampaignId}/ia_data`);
  const newIaDataCollection = collection(db, `clients/${userId}/campaigns/${newCampaignId}/ia_data`);
  const iaDataSnapshot = await getDocs(originalIaDataCollection);

  iaDataSnapshot.forEach((docSnapshot) => {
    const newIaDocRef = doc(newIaDataCollection, docSnapshot.id);
    batch.set(newIaDocRef, docSnapshot.data());
  });

  // Ejecutar el batch de Firestore
  await batch.commit();

  return newCampaignId;
};
