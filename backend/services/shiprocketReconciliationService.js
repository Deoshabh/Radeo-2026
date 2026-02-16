const Order = require("../models/Order");
const shiprocketService = require("../utils/shiprocket");
const { log } = require("../utils/logger");

let reconciliationInterval = null;
let isRunning = false;

const ACTIVE_ORDER_STATUSES = ["processing", "shipped"];

const resolveOrderStatusFromShiprocket = (statusValue, shipmentStatusId) => {
  const normalizedStatus = String(statusValue || "").toUpperCase();

  if (
    normalizedStatus.includes("CANCEL") ||
    normalizedStatus.includes("RTO") ||
    normalizedStatus.includes("LOST") ||
    normalizedStatus.includes("DAMAGED")
  ) {
    return "cancelled";
  }

  if (normalizedStatus.includes("DELIVERED")) {
    return "delivered";
  }

  if (
    normalizedStatus.includes("OUT FOR DELIVERY") ||
    normalizedStatus.includes("IN TRANSIT") ||
    normalizedStatus.includes("SHIPPED")
  ) {
    return "shipped";
  }

  if (
    normalizedStatus.includes("PICKED UP") ||
    normalizedStatus.includes("AWB") ||
    normalizedStatus.includes("PICKUP")
  ) {
    return "processing";
  }

  const parsedStatusId = Number(shipmentStatusId);

  if (parsedStatusId === 7) return "delivered";
  if ([2, 3, 4, 5, 6, 17, 18, 19, 20, 21, 22, 42].includes(parsedStatusId)) {
    return "shipped";
  }
  if ([8, 9, 10, 11, 12, 13, 14, 15, 16].includes(parsedStatusId)) {
    return "cancelled";
  }

  return null;
};

const extractTrackingData = (trackingResponse) => {
  if (!trackingResponse) {
    return null;
  }

  if (trackingResponse.tracking_data) {
    return trackingResponse.tracking_data;
  }

  if (Array.isArray(trackingResponse) && trackingResponse[0]?.tracking_data) {
    return trackingResponse[0].tracking_data;
  }

  if (typeof trackingResponse === "object") {
    for (const value of Object.values(trackingResponse)) {
      if (value?.tracking_data) {
        return value.tracking_data;
      }
    }
  }

  return null;
};

const syncOrderWithShiprocket = async (order) => {
  let trackingResponse = null;

  if (order.shipping?.awb_code) {
    trackingResponse = await shiprocketService.trackByAWB(order.shipping.awb_code);
  } else if (order.shipping?.shipment_id) {
    trackingResponse = await shiprocketService.trackByShipmentId(order.shipping.shipment_id);
  } else if (order.shipping?.shiprocket_order_id) {
    trackingResponse = await shiprocketService.trackByOrderId(order.shipping.shiprocket_order_id);
  } else {
    return { updated: false, reason: "missing_tracking_identifiers" };
  }

  const trackingData = extractTrackingData(trackingResponse);
  if (!trackingData) {
    return { updated: false, reason: "missing_tracking_data" };
  }

  const latestStatus =
    trackingData.current_status ||
    trackingData.shipment_track?.[0]?.current_status ||
    trackingData.shipment_status;

  const trackedAwb =
    trackingData.shipment_track?.[0]?.awb_code ||
    trackingData.awb_code ||
    null;

  const mappedOrderStatus = resolveOrderStatusFromShiprocket(
    latestStatus,
    trackingData.shipment_status_id ?? trackingData.shipment_status,
  );

  let hasChanges = false;

  if (latestStatus && latestStatus !== order.shipping?.current_status) {
    order.shipping = {
      ...order.shipping,
      current_status: latestStatus,
    };
    hasChanges = true;
  }

  if (trackedAwb && !order.shipping?.awb_code) {
    order.shipping = {
      ...order.shipping,
      awb_code: trackedAwb,
      trackingId: trackedAwb,
    };
    hasChanges = true;
  }

  if (trackingData.track_url && trackingData.track_url !== order.shipping?.tracking_url) {
    order.shipping = {
      ...order.shipping,
      tracking_url: trackingData.track_url,
    };
    hasChanges = true;
  }

  if (
    trackingData.etd &&
    trackingData.etd !== order.shipping?.estimated_delivery_date
  ) {
    order.shipping = {
      ...order.shipping,
      estimated_delivery_date: trackingData.etd,
    };
    hasChanges = true;
  }

  if (mappedOrderStatus && mappedOrderStatus !== order.status) {
    order.status = mappedOrderStatus;
    hasChanges = true;
  }

  order.shipping = {
    ...order.shipping,
    last_tracking_update: new Date(),
  };

  if (hasChanges) {
    await order.save();
    return { updated: true, status: order.status, shippingStatus: latestStatus };
  }

  return { updated: false, status: order.status, shippingStatus: latestStatus };
};

