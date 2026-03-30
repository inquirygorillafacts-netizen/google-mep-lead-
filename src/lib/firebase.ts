import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB45iNMMUT7zdxmW0b82NnRAaOULkv70vo",
    authDomain: "studio-3850868995-4f1cf.firebaseapp.com",
    projectId: "studio-3850868995-4f1cf",
    storageBucket: "studio-3850868995-4f1cf.firebasestorage.app",
    messagingSenderId: "551130287873",
    appId: "1:551130287873:web:3cf410cb106c142382d500"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
