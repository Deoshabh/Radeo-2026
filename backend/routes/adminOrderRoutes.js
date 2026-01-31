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
} = require("../controllers/adminOrderController");

// Protect all routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// GET / → get all orders
router.get("/", getAllOrders);

// GET /user/:userId → get all orders for a specific user
router.get("/user/:userId", getUserOrders);

// GET /:id → get single order
router.get("/:id", getOrderById);

// PATCH /:id → update order status
router.patch("/:id", updateOrderStatus);

// PATCH /:id/shipping → update shipping info
router.patch("/:id/shipping", updateShippingInfo);

module.exports = router;
