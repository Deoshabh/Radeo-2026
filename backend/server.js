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
const { initializeBucket } = require("./utils/minio");
const { logger, log } = require("./utils/logger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

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
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => log.success("MongoDB connected"))
    .catch((err) => {
      log.error("MongoDB connection error", err);
      process.exit(1);
    });
}

// ===============================
// CORS (Production safe)
// ===============================
const allowedOrigins = ["https://radeo.in", "https://www.radeo.in"];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  }),
);

// ===============================
// Middleware
// ===============================
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
app.use("/api/health", require("./routes/healthRoutes")); // Health checks
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/products", require("./routes/productRoutes"));
app.use("/api/v1/cart", require("./routes/cartRoutes"));
app.use("/api/v1/orders", require("./routes/orderRoutes"));
app.use("/api/v1/filters", require("./routes/filterRoutes"));

// Webhook routes (must be before other middleware that might interfere)
app.use("/api/webhooks", require("./routes/webhookRoutes"));

app.use("/api/v1/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/v1/admin/products", require("./routes/adminProductRoutes"));
app.use("/api/v1/admin/coupons", require("./routes/adminCouponRoutes"));
app.use("/api/v1/admin", require("./routes/adminStatsRoutes"));
app.use("/api/v1/admin/categories", require("./routes/adminCategoryRoutes"));
app.use("/api/v1/admin/users", require("./routes/adminUserRoutes"));
app.use("/api/v1/admin/media", require("./routes/adminMediaRoutes"));
app.use("/api/v1/admin/filters", require("./routes/adminFilterRoutes"));
app.use("/api/v1/admin/shiprocket", require("./routes/shiprocketRoutes"));

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
    // 🔴 CRITICAL: wait for MinIO
    await initializeBucket();
    log.success("MinIO initialized — starting server");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      log.success(`Server running on port ${PORT}`);
      log.info("CORS allowed origins", { origins: allowedOrigins });
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
