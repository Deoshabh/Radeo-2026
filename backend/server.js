// CRITICAL: Load environment variables FIRST before any other imports
const dotenv = require("dotenv");
dotenv.config();

// Now import everything else (MinIO client reads env vars during import)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { initializeBucket } = require("./utils/minio");

const app = express();

/* =====================
   Database Connection
===================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

/* =====================
   MinIO Initialization
===================== */
// Initialize MinIO bucket at startup (with fallback defaults)
initializeBucket()
  .then(() => console.log("✅ MinIO bucket initialized and ready"))
  .catch((err) => {
    console.error("❌ MinIO initialization failed:", err.message);
    console.warn("⚠️  Image upload features will not work");
    console.warn(
      "⚠️  Please ensure MinIO is running at:",
      process.env.MINIO_ENDPOINT || "localhost:9000",
    );
  });

/* =====================
   Middleware
===================== */
// CORS must be configured BEFORE routes
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN || process.env.CLIENT_URL || "https://radeo.in",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  }),
);

// Handle preflight requests explicitly
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

// Rate limiter (basic protection)
// Increased limits for development - adjust for production
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Increased from 100 to 1000 requests per window
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/* =====================
   Routes
===================== */
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminProductRoutes = require("./routes/adminProductRoutes");
const adminCouponRoutes = require("./routes/adminCouponRoutes");
const couponRoutes = require("./routes/couponRoutes");
const adminStatsRoutes = require("./routes/adminStatsRoutes");
const adminCategoryRoutes = require("./routes/adminCategoryRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminMediaRoutes = require("./routes/adminMediaRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const addressRoutes = require("./routes/addressRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const userRoutes = require("./routes/userRoutes");
const filterRoutes = require("./routes/filterRoutes");
const adminFilterRoutes = require("./routes/adminFilterRoutes");

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/filters", filterRoutes);
app.use("/api/v1/admin/orders", adminOrderRoutes);
app.use("/api/v1/admin/products", adminProductRoutes);
app.use("/api/v1/admin/coupons", adminCouponRoutes);
app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/admin", adminStatsRoutes);
app.use("/api/v1/admin/categories", adminCategoryRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/media", adminMediaRoutes);
app.use("/api/v1/admin/filters", adminFilterRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/user", userRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

/* =====================
   Global Error Handler
===================== */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

/* =====================
   Server Start
===================== */
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0"; // Listen on all interfaces for Traefik

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(
    `📡 CORS enabled for: ${process.env.CORS_ORIGIN || process.env.CLIENT_URL || "https://radeo.in"}`,
  );
});
