import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User } from 'firebase/auth';

export interface ClientProfile {
  uid: string;
  email: string;
  displayName: string;
  userName?: string;
  userRole?: string;
  createdAt?: any;
  updatedAt?: any;
  profileCompleted?: boolean;
  companyName?: string;
}

// Crear perfil de cliente automáticamente
export const createClientProfile = async (user: User): Promise<void> => {
  try {
    const clientRef = doc(db, 'clients', user.uid);
    const clientDoc = await getDoc(clientRef);
    
    // Solo crear si no existe
    if (!clientDoc.exists()) {
      const profileData: ClientProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(clientRef, profileData);
    }
  } catch (error) {
    console.error('Error creating client profile:', error);
    throw new Error('Error al crear perfil de cliente');
  }
};

/**
 * Actualiza o fusiona los datos del usuario en Firestore (colección 'clients')
 * @param uid string - UID del usuario
 * @param data object - Datos a actualizar/añadir
 */
export const updateUserProfile = async (uid: string, data: Record<string, any>) => {
  const userRef = doc(db, 'clients', uid);
  await setDoc(userRef, { ...data, profileCompleted: true }, { merge: true });
};

// Obtener perfil de cliente
export const getClientProfile = async (uid: string): Promise<ClientProfile | null> => {
  try {
    const clientRef = doc(db, 'clients', uid);
    const clientDoc = await getDoc(clientRef);
    
    if (clientDoc.exists()) {
      return clientDoc.data() as ClientProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting client profile:', error);
    throw new Error('Error al obtener perfil de cliente');
  }
};

// Actualizar perfil de cliente
export const updateClientProfile = async (uid: string, data: Partial<ClientProfile>): Promise<void> => {
  try {
    const clientRef = doc(db, 'clients', uid);
    await updateDoc(clientRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating client profile:', error);
    throw new Error('Error al actualizar perfil de cliente');
  }
};

// Obtener o crear perfil de cliente (función helper)
export const getOrCreateClientProfile = async (user: User): Promise<ClientProfile> => {
  try {
    let profile = await getClientProfile(user.uid);
    
    if (!profile) {
      await createClientProfile(user);
      profile = await getClientProfile(user.uid);
    }
    
    return profile!;
  } catch (error) {
    console.error('Error in getOrCreateClientProfile:', error);
    throw error;
  }
};