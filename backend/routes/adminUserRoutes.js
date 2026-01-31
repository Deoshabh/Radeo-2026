const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  toggleUserBlock,
} = require("../controllers/adminUserController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// Protect all routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/users
router.get("/", getAllUsers);

// @route   PATCH /api/v1/admin/users/:id/toggle-block
router.patch("/:id/toggle-block", toggleUserBlock);

module.exports = router;
