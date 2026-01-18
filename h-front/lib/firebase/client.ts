import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Validar variables de entorno requeridas
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Verificar que las variables requeridas estén configuradas
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value || value.includes("REEMPLAZA") || value === "...")
  .map(([key]) => key);

if (missingVars.length > 0 && typeof window !== "undefined") {
  const errorMessage = `
❌ ERROR: Variables de Firebase no configuradas

Faltan las siguientes variables en tu archivo .env.local:
${missingVars.map((v) => `   - NEXT_PUBLIC_FIREBASE_${v.toUpperCase()}`).join("\n")}

💡 Para obtener estos valores:
1. Ve a Firebase Console: https://console.firebase.google.com/project/housing-complex-ff56c/settings/general
2. En la sección "Your apps", busca tu app web o crea una nueva
3. Copia el valor de "apiKey" y "appId" del objeto firebaseConfig
4. Agrega estos valores a tu archivo .env.local

📝 Ejemplo de .env.local:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...tu-api-key-real...
NEXT_PUBLIC_FIREBASE_APP_ID=1:316758335060:web:...tu-app-id-real...
  `;
  
  console.error(errorMessage);
  throw new Error(`Firebase no está configurado correctamente. Revisa la consola para más detalles.`);
}

const firebaseConfig = {
  projectId: "housing-complex-ff56c",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "housing-complex-ff56c.firebaseapp.com",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "housing-complex-ff56c.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "316758335060",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };