// Firebase configuration
// Reemplaza estos valores con tu configuración real de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBl042JLCvJtOhpFHjWXbNSPtF9J4Ftb8Y",
  authDomain: "leadboost-ai-1966c.firebaseapp.com",
  projectId: "leadboost-ai-1966c",
  storageBucket: "leadboost-ai-1966c.firebasestorage.app",
  messagingSenderId: "681952814249",
  appId: "1:681952814249:web:56de4dcf9d21bc3ac775b8",
  measurementId: "G-7NPL93WLJY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;