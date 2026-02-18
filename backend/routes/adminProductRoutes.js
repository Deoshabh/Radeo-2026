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
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateStatus,
  getStockMovements,
} = require("../controllers/adminProductController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const { validateRequest } = require("../middleware/validateRequest");
const {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
} = require("../validators/schemas");

// All routes require authentication and admin role
router.use(authenticate);
router.use(admin);

// @route   GET /api/admin/products
router.get("/", getAllProducts);

// @route   GET /api/admin/products/:id
router.get("/:id", validateRequest(productIdSchema), getProductById);

// @route   POST /api/admin/products/bulk-delete
router.post("/bulk-delete", bulkDeleteProducts);

// @route   POST /api/admin/products/bulk-status
router.post("/bulk-status", bulkUpdateStatus);

// @route   GET /api/admin/products/stock-movements/:productId
router.get("/stock-movements/:productId", getStockMovements);

// @route   POST /api/admin/products
router.post("/", validateRequest(createProductSchema), createProduct);

// @route   PATCH /api/admin/products/:id
router.patch("/:id", validateRequest(updateProductSchema), updateProduct);

// @route   PATCH /api/admin/products/:id/toggle
router.patch("/:id/toggle", validateRequest(productIdSchema), toggleProductStatus);

// @route   PATCH /api/admin/products/:id/toggle-featured
router.patch("/:id/toggle-featured", validateRequest(productIdSchema), toggleProductFeatured);

// @route   PATCH /api/admin/products/:id/status
router.patch("/:id/status", validateRequest(productIdSchema), updateProductStatus);

// @route   DELETE /api/admin/products/:id
router.delete("/:id", validateRequest(productIdSchema), deleteProduct);

module.exports = router;
