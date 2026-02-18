const jwt = require("jsonwebtoken");

/**
 * Verify JWT with rotation support.
 * Tries current secret first, falls back to previous secret during rotation window.
 */
function verifyWithRotation(token) {
  const currentSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const previousSecret = process.env.JWT_SECRET_PREVIOUS;

  try {
    return jwt.verify(token, currentSecret);
  } catch (err) {
    // If a previous secret is configured, try it (rotation window)
    if (previousSecret && (err.name === "JsonWebTokenError")) {
      return jwt.verify(token, previousSecret);
    }
    throw err; // Re-throw — will be caught by caller
  }
}

// Authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Bypass preflight requests
    if (req.method === "OPTIONS") {
      return next();
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token (with rotation support)
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!accessSecret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }
    const decoded = verifyWithRotation(token);

    // Handle both token formats: { id: ... } and { userId: ... }
    const userId = decoded.userId || decoded.id;
    req.userId = userId;

    // Fetch user to get role for authorization checks
    const User = require("../models/User");
    const user = await User.findById(userId).select("role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: userId, _id: userId, role: user.role };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Authorize user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Bypass preflight requests
    if (req.method === "OPTIONS") {
      return next();
    }

    // req.user is already set by authenticate middleware (from JWT payload)
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    return next();
  };
};

// Optional auth — attaches user if token present, but doesn't reject unauthenticated requests
exports.optionalAuth = async (req, res, next) => {
  try {
    if (req.method === "OPTIONS") return next();

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // No token — continue without user
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyWithRotation(token);
    const userId = decoded.userId || decoded.id;

    const User = require("../models/User");
    const user = await User.findById(userId).select("role");
    if (user) {
      req.user = { id: userId, _id: userId, role: user.role };
    }
  } catch {
    // Token invalid/expired — continue without user
  }
  next();
};
