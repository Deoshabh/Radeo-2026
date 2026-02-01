const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} = require("../controllers/adminCategoryController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// Protect all routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/categories
router.get("/", getAllCategories);

// @route   POST /api/v1/admin/categories
router.post("/", createCategory);

// @route   PATCH /api/v1/admin/categories/:id
router.patch("/:id", updateCategory);

// @route   DELETE /api/v1/admin/categories/:id
router.delete("/:id", deleteCategory);

// @route   PATCH /api/v1/admin/categories/:id/toggle
router.patch("/:id/toggle", toggleCategoryStatus);

module.exports = router;
