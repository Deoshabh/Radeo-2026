const jwt = require("jsonwebtoken");

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

    // Verify token
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!accessSecret) {
      return res.status(500).json({ message: "JWT secret not configured" });
    }
    const decoded = jwt.verify(token, accessSecret);

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
  return async (req, res, next) => {
    try {
      // Bypass preflight requests
      if (req.method === "OPTIONS") {
        return next();
      }

      const User = require("../models/User");
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      return next();
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
};
