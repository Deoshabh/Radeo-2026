// Firebase Configuration and Initialization
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate critical Firebase config (only on client — SSR will have undefined values
// since NEXT_PUBLIC_* is inlined at build time, which is fine for the server).
if (typeof window !== "undefined" && !firebaseConfig.apiKey) {
  console.error(
    "⚠️ Firebase API key is missing! Ensure NEXT_PUBLIC_FIREBASE_API_KEY " +
    "is set at BUILD TIME in your Dokploy/Nixpacks environment variables."
  );
}

// Initialize Firebase (singleton pattern — client-side only)
let app;
let auth;
let analytics;

if (typeof window !== "undefined") {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);

  // Initialize Analytics only on client side and if supported
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, analytics };
export default firebaseConfig;
