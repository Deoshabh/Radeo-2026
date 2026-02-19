// ===============================
// Razorpay Webhook Controller
// Server-to-server payment confirmation with idempotency
// ===============================
const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const WebhookLog = require("../models/WebhookLog");
const { log } = require("../utils/logger");
const { invalidateCache } = require("../utils/cache");
const { emitOrderUpdate } = require("../utils/soketi");

/**
 * Verify Razorpay webhook signature (HMAC-SHA256)
 */
const verifySignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    log.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex"),
  );
};

/**
 * Handle Razorpay webhook events
 * POST /api/webhooks/razorpay
 *
 * Supported events:
 *   - payment.captured:  Mark order as paid
 *   - payment.failed:    Mark payment as failed, restore stock
 *   - order.paid:        Fallback — same as payment.captured
 *   - refund.processed:  Mark order as refunded
 */
exports.handleRazorpayWebhook = async (req, res) => {
  const startTime = Date.now();
  const signature = req.headers["x-razorpay-signature"];

  // 1. Signature verification
  if (!signature || !verifySignature(req.rawBody, signature)) {
    log.warn("Razorpay webhook: invalid signature", {
      ip: req.ip,
      hasSignature: !!signature,
    });
    return res.status(401).json({ error: "Invalid signature" });
  }

  const payload = req.body;
  const event = payload.event;
  const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity || {};

  // 2. Generate a deterministic event ID for idempotency
  const eventId = `razorpay_${entity.id || payload.event}_${payload.payload?.payment?.entity?.id || payload.payload?.order?.entity?.id || Date.now()}`;

  // 3. Check idempotency — skip if already processed
  const existingLog = await WebhookLog.findOne({ eventId });
  if (existingLog && existingLog.status === "processed") {
    log.info("Razorpay webhook: duplicate event skipped", { eventId });
    return res.status(200).json({ status: "duplicate" });
  }

  // 4. Create or update webhook log
  const webhookLog = existingLog || new WebhookLog({
    eventId,
    eventType: event,
    payload,
    status: "pending",
    requestIP: req.ip,
    requestHeaders: {
      "x-razorpay-signature": signature,
      "content-type": req.headers["content-type"],
    },
  });

  try {
    switch (event) {
      case "payment.captured":
      case "order.paid":
        await handlePaymentCaptured(entity, webhookLog);
        break;

      case "payment.failed":
        await handlePaymentFailed(entity, webhookLog);
        break;

      case "refund.processed":
        await handleRefundProcessed(entity, webhookLog);
        break;

      default:
        webhookLog.status = "processed";
        webhookLog.result = `Unhandled event: ${event}`;
        await webhookLog.save();
        log.info("Razorpay webhook: unhandled event", { event });
    }

    log.info("Razorpay webhook processed", {
      event,
      eventId,
      duration: Date.now() - startTime,
    });

    // Always respond 200 so Razorpay doesn't retry
    return res.status(200).json({ status: "ok" });
  } catch (error) {
    log.error("Razorpay webhook processing error", {
      event,
      eventId,
      error: error.message,
    });

    webhookLog.status = "failed";
    webhookLog.error = error.message;
    await webhookLog.save().catch(() => {});

    // Still respond 200 to prevent Razorpay retry storms
    // The webhook can be manually retried via admin
    return res.status(200).json({ status: "error" });
  }
};

/**
 * payment.captured / order.paid — Confirm payment on order
 */
async function handlePaymentCaptured(entity, webhookLog) {
  const razorpayOrderId = entity.order_id;
  const razorpayPaymentId = entity.id;

  if (!razorpayOrderId) {
    webhookLog.status = "failed";
    webhookLog.error = "Missing order_id in payment entity";
    await webhookLog.save();
    return;
  }

  const order = await Order.findOne({
    "payment.razorpayOrderId": razorpayOrderId,
  });

  if (!order) {
    webhookLog.status = "failed";
    webhookLog.error = `Order not found for razorpayOrderId: ${razorpayOrderId}`;
    await webhookLog.save();
    return;
  }

  webhookLog.orderId = order._id;

  // Already paid — idempotent
  if (order.payment.status === "paid") {
    webhookLog.status = "processed";
    webhookLog.result = "Order already marked as paid";
    await webhookLog.save();
    return;
  }

  // Verify payment amount matches order total (Razorpay sends paise)
  const paidAmountPaise = entity.amount;
  const expectedPaise = Math.round((order.totalAmount || order.total || 0) * 100);
  if (paidAmountPaise && expectedPaise && paidAmountPaise < expectedPaise) {
    webhookLog.status = "failed";
    webhookLog.error = `Payment amount mismatch: paid ${paidAmountPaise} paise, expected ${expectedPaise} paise`;
    await webhookLog.save();
    log.error("Razorpay webhook: amount mismatch", {
      orderId: order.orderId,
      paid: paidAmountPaise,
      expected: expectedPaise,
    });
    return;
  }

  order.payment.status = "paid";
  order.payment.transactionId = razorpayPaymentId;
  order.status = order.status === "pending_payment" ? "confirmed" : order.status;
  await order.save();

  webhookLog.status = "processed";
  webhookLog.result = `Order ${order.orderId} marked as paid`;
  webhookLog.processedAt = new Date();
  await webhookLog.save();

  // Real-time update
  emitOrderUpdate(order._id.toString(), {
    status: order.status,
    paymentStatus: "paid",
  }).catch((err) => log.error("Soketi emit failed (payment.captured)", err));
}

