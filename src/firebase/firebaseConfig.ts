// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);