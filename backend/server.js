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

// ===============================
// App init
// ===============================
const app = express();

// ===============================
// Database Connection
// ===============================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ===============================
// MinIO Initialization (non-fatal)
// ===============================
initializeBucket()
  .then(() => console.log("✅ MinIO bucket initialized and ready"))
  .catch((err) => {
    console.error("❌ MinIO initialization failed:", err.message);
    console.warn("⚠️ Image upload features will not work");
  });

// ===============================
// Middleware
// ===============================

// ---- CORS (PRODUCTION SAFE) ----
const allowedOrigins = ["https://radeo.in", "https://www.radeo.in"];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server / curl / health checks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ---- FORCE preflight handling (Traefik-safe) ----
app.options("*", cors());

// ---- Body & Cookies ----
app.use(express.json());
app.use(cookieParser());

// ---- Rate Limiting ----
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
app.use("/api/v1/admin", adminStatsRoutes);
app.use("/api/v1/admin/categories", adminCategoryRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/v1/admin/media", adminMediaRoutes);
app.use("/api/v1/admin/filters", adminFilterRoutes);

app.use("/api/v1/coupons", couponRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/user", userRoutes);

// ===============================
// Health Check (Traefik)
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

// ===============================
// Server Start
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("📡 CORS allowed origins:", allowedOrigins.join(", "));
});
