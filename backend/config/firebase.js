/**
 * Firebase Admin — Minimized footprint
 * Only initializes Auth (no Firestore, Storage, Analytics)
 * Import only { getAuth } from firebase-admin/auth
 */
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { log } = require("../utils/logger");

let firebaseAuth = null;

if (!getApps().length) {
  try {
    if (
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "radeo-2026",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      log.success("Firebase Admin initialized with environment variables");
    } else {
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "radeo-2026",
      });
      log.warn(
        "Firebase Admin initialized without credentials (limited functionality)",
      );
    }

    firebaseAuth = getAuth();
  } catch (error) {
    log.error("Firebase Admin initialization error", error);
  }
}

// Export auth instance + backward-compat admin-shaped object
// Callers using admin.auth() still work via the proxy
module.exports = new Proxy(
  { firebaseAuth },
  {
    get(target, prop) {
      if (prop === "firebaseAuth") return target.firebaseAuth;
      // Backward compat: admin.auth() returns the same auth instance
      if (prop === "auth") return () => target.firebaseAuth;
      return undefined;
    },
  },
);
