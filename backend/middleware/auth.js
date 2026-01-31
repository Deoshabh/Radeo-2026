const jwt = require("jsonwebtoken");

// Authenticate JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Attach user id to request (compatible with existing controllers)
    // Handle both token formats: { id: ... } from authController and { userId: ... } from utils
    const userId = decoded.userId || decoded.id;
    req.userId = userId;

    // Fetch user to get role for authorization checks
    const User = require("../models/User");
    const user = await User.findById(userId).select("role");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: userId, role: user.role };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Authorize user role
exports.authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      const User = require("../models/User");
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
};
