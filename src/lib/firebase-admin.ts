import * as admin from "firebase-admin";
import fs from "fs";
import path from "path";

if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(process.cwd(), "service-account.json");
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin Initialized Successfully via service-account.json");
    } else {
      // Fallback to environment variables
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (privateKey && clientEmail && projectId) {
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
        console.log("✅ Firebase Admin Initialized Successfully via Env Vars");
      } else {
        console.warn("⚠️ Firebase Admin credentials missing.");
      }
    }
  } catch (error) {
    console.error("❌ Firebase Admin initialization error:", error);
  }
}

export const adminDb = admin.apps.length ? admin.firestore() : null!;
export const adminAuth = admin.apps.length ? admin.auth() : null!;
