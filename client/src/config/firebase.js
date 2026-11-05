import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const rawApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB_fvhMxmCn-yBnPhz2ycqQ4x1qd9xpllM").trim();
// Automatically sanitize letter casing mismatch if Vercel env variable still has Ybn
const sanitizedApiKey = rawApiKey.replace('-Ybn', '-yBn');

const firebaseConfig = {
    apiKey: sanitizedApiKey,
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vishwautsav-auth-mobile.firebaseapp.com").trim(),
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || "vishwautsav-auth-mobile").trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vishwautsav-auth-mobile.firebasestorage.app").trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "656659951475").trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID || "1:656659951475:web:f059be35da65e69f76df06").trim()
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;

