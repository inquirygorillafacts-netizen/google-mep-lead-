import * as admin from "firebase-admin";

const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  try {
    if (privateKey && clientEmail && projectId) {
      // Handle both literal \n and real newlines
      const formattedKey = privateKey.includes('\n') 
        ? privateKey 
        : privateKey.replace(/\\n/g, '\n');
      
      const cleanKey = formattedKey.replace(/"/g, '').trim();

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: cleanKey,
        }),
      });
      console.log("✅ Firebase Admin Initialized Successfully");
    } else {
      console.warn("⚠️ Firebase Admin credentials missing. Admin features will be disabled.");
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
  }
}

// Export database and auth instances safely
export const adminDb = admin.apps.length ? admin.firestore() : null!;
export const adminAuth = admin.apps.length ? admin.auth() : null!;
