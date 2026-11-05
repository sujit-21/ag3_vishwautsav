import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB_fvhMxmCn-YbnPhz2ycqQ4x1qd9xpllM",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vishwautsav-auth-mobile.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vishwautsav-auth-mobile",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vishwautsav-auth-mobile.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "656659951475",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:656659951475:web:f059be35da65e69f76df06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;

