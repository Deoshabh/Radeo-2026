const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth");
const { validateRequest } = require("../middleware/validateRequest");
const { verifyRecaptcha } = require("../middleware/recaptcha");
const { registerSchema, loginSchema } = require("../validators/schemas");

const {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
  firebaseLogin,
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
// TODO: Re-enable reCAPTCHA protection once credentials are configured
// router.post("/register", verifyRecaptcha("REGISTER", 0.5, true), validateRequest(registerSchema), register);
// router.post("/login", verifyRecaptcha("LOGIN", 0.5, true), validateRequest(loginSchema), login);
// router.post("/forgot-password", verifyRecaptcha("FORGOT_PASSWORD", 0.5, true), forgotPassword);
// router.post("/firebase-login", verifyRecaptcha("LOGIN", 0.5, true), firebaseLogin);

router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  register,
);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.post("/refresh", tokenLimiter, refresh);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/firebase-login", tokenLimiter, firebaseLogin);

// Protected auth routes
router.get("/me", authenticate, getCurrentUser);
router.post("/change-password", authenticate, changePassword);

module.exports = router;
