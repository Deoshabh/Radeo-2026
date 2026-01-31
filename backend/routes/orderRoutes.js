const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  createOrder,
  getUserOrders,
  getOrderById,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/orderController");

// Protect all routes
router.use(authenticate);

// POST / → create order
router.post("/", createOrder);

// GET /my → get user orders
router.get("/my", getUserOrders);

// GET /:id → get single order
router.get("/:id", getOrderById);

// POST /:id/razorpay → create Razorpay order
router.post("/:id/razorpay", createRazorpayOrder);

// POST /:id/razorpay/verify → verify Razorpay payment
router.post("/:id/razorpay/verify", verifyRazorpayPayment);

module.exports = router;
