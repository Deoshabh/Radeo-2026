// ===============================
// Webhook Log Model (Idempotency)
// ===============================
const mongoose = require("mongoose");

const webhookLogSchema = new mongoose.Schema(
  {
    // Unique identifier from Shiprocket webhook
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Event type (e.g., 'AWB Generated', 'Delivered')
    eventType: {
      type: String,
      required: true,
    },

    // Shiprocket order/shipment identifiers
    shiprocketOrderId: String,
    shipmentId: String,
    awbCode: String,

    // Related MongoDB order
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },

    // Raw webhook payload
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Processing status
    status: {
      type: String,
      enum: ["pending", "processed", "failed", "duplicate"],
      default: "pending",
    },

    // Processing result/error
    result: String,
    error: String,

    // Retry tracking
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 5,
    },
    nextRetryAt: Date,

    // Request metadata
    requestIP: String,
    requestHeaders: Object,

    // Processing timestamp
    processedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Index for quick duplicate checks
webhookLogSchema.index({ eventId: 1, eventType: 1 });

// Auto-delete old logs after 90 days
webhookLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model("WebhookLog", webhookLogSchema);
