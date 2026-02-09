const express = require("express");
const router = express.Router();
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

// Public auth routes with reCAPTCHA protection
router.post(
  "/register",
  verifyRecaptcha("REGISTER", 0.5, true),
  validateRequest(registerSchema),
  register,
);
router.post(
  "/login",
  verifyRecaptcha("LOGIN", 0.5, true),
  validateRequest(loginSchema),
  login,
);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post(
  "/forgot-password",
  verifyRecaptcha("FORGOT_PASSWORD", 0.5, true),
  forgotPassword,
);
router.post("/reset-password", resetPassword);
router.post(
  "/firebase-login",
  verifyRecaptcha("LOGIN", 0.5, true),
  firebaseLogin,
);

// Protected auth routes
router.get("/me", authenticate, getCurrentUser);
router.post("/change-password", authenticate, changePassword);

module.exports = router;
