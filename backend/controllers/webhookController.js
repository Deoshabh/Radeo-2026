// ===============================
// Enhanced Shiprocket Webhook Controller
// with Idempotency, Real-time Updates, and Event Queue
// ===============================
const Order = require("../models/Order");
const WebhookLog = require("../models/WebhookLog");
const {
  emitOrderUpdate,
  emitGlobalShipmentUpdate,
} = require("../utils/soketi");

/**
 * Status mapping: Shiprocket status → Order status
 */
const STATUS_MAPPING = {
  "AWB GENERATED": "processing",
  "AWB ASSIGNED": "processing",
  "PICKED UP": "processing",
  "PICKUP SCHEDULED": "processing",
  "IN TRANSIT": "shipped",
  SHIPPED: "shipped",
  "OUT FOR DELIVERY": "shipped",
  DELIVERED: "delivered",
  CANCELED: "cancelled",
  CANCELLED: "cancelled",
  "RTO INITIATED": "cancelled",
  "RTO DELIVERED": "cancelled",
  "RTO IN TRANSIT": "cancelled",
  RTO: "cancelled",
  LOST: "cancelled",
  DAMAGED: "cancelled",
};

/**
 * Lifecycle status mapping: Shiprocket status → Lifecycle status
 */
const LIFECYCLE_MAPPING = {
  "ORDER PLACED": "ready_to_ship",
  "AWB GENERATED": "shipment_created",
  "AWB ASSIGNED": "shipment_created",
  "PICKUP SCHEDULED": "pickup_scheduled",
  "PICKED UP": "picked_up",
  "IN TRANSIT": "in_transit",
  SHIPPED: "in_transit",
  "OUT FOR DELIVERY": "out_for_delivery",
  DELIVERED: "delivered",
  "FAILED DELIVERY": "failed_delivery",
  "RTO INITIATED": "rto_initiated",
  "RTO DELIVERED": "rto_delivered",
  "RTO IN TRANSIT": "rto_initiated",
  RTO: "rto_initiated",
  CANCELED: "cancelled",
  CANCELLED: "cancelled",
};

const mapStatusFromShipmentStatusId = (shipmentStatusId) => {
  const statusId = Number(shipmentStatusId);
  if (!Number.isFinite(statusId)) return null;

  if (statusId === 7) return "delivered";
  if ([2, 3, 4, 5, 6, 17, 18, 19, 20, 21, 22, 42].includes(statusId)) {
    return "shipped";
  }
  if ([8, 9, 10, 11, 12, 13, 14, 15, 16].includes(statusId)) {
    return "cancelled";
  }

  return null;
};

/**
 * Generate unique event ID for idempotency
 * @param {Object} payload - Webhook payload
 * @returns {String} - Unique event identifier
 */
const generateEventId = (payload) => {
  const awb = payload.awb || payload.awb_code;
  const status = payload.current_status || payload.shipment_status;
  const timestamp = payload.timestamp || payload.updated_at || Date.now();

  return `${awb}-${status}-${timestamp}`.replace(/[^a-zA-Z0-9-]/g, "_");
};

/**
 * Process webhook event asynchronously
 * @param {Object} webhookLog - WebhookLog document
 */
