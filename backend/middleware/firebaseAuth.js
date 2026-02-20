const { firebaseAuth } = require("../config/firebase");
const { log } = require("../utils/logger");

/**
 * Firebase Auth middleware — verifies Firebase ID token from Authorization header.
 * Attaches decoded token to req.firebaseUser.
 *
 * Use this for routes where the React Native app sends a raw Firebase ID token
 * (as opposed to the JWT access token issued by our own backend).
 */
exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!firebaseAuth) {
      log.error("Firebase Admin SDK not initialized");
      return res.status(500).json({ success: false, message: "Auth service unavailable" });
    }

    const decoded = await firebaseAuth.verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ success: false, message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({ success: false, message: "Token revoked", code: "TOKEN_REVOKED" });
    }
    if (error.code === "auth/argument-error") {
      return res.status(401).json({ success: false, message: "Invalid token format" });
    }
    log.error("Firebase token verification failed:", error);
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/**
 * Optional Firebase Auth — same as above but does NOT reject if no token is present.
 * Useful for public routes that behave differently for authenticated users.
 */
exports.optionalFirebaseAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!firebaseAuth) {
      return next();
    }

    const decoded = await firebaseAuth.verifyIdToken(token);
    req.firebaseUser = decoded;
  } catch {
    // Silently continue — token invalid or expired, treat as unauthenticated
  }
  next();
};
