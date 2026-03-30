import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDj0PKIiyaSjCaaXR06bPjmpgrZSMO4Izo",
    authDomain: "linky-qr.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: "linky-qr.firebasestorage.app",
    messagingSenderId: "653414355263",
    appId: "1:653414355263:web:b4672d29c971e8619a838a",
    measurementId: "G-2E8VELY2EJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