const processWebhookAsync = async (webhookLog) => {
  try {
    const payload = webhookLog.payload;

    // Extract data from webhook
    const shiprocketOrderId =
      payload.sr_order_id || payload.order_id || payload.shiprocket_order_id;
    const awbCode = payload.awb || payload.awb_code;
    const currentStatus =
      payload.current_status || payload.shipment_status || payload.status;
    const shipmentStatusId = payload.shipment_status_id;
    const location = payload.location || payload.current_location;
    const scanType = payload.scan_type;
    const description = payload.activities || payload.comment;

    // Find order by Shiprocket order ID or AWB
    let order;
    if (shiprocketOrderId) {
      order = await Order.findOne({
        "shipping.shiprocket_order_id": shiprocketOrderId,
      });
    }
    if (!order && awbCode) {
      order = await Order.findOne({ "shipping.awb_code": awbCode });
    }

    if (!order) {
      webhookLog.status = "failed";
      webhookLog.error = "Order not found";
      webhookLog.processedAt = new Date();
      await webhookLog.save();
      console.log(
        `⚠️ Webhook: Order not found for event ${webhookLog.eventId}`,
      );
      return;
    }

    // Update order shipping status
    const oldStatus = order.shipping.current_status;
    const oldLifecycleStatus = order.shipping.lifecycle_status;
    order.shipping.current_status = currentStatus;
    order.shipping.last_tracking_update = new Date();

    // Update lifecycle status
    const newLifecycleStatus = LIFECYCLE_MAPPING[currentStatus?.toUpperCase()];
    if (newLifecycleStatus) {
      order.shipping.lifecycle_status = newLifecycleStatus;
    }

    // Add to tracking history
    if (!order.shipping.trackingHistory) {
      order.shipping.trackingHistory = [];
    }

    const historyEntry = {
      status: currentStatus,
      timestamp: new Date(payload.timestamp || Date.now()),
      location: location,
      description: description,
      scanType: scanType,
    };

    // Prevent duplicate history entries
    const isDuplicate = order.shipping.trackingHistory.some(
      (entry) =>
        entry.status === currentStatus &&
        Math.abs(new Date(entry.timestamp) - historyEntry.timestamp) < 60000, // Within 1 minute
    );

    if (!isDuplicate) {
      order.shipping.trackingHistory.push(historyEntry);
    }

    // Update order status based on shipment status
    const normalizedStatus = String(currentStatus || "").toUpperCase();
    const derivedFromText =
      STATUS_MAPPING[normalizedStatus] ||
      (normalizedStatus.includes("CANCEL") || normalizedStatus.includes("RTO")
        ? "cancelled"
        : null);
    const newOrderStatus =
      derivedFromText || mapStatusFromShipmentStatusId(shipmentStatusId);
    if (newOrderStatus && newOrderStatus !== order.status) {
      console.log(
        `📦 Order ${order.orderId}: Status ${order.status} → ${newOrderStatus}`,
      );
      order.status = newOrderStatus;
    }

    // Log lifecycle transition
    if (oldLifecycleStatus !== newLifecycleStatus) {
      console.log(
        `🔄 Order ${order.orderId}: Lifecycle ${oldLifecycleStatus} → ${newLifecycleStatus}`,
      );
    }

    // Update estimated delivery date if provided
    if (payload.edd || payload.estimated_delivery_date) {
      order.shipping.estimated_delivery_date =
        payload.edd || payload.estimated_delivery_date;
    }

    // Save order
    await order.save();

    // Emit real-time update via Soketi
    await emitOrderUpdate(order._id.toString(), {
      orderId: order.orderId,
      awbCode: awbCode,
      courierName: order.shipping.courier_name,
      currentStatus: currentStatus,
      location: location,
      trackingHistory: order.shipping.trackingHistory,
      estimatedDelivery: order.shipping.estimated_delivery_date,
      statusChanged: oldStatus !== currentStatus,
    });

    // Emit global update for admin dashboard
    await emitGlobalShipmentUpdate({
      orderId: order.orderId,
      awbCode: awbCode,
      currentStatus: currentStatus,
      customerName: order.shippingAddress.fullName,
    });

    // Update webhook log
    webhookLog.status = "processed";
    webhookLog.orderId = order._id;
    webhookLog.result = `Order ${order.orderId} updated: ${oldStatus} → ${currentStatus}`;
    webhookLog.processedAt = new Date();
    await webhookLog.save();

    console.log(`✅ Webhook processed: ${webhookLog.eventId}`);
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    webhookLog.status = "failed";
    webhookLog.error = error.message;
    webhookLog.processedAt = new Date();
    await webhookLog.save();
  }
};

/**
 * Main webhook handler
 * POST /api/webhooks/shiprocket
 */
exports.handleShiprocketWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const clientIP =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress;

    console.log("📦 Shiprocket webhook received:", {
      awb: payload.awb || payload.awb_code,
      status: payload.current_status || payload.shipment_status,
      ip: clientIP,
    });

    // Generate unique event ID for idempotency
    const eventId = generateEventId(payload);

    // Check if event already processed (idempotency)
    const existingLog = await WebhookLog.findOne({ eventId });
    if (existingLog) {
      console.log(`⚠️ Webhook: Duplicate event ${eventId} (already processed)`);
      // Return 200 to prevent Shiprocket retries
      return res.status(200).json({
        success: true,
        message: "Event already processed",
        eventId: eventId,
        status: existingLog.status,
      });
    }

    // Create webhook log entry
    const webhookLog = new WebhookLog({
      eventId: eventId,
      eventType: payload.current_status || payload.shipment_status || "unknown",
      shiprocketOrderId: payload.sr_order_id || payload.order_id,
      shipmentId: payload.shipment_id,
      awbCode: payload.awb || payload.awb_code,
      payload: payload,
      requestIP: clientIP,
      requestHeaders: {
        "x-shiprocket-signature": req.headers["x-shiprocket-signature"],
        "x-api-key": req.headers["x-api-key"] ? "[REDACTED]" : undefined,
      },
      status: "pending",
    });

    await webhookLog.save();

    // Return 200 OK immediately to prevent retries
    res.status(200).json({
      success: true,
      message: "Webhook received and queued for processing",
      eventId: eventId,
    });

    // Process webhook asynchronously (doesn't block response)
    // In production, use a proper job queue like Bull or BullMQ
    setImmediate(() => processWebhookAsync(webhookLog));
  } catch (error) {
    console.error("❌ Webhook handler error:", error);

    // Still return 200 to prevent Shiprocket retries
    res.status(200).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

/**
 * Get webhook logs (Admin only)
 * GET /api/admin/webhooks/logs
 */
exports.getWebhookLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, orderId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (orderId) filter.orderId = orderId;

    const logs = await WebhookLog.find(filter)
      .populate("orderId", "orderId status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await WebhookLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Get webhook logs error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Retry failed webhook
 * POST /api/admin/webhooks/retry/:logId
 */
exports.retryWebhook = async (req, res) => {
  try {
    const { logId } = req.params;

    const webhookLog = await WebhookLog.findById(logId);
    if (!webhookLog) {
      return res.status(404).json({
        success: false,
        message: "Webhook log not found",
      });
    }

    if (webhookLog.status === "processed") {
      return res.status(400).json({
        success: false,
        message: "Webhook already processed",
      });
    }

    // Reset status and retry
    webhookLog.status = "pending";
    webhookLog.error = null;
    await webhookLog.save();

    await processWebhookAsync(webhookLog);

    res.json({
      success: true,
      message: "Webhook reprocessing initiated",
      data: webhookLog,
    });
  } catch (error) {
    console.error("Retry webhook error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
