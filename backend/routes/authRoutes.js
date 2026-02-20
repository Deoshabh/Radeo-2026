const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validateRequest");
const { verifyTurnstile } = require("../middleware/turnstile");
const { registerSchema, loginSchema } = require("../validators/schemas");

const {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  firebaseLogin,
  verifyToken,
} = require("../controllers/authController");

// Strict rate limiter for auth routes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { message: "Too many attempts, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slightly relaxed limiter for refresh & firebase login
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public auth routes
router.post(
  "/register",
  authLimiter,
  verifyTurnstile("register", { optional: true }),
  validateRequest(registerSchema),
  register,
);
router.post(
  "/login",
  authLimiter,
  verifyTurnstile("login", { optional: true }),
  validateRequest(loginSchema),
  login,
);
router.post("/refresh", tokenLimiter, refresh);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  authLimiter,
  verifyTurnstile("forgot_password", { optional: true }),
  forgotPassword,
);
router.post("/reset-password", authLimiter, resetPassword);
router.post(
  "/firebase-login",
  tokenLimiter,
  verifyTurnstile("login", { optional: true }),
  firebaseLogin,
);

// Verify Firebase token (for app session validation)
router.post("/verify-token", tokenLimiter, verifyToken);

// Protected auth routes
router.get("/me", authenticate, getCurrentUser);
router.post("/change-password", authenticate, changePassword);
router.delete("/logout-all", authenticate, logoutAll);

module.exports = router;
