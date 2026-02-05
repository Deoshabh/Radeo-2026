const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateShippingInfo,
  getUserOrders,
  updateShippingAddress,
  bulkUpdateStatus,
  bulkCreateShipments,
  bulkPrintLabels,
} = require("../controllers/adminOrderController");

// Protect all routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// GET / → get all orders
router.get("/", getAllOrders);

// Bulk operations
router.post("/bulk/status", bulkUpdateStatus);
router.post("/bulk/create-shipments", bulkCreateShipments);
router.post("/bulk/print-labels", bulkPrintLabels);

// GET /user/:userId → get all orders for a specific user
router.get("/user/:userId", getUserOrders);

// GET /:id → get single order
router.get("/:id", getOrderById);

// PATCH /:id → update order status
router.patch("/:id", updateOrderStatus);

// PUT /:id/shipping-address → update shipping address
router.put("/:id/shipping-address", updateShippingAddress);

// PATCH /:id/shipping → update shipping info
router.patch("/:id/shipping", updateShippingInfo);

module.exports = router;