const reconcileActiveShipments = async () => {
  if (isRunning) {
    return { skipped: true, reason: "already_running" };
  }

  isRunning = true;

  const startedAt = Date.now();
  const summary = {
    scanned: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    const batchSize = Math.max(
      1,
      Number.parseInt(process.env.SHIPROCKET_RECON_BATCH_SIZE || "25", 10),
    );

    const candidates = await Order.find({
      status: { $in: ACTIVE_ORDER_STATUSES },
      $or: [
        { "shipping.awb_code": { $exists: true, $ne: "" } },
        { "shipping.shipment_id": { $exists: true, $ne: null } },
        { "shipping.shiprocket_order_id": { $exists: true, $ne: null } },
      ],
    })
      .sort({ "shipping.last_tracking_update": 1, updatedAt: 1 })
      .limit(batchSize);

    summary.scanned = candidates.length;

    for (const order of candidates) {
      try {
        const result = await syncOrderWithShiprocket(order);

        if (result.updated) {
          summary.updated += 1;
        } else if (result.reason === "missing_tracking_identifiers") {
          summary.skipped += 1;
        }
      } catch (error) {
        summary.failed += 1;
        log.warn("Shiprocket reconciliation failed for order", {
          orderId: order.orderId,
          dbId: order._id.toString(),
          error: error.message,
          code: error.code,
        });
      }
    }

    log.info("Shiprocket reconciliation completed", {
      ...summary,
      durationMs: Date.now() - startedAt,
    });

    return summary;
  } finally {
    isRunning = false;
  }
};

const startShiprocketReconciliationWorker = () => {
  const isEnabled = process.env.SHIPROCKET_RECON_ENABLED !== "false";

  if (!isEnabled) {
    log.info("Shiprocket reconciliation worker disabled", {
      SHIPROCKET_RECON_ENABLED: process.env.SHIPROCKET_RECON_ENABLED,
    });
    return;
  }

  if (reconciliationInterval) {
    return;
  }

  const intervalMs = Math.max(
    60 * 1000,
    Number.parseInt(process.env.SHIPROCKET_RECON_INTERVAL_MS || "600000", 10),
  );

  log.info("Starting Shiprocket reconciliation worker", {
    intervalMs,
    batchSize: Number.parseInt(process.env.SHIPROCKET_RECON_BATCH_SIZE || "25", 10),
  });

  setTimeout(() => {
    reconcileActiveShipments().catch((error) => {
      log.warn("Initial Shiprocket reconciliation failed", {
        error: error.message,
      });
    });
  }, 20 * 1000);

  reconciliationInterval = setInterval(() => {
    reconcileActiveShipments().catch((error) => {
      log.warn("Shiprocket reconciliation tick failed", {
        error: error.message,
      });
    });
  }, intervalMs);
};

const stopShiprocketReconciliationWorker = () => {
  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
    reconciliationInterval = null;
  }
};

module.exports = {
  startShiprocketReconciliationWorker,
  stopShiprocketReconciliationWorker,
  reconcileActiveShipments,
};
