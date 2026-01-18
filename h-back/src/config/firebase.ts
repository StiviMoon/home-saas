import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || "housing-complex-ff56c",
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID || "housing-complex-ff56c",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    clientEmail:
      process.env.FIREBASE_CLIENT_EMAIL ||
      "firebase-adminsdk-fbsvc@housing-complex-ff56c.iam.gserviceaccount.com",
  }),
};

// Initialize Firebase Admin
let adminApp: App;
let adminAuth: ReturnType<typeof getAuth>;
let adminDb: ReturnType<typeof getFirestore>;

if (getApps().length === 0) {
  try {
    adminApp = initializeApp(firebaseAdminConfig);
    console.log("✅ Firebase Admin inicializado correctamente");
    console.log(`📦 Project ID: ${firebaseAdminConfig.projectId}`);
  } catch (error: any) {
    console.error("❌ Error al inicializar Firebase Admin:", error.message);
    throw error;
  }
} else {
  adminApp = getApps()[0];
}

adminAuth = getAuth(adminApp);
adminDb = getFirestore(adminApp);

export { adminApp, adminAuth, adminDb };

