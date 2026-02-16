// ===============================
// Load environment variables FIRST
// ===============================
const dotenv = require("dotenv");
dotenv.config();

// ===============================
// Imports
// ===============================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const { initializeBucket } = require("./utils/minio");
const { logger, log } = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { preventCaching } = require("./middleware/security");
const {
  startShiprocketReconciliationWorker,
} = require("./services/shiprocketReconciliationService");

// ===============================
// NoSQL injection sanitizer (Express 5 compatible)
// express-mongo-sanitize is NOT compatible with Express 5
// because req.query is read-only in Express 5.
// ===============================
function sanitizeValue(val) {
  if (typeof val === "string") return val;
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (typeof val === "object") {
    const clean = {};
    for (const key of Object.keys(val)) {
      if (key.startsWith("$")) continue; // strip MongoDB operators
      clean[key] = sanitizeValue(val[key]);
    }
    return clean;
  }
  return val;
}

function mongoSanitize(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  // req.query is read-only in Express 5 — clone, sanitize, and expose as req.sanitizedQuery
  if (req.query && typeof req.query === "object") {
    try {
      req.sanitizedQuery = sanitizeValue(JSON.parse(JSON.stringify(req.query)));
    } catch {
      req.sanitizedQuery = {};
    }
  } else {
    req.sanitizedQuery = {};
  }
  if (req.params && typeof req.params === "object") {
    for (const key of Object.keys(req.params)) {
      if (
        typeof req.params[key] === "string" &&
        req.params[key].startsWith("$")
      ) {
        req.params[key] = "";
      }
    }
  }
  next();
}

// ===============================
// App init
// ===============================
const app = express();

// ===============================
// Trust Proxy (Traefik)
// ===============================
app.set("trust proxy", 1);

// ===============================
// Database Connection
// ===============================
// ===============================
// Database Connection (Resilient)
// ===============================
const connectDB = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      log.success("MongoDB connected");
      return;
    } catch (err) {
      if (i === retries - 1) {
        log.error("Fatal: MongoDB connection failed after retries", err);
        // We do NOT exit here to keep the server alive for health checks / other routes
        // process.exit(1); 
      } else {
        log.error(`MongoDB connection failed (attempt ${i + 1}/${retries}). Retrying in 5s...`, err.message);
        await new Promise((res) => setTimeout(res, 5000));
      }
    }
  }
};

if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// ===============================
// CORS (Production safe)
// ===============================
const allowedOrigins = [
  "https://radeo.in",
  "https://www.radeo.in",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [])
];

const allowWildcardSubdomains = process.env.CORS_ALLOW_WILDCARD_SUBDOMAINS === 'true';

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check for allowed origins
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Optional wildcard allow for radeo.in subdomains (disabled by default)
      if (allowWildcardSubdomains && /^https:\/\/[a-z0-9-]+\.radeo\.in$/i.test(origin)) {
        return callback(null, true);
      }
      
      // Log blocked origin for debugging
      console.log('Blocked by CORS:', origin);
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
    exposedHeaders: ["Set-Cookie"],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }),
);

// ===============================
// Middleware
// ===============================
app.use(
  helmet({
    // Allow cross-origin requests from frontend (radeo.in → api.radeo.in)
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression()); // Compress all responses
app.use(logger); // HTTP request logging
app.use(
  express.json({
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith("/api/webhooks/")) {
        req.rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(cookieParser());
app.use(mongoSanitize); // NoSQL injection protection (after body parser)

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ===============================
// Routes
// ===============================

// Middleware to fix double URL prefix issues (e.g. from proxy misconfiguration)
app.use((req, res, next) => {
  if (req.url.startsWith('/api/v1/api/v1')) {
    req.url = req.url.substring(7); // Remove the first '/api/v1'
  }
  next();
});

app.use("/api/health", require("./routes/healthRoutes")); // Health checks
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/products", require("./routes/productRoutes"));
app.use("/api/v1/settings", require("./routes/settingsRoutes"));
app.use("/api/v1/cart", require("./routes/cartRoutes"));
app.use("/api/v1/orders", require("./routes/orderRoutes"));
app.use("/api/v1/filters", require("./routes/filterRoutes"));
app.use("/api/v1/contact", require("./routes/contactRoutes"));

// Review routes
app.use("/api/v1", require("./routes/reviewRoutes"));

// Webhook routes (must be before other middleware that might interfere)
const webhookRoutes = require("./routes/webhookRoutes");
app.use("/api/webhooks", webhookRoutes);
app.use("/api/v1/webhooks", webhookRoutes);

// Apply robust cache prevention for all Admin APIs
app.use("/api/v1/admin", preventCaching);

app.use("/api/v1/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/v1/admin/products", require("./routes/adminProductRoutes"));
app.use("/api/v1/admin/coupons", require("./routes/adminCouponRoutes"));
app.use("/api/v1/admin", require("./routes/adminStatsRoutes"));
app.use("/api/v1/admin/categories", require("./routes/adminCategoryRoutes"));
app.use("/api/v1/admin/users", require("./routes/adminUserRoutes"));
app.use("/api/v1/admin/media", require("./routes/adminMediaRoutes"));
app.use("/api/v1/admin/filters", require("./routes/adminFilterRoutes"));
app.use("/api/v1/admin/shiprocket", require("./routes/shiprocketRoutes"));
app.use("/api/v1/admin/reviews", require("./routes/adminReviewRoutes"));
app.use("/api/v1/admin/settings", require("./routes/adminSettingsRoutes"));

app.use("/api/v1/coupons", require("./routes/couponRoutes"));
app.use("/api/v1/categories", require("./routes/categoryRoutes"));
app.use("/api/v1/addresses", require("./routes/addressRoutes"));
app.use("/api/v1/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/v1/user", require("./routes/userRoutes"));

// ===============================
// 404 Handler (must be after all routes)
// ===============================
app.use(notFoundHandler);

// ===============================
// Global Error Handler (must be last)
// ===============================
app.use(errorHandler);

// ===============================
// Health Check (deprecated - use /api/health)
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Use /api/health for detailed health check",
  });
});

// ===============================
// START SERVER (BLOCKING)
// ===============================
async function startServer() {
  try {
    // 🔴 CRITICAL: Attempt S3 storage initialization
    // We do NOT exit the process if this fails, so that the API remains available for non-media tasks.
    try {
      await initializeBucket();
      log.success("S3 storage initialized — starting server");
    } catch (e) {
      log.error("⚠️ S3 Initializaton Failed: Media uploads will not work.", e);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      log.success(`Server running on port ${PORT}`);
      log.info("CORS allowed origins", { origins: allowedOrigins });
      startShiprocketReconciliationWorker();
    });
  } catch (err) {
    log.error("Fatal startup error", err);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  startServer();
}

// Export app for testing
module.exports = app;
