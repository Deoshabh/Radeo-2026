const admin = (req, res, next) => {
  // ✅ CORS Fix: Bypass OPTIONS preflight requests
  // Traefik handles preflight at proxy level, auth not needed
  if (req.method === "OPTIONS") {
    return next();
  }

  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

const requireRole = (roles) => (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Insufficient permissions" });
  }
  next();
};

module.exports = admin;
module.exports.requireRole = requireRole;
