// ===============================
// Load environment variables FIRST
// ===============================
const dotenv = require("dotenv");
dotenv.config();

// Validate all env vars before anything else
const { validateEnv } = require("./config/env");
validateEnv();

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
const { logger, log, requestContext } = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const { preventCaching } = require("./middleware/security");
const { requestId } = require("./middleware/requestId");
const { metricsRouter, metricsMiddleware } = require("./routes/metricsRoutes");
const {
  startShiprocketReconciliationWorker,
} = require("./services/shiprocketReconciliationService");
const {
  startPublishWorkflowWorker,
} = require('./services/publishWorkflowService');
const {
  adminRouter: adminCMSRouter,
  publicRouter: publicCMSRouter,
} = require('./routes/adminCMSRoutes');

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
// CORS (Production safe – triple-layer)
// ===============================
const allowedOrigins = [
  "https://radeo.in",
  "https://www.radeo.in",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : [])
];

const allowWildcardSubdomains = process.env.CORS_ALLOW_WILDCARD_SUBDOMAINS === 'true';

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
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
    log.warn('Blocked by CORS', { origin });
    return callback(new Error("CORS not allowed"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  maxAge: 86400, // Cache preflight for 24h – reduces OPTIONS traffic
};

// Layer 1: Explicit OPTIONS preflight handler (runs FIRST, before any middleware)
app.options('{*path}', cors(corsOptions));

// Layer 2: CORS middleware on all requests
app.use(cors(corsOptions));

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
app.use(requestId); // Attach unique request ID
app.use(requestContext); // Store in AsyncLocalStorage for log.*
app.use(metricsMiddleware); // Prometheus request metrics
app.use(logger); // HTTP request logging
app.use(
  express.json({
    limit: "10kb", // Default: reject payloads > 10KB
    verify: (req, _res, buf) => {
      if (req.originalUrl.startsWith("/api/webhooks/")) {
        req.rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
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

// Strict rate limiter for auth endpoints (20 requests / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later" },
});

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
app.use("/api/metrics", require("./middleware/auth").authenticate, require("./middleware/admin"), metricsRouter); // Prometheus metrics (admin only)
app.use("/api/v1/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/v1/products", require("./routes/productRoutes"));
app.use("/api/v1/settings", preventCaching, require("./routes/settingsRoutes"));
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
app.use("/api/v1/admin/seo", require("./routes/adminSeoRoutes"));
app.use("/api/v1/admin/analytics", require("./routes/adminAnalyticsRoutes"));
app.use('/api/v1/admin/cms', adminCMSRouter);
app.use('/api/v1/cms', preventCaching, publicCMSRouter);

app.use("/api/v1/analytics", require("./routes/analyticsRoutes"));
app.use("/api/v1/seo", preventCaching, require("./routes/adminSeoRoutes"));

app.use("/api/v1/coupons", require("./routes/couponRoutes"));
app.use("/api/v1/categories", require("./routes/categoryRoutes"));
app.use("/api/v1/addresses", require("./routes/addressRoutes"));
app.use("/api/v1/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/v1/user", require("./routes/userRoutes"));

// ===============================
// Basic root/static probes
// ===============================
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Radeo API is running",
  });
});

app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

// ===============================
// Health Check (deprecated - use /api/health)
// ===============================
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Use /api/health for detailed health check",
  });
});

// ===============================
// 404 Handler (must be after all routes)
// ===============================
app.use(notFoundHandler);

// ===============================
// Global Error Handler (must be last)
// ===============================
app.use(errorHandler);

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
    const server = app.listen(PORT, "0.0.0.0", () => {
      log.success(`Server running on port ${PORT}`);
      log.info("CORS allowed origins", { origins: allowedOrigins });
      startShiprocketReconciliationWorker();
      startPublishWorkflowWorker();

      // Register scheduled cleanup jobs (orphaned media, etc.)
      try {
        const { registerCleanupJobs } = require("./jobs/cleanupJobs");
        registerCleanupJobs();
      } catch (e) {
        log.warn("Cleanup jobs registration failed (node-cron may not be installed)", e.message);
      }
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      log.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          log.info("MongoDB connection closed");
        } catch (e) {
          log.error("Error closing MongoDB", e.message);
        }
        try {
          const { cacheClient, tokenClient } = require("./config/redis");
          if (cacheClient?.isOpen) await cacheClient.disconnect();
          if (tokenClient?.isOpen) await tokenClient.disconnect();
          log.info("Redis connections closed");
        } catch (e) {
          log.error("Error closing Redis", e.message);
        }
        log.info("All connections closed — exiting");
        process.exit(0);
      });
      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        log.error("Graceful shutdown timed out — forcing exit");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (err) {
    log.error("Fatal startup error", err);
    process.exit(1);
  }
}

// ===============================
// GLOBAL ERROR HANDLERS
// ===============================
process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason,
  });
  // Do NOT exit — keep the server running for other requests
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception', { message: error.message, stack: error.stack });
  // For truly fatal errors, exit after logging
  if (error.code !== 'ENOENT') {
    process.exit(1);
  }
  // ENOENT from missing optional files (e.g. google-credentials.json) — keep running
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== "test") {
  startServer();
}

// Export app for testing
module.exports = app;
