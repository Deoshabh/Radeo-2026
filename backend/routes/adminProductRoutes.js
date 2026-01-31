const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus,
  toggleProductFeatured,
  updateProductStatus,
} = require("../controllers/adminProductController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// All routes require authentication and admin role
router.use(authenticate);
router.use(admin);

// @route   GET /api/admin/products
router.get("/", getAllProducts);

// @route   GET /api/admin/products/:id
router.get("/:id", getProductById);

// @route   POST /api/admin/products
router.post("/", createProduct);

// @route   PATCH /api/admin/products/:id
router.patch("/:id", updateProduct);

// @route   PATCH /api/admin/products/:id/toggle
router.patch("/:id/toggle", toggleProductStatus);

// @route   PATCH /api/admin/products/:id/toggle-featured
router.patch("/:id/toggle-featured", toggleProductFeatured);

// @route   PATCH /api/admin/products/:id/status
router.patch("/:id/status", updateProductStatus);

module.exports = router;