/**
 * payment.failed — Mark payment as failed and restore stock
 */
async function handlePaymentFailed(entity, webhookLog) {
  const razorpayOrderId = entity.order_id;

  if (!razorpayOrderId) {
    webhookLog.status = "failed";
    webhookLog.error = "Missing order_id in payment entity";
    await webhookLog.save();
    return;
  }

  const order = await Order.findOne({
    "payment.razorpayOrderId": razorpayOrderId,
  });

  if (!order) {
    webhookLog.status = "failed";
    webhookLog.error = `Order not found for razorpayOrderId: ${razorpayOrderId}`;
    await webhookLog.save();
    return;
  }

  webhookLog.orderId = order._id;

  // Already failed or paid — idempotent
  if (order.payment.status === "failed" || order.payment.status === "paid") {
    webhookLog.status = "processed";
    webhookLog.result = `Order payment already ${order.payment.status}`;
    await webhookLog.save();
    return;
  }

  // Restore stock for each item
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.items) {
        if (item.product && item.size) {
          await Product.updateOne(
            { _id: item.product, "sizes.size": item.size },
            {
              $inc: {
                "sizes.$.stock": item.quantity,
                stock: item.quantity,
              },
            },
            { session },
          );
        } else if (item.product) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
      }

      order.payment.status = "failed";
      order.status = "cancelled";
      order.cancellation = {
        reason: "Payment failed (webhook)",
        cancelledAt: new Date(),
        cancelledBy: "system",
      };
      await order.save({ session });
    });
  } finally {
    session.endSession();
  }

  await invalidateCache("products:*");

  // Log stock movements (fire-and-forget)
  setImmediate(() => {
    const movements = order.items
      .filter((item) => item.product)
      .map((item) => ({
        product: item.product,
        type: "payment_failed",
        quantity: item.quantity,
        size: item.size || null,
        orderId: order._id,
        orderCode: order.orderId,
        note: "Razorpay payment failed — stock restored",
      }));
    StockMovement.insertMany(movements).catch((err) =>
      log.error("Failed to log stock movements (payment_failed)", err),
    );
  });

  webhookLog.status = "processed";
  webhookLog.result = `Order ${order.orderId} cancelled, stock restored`;
  webhookLog.processedAt = new Date();
  await webhookLog.save();

  // Real-time update
  emitOrderUpdate(order._id.toString(), {
    status: "cancelled",
    paymentStatus: "failed",
  }).catch((err) => log.error("Soketi emit failed (payment.failed)", err));
}

/**
 * refund.processed — Mark order as refunded
 */
async function handleRefundProcessed(entity, webhookLog) {
  const razorpayPaymentId = entity.payment_id;

  const order = await Order.findOne({
    "payment.transactionId": razorpayPaymentId,
  });

  if (!order) {
    webhookLog.status = "failed";
    webhookLog.error = `Order not found for paymentId: ${razorpayPaymentId}`;
    await webhookLog.save();
    return;
  }

  webhookLog.orderId = order._id;

  // Restore stock for each item on refund
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const item of order.items) {
        if (!item.product || !item.quantity) continue;

        if (item.size) {
          await Product.updateOne(
            { _id: item.product, "sizes.size": item.size },
            {
              $inc: {
                "sizes.$.stock": item.quantity,
                stock: item.quantity,
              },
            },
            { session },
          );
        } else {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session },
          );
        }
      }

      order.payment.status = "refunded";
      order.payment.refundId = entity.id;
      order.status = "cancelled";
      await order.save({ session });
    });
  } finally {
    session.endSession();
  }

  await invalidateCache("products:*");

  // Log stock movements (fire-and-forget)
  setImmediate(() => {
    const movements = order.items
      .filter((item) => item.product && item.quantity)
      .map((item) => ({
        product: item.product,
        type: "refund",
        quantity: item.quantity,
        size: item.size || null,
        orderId: order._id,
        orderCode: order.orderId,
        note: "Razorpay refund processed — stock restored",
      }));
    StockMovement.insertMany(movements).catch((err) =>
      log.error("Failed to log stock movements (refund)", err),
    );
  });

  webhookLog.status = "processed";
  webhookLog.result = `Order ${order.orderId} refunded, stock restored`;
  webhookLog.processedAt = new Date();
  await webhookLog.save();

  emitOrderUpdate(order._id.toString(), {
    status: "cancelled",
    paymentStatus: "refunded",
  }).catch((err) => log.error("Soketi emit failed (refund.processed)", err));
}
