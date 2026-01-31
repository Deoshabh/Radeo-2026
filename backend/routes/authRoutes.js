const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

// Public auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected auth routes
router.get("/me", authenticate, getCurrentUser);
router.post("/change-password", authenticate, changePassword);

module.exports = router;
