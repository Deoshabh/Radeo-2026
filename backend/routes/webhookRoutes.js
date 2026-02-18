// ===============================
// Webhook Routes
// ===============================
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  verifyShiprocketIP,
  verifyShiprocketSignature,
} = require("../middleware/shiprocketWebhookSecurity");
const {
  handleShiprocketWebhook,
  getWebhookLogs,
  retryWebhook,
} = require("../controllers/webhookController");
const {
  handleRazorpayWebhook,
} = require("../controllers/razorpayWebhookController");

/**
 * PUBLIC WEBHOOK ENDPOINTS
 * No authentication required (called by external servers)
 */

// POST /api/webhooks/shiprocket
// Protected by IP whitelist and signature verification
router.post(
  "/shiprocket",
  verifyShiprocketIP,
  verifyShiprocketSignature,
  handleShiprocketWebhook,
);

// POST /api/webhooks/razorpay
// Protected by HMAC signature verification (x-razorpay-signature header)
router.post("/razorpay", handleRazorpayWebhook);

/**
 * ADMIN ENDPOINTS
 * Require authentication and admin privileges
 */
router.use(authenticate);
router.use(admin);

// GET /api/webhooks/logs - Get webhook logs
router.get("/logs", getWebhookLogs);

// POST /api/webhooks/retry/:logId - Retry failed webhook
router.post("/retry/:logId", retryWebhook);

module.exports = router;
