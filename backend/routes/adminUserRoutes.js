const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserBlock,
  createAdmin,
  getUserContact,
  getUserHistory,
} = require("../controllers/adminUserController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// Protect all routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/users
router.get("/", getAllUsers);

// @route   POST /api/v1/admin/users/create-admin
router.post("/create-admin", createAdmin);

// @route   GET /api/v1/admin/users/:id
router.get("/:id", getUserById);

// @route   GET /api/v1/admin/users/:id/contact
router.get("/:id/contact", getUserContact);

// @route   GET /api/v1/admin/users/:id/history
router.get("/:id/history", getUserHistory);

// @route   PATCH /api/v1/admin/users/:id/role
router.patch("/:id/role", updateUserRole);

// @route   PATCH /api/v1/admin/users/:id/toggle-block
router.patch("/:id/toggle-block", toggleUserBlock);

module.exports = router;
