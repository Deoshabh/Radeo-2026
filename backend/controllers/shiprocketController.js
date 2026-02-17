const Order = require("../models/Order");
const shiprocketService = require("../utils/shiprocket");
const {
  reconcileActiveShipments,
} = require("../services/shiprocketReconciliationService");

const sendShiprocketError = (res, error, fallbackMessage) => {
  const statusCode = error.statusCode || error.response?.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || fallbackMessage,
    error: error.details || error.response?.data || error.message,
    code: error.code,
  });
};

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

  // Fallback for numeric shipment status IDs when status text is missing
  if (shipmentStatusId === 7) return "delivered";
  if ([2, 3, 4, 5, 6, 17, 18, 19, 20, 21, 22, 42].includes(Number(shipmentStatusId))) {
    return "shipped";
  }
  if ([8, 9, 10, 11, 12, 13, 14, 15, 16].includes(Number(shipmentStatusId))) {
    return "cancelled";
  }

  return null;
};

const toShiprocketRupees = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  // Some historical records are stored in paise/cents (x100), while newer ones are in rupees.
  // Convert only when value strongly looks like paise/cents.
  if (Number.isInteger(value) && value >= 10000 && value % 100 === 0) {
    return value / 100;
  }

  return value;
};

/**
 * Get shipping rates for an order
 * POST /api/admin/shiprocket/rates
 */
exports.getShippingRates = async (req, res) => {
  try {
    const { pickup_postcode, delivery_postcode, weight, cod, declared_value } =
      req.body;

    if (!pickup_postcode || !delivery_postcode) {
      return res.status(400).json({
        success: false,
        message: "Pickup and delivery postcodes are required",
      });
    }

    const rates = await shiprocketService.getShippingRates({
      pickup_postcode,
      delivery_postcode,
      weight: weight || 0.5,
      cod: cod || 0,
      declared_value: declared_value || 0,
    });

    res.json({
      success: true,
      data: rates,
    });
  } catch (error) {
    console.error("Get shipping rates error:", error);
    return sendShiprocketError(res, error, "Failed to get shipping rates");
  }
};

/**
 * Create shipment for an order
 * POST /api/admin/shiprocket/create-shipment/:orderId
 */
exports.createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { courier_id, pickup_location, weight, dimensions } = req.body;

    // Find the order
    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if shipment already created
    if (order.shipping?.shiprocket_order_id) {
      return res.status(400).json({
        success: false,
        message: "Shipment already created for this order",
        shiprocket_order_id: order.shipping.shiprocket_order_id,
      });
    }

    // Prepare order items for Shiprocket
    const orderItems = order.items.map((item) => ({
      name: item.name,
      sku: item.product?.toString() || "SKU",
      units: item.quantity,
      selling_price: toShiprocketRupees(item.price).toFixed(2),
      discount: "",
      tax: "",
      hsn: "",
    }));

    // Prepare order data for Shiprocket
    const orderData = {
      order_id: order.orderId,
      order_date: order.createdAt.toISOString().split("T")[0],
      pickup_location: pickup_location || "Primary",
      billing_customer_name: order.shippingAddress.fullName.split(" ")[0],
      billing_last_name:
        order.shippingAddress.fullName.split(" ").slice(1).join(" ") || "",
      billing_address: order.shippingAddress.addressLine1,
      billing_address_2: order.shippingAddress.addressLine2 || "",
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.postalCode,
      billing_state: order.shippingAddress.state,
      billing_country: order.shippingAddress.country || "India",
      billing_email: order.user?.email || "noreply@radeo.in",
      billing_phone: order.shippingAddress.phone,
      order_items: orderItems,
      payment_method: order.payment.method === "cod" ? "COD" : "Prepaid",
      sub_total: toShiprocketRupees(order.subtotal).toFixed(2),
      length: dimensions?.length || 10,
      breadth: dimensions?.breadth || 10,
      height: dimensions?.height || 10,
      weight: weight || 0.5,
    };

    // Create complete shipment (order + AWB + pickup + label)
    const result = await shiprocketService.createCompleteShipment(
      orderData,
      courier_id,
    );

    // Update order with Shiprocket details
    order.shipping = {
      ...order.shipping,
      shiprocket_order_id: result.shiprocket_order_id,
      shipment_id: result.shipment_id,
      awb_code: result.awb_code,
      courier_name: result.courier_name,
      courier_id: result.courier_id || courier_id,
      label_url: result.label_url,
      invoice_url: result.invoice_url,
      trackingId: result.awb_code,
      courier: result.courier_name,
    };

    // Update status to processing
    if (order.status === "confirmed") {
      order.status = "processing";
    }

    await order.save();

    res.json({
      success: true,
      message:
        result.warnings?.length > 0
          ? "Shipment created with warnings"
          : "Shipment created successfully",
      data: result,
      order: order,
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    return sendShiprocketError(res, error, "Failed to create shipment");
  }
};

/**
 * Generate shipping label
 * POST /api/admin/shiprocket/label/:orderId
 */
exports.generateLabel = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipping?.shipment_id) {
      return res.status(400).json({
        success: false,
        message: "No shipment found for this order. Create shipment first.",
      });
    }

    const result = await shiprocketService.generateLabel([
      order.shipping.shipment_id,
    ]);

    // Update order with label URL
    order.shipping.label_url = result.label_url;
    await order.save();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Generate label error:", error);
    return sendShiprocketError(res, error, "Failed to generate label");
  }
};

/**
 * Track shipment
 * GET /api/admin/shiprocket/track/:orderId
 */
exports.trackShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipping?.awb_code && !order.shipping?.shipment_id) {
      return res.status(400).json({
        success: false,
        message: "No AWB code or shipment ID found for this order",
      });
    }

    const trackingData = order.shipping?.awb_code
      ? await shiprocketService.trackByAWB(order.shipping.awb_code)
      : await shiprocketService.trackByShipmentId(order.shipping.shipment_id);

    // Update order with latest tracking info
    if (trackingData.tracking_data) {
      const latestStatus =
        trackingData.tracking_data.current_status ||
        trackingData.tracking_data.shipment_track?.[0]?.current_status ||
        trackingData.tracking_data.shipment_status;

      order.shipping.current_status = latestStatus;

      const trackedAwb =
        trackingData.tracking_data.shipment_track?.[0]?.awb_code ||
        trackingData.tracking_data.awb_code;
      if (trackedAwb && !order.shipping.awb_code) {
        order.shipping.awb_code = trackedAwb;
      }

      const mappedOrderStatus = resolveOrderStatusFromShiprocket(
        latestStatus,
        trackingData.tracking_data.shipment_status,
      );
      if (mappedOrderStatus && mappedOrderStatus !== order.status) {
        order.status = mappedOrderStatus;
      }

      order.shipping.last_tracking_update = new Date();
      await order.save();
    }

    res.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    console.error("Track shipment error:", error);
    return sendShiprocketError(res, error, "Failed to track shipment");
  }
};

/**
 * Cancel shipment
 * POST /api/admin/shiprocket/cancel/:orderId
 */
exports.cancelShipment = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipping?.awb_code) {
      return res.status(400).json({
        success: false,
        message: "No AWB code found for this order",
      });
    }

    const result = await shiprocketService.cancelShipment([
      order.shipping.awb_code,
    ]);

    // Update order status
    order.status = "cancelled";
    order.shipping.current_status = "Cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Shipment cancelled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Cancel shipment error:", error);
    return sendShiprocketError(res, error, "Failed to cancel shipment");
  }
};

/**
 * Shiprocket health check
 * GET /api/admin/shiprocket/health
 */
exports.getShiprocketHealth = async (req, res) => {
  try {
    const health = await shiprocketService.checkHealth();

    res.json({
      success: true,
      message: "Shiprocket is configured and reachable",
      data: health,
    });
  } catch (error) {
    console.error("Shiprocket health check error:", error);
    return sendShiprocketError(res, error, "Shiprocket health check failed");
  }
};

/**
 * Trigger Shiprocket reconciliation manually
 * POST /api/admin/shiprocket/reconcile
 */
exports.triggerShiprocketReconciliation = async (_req, res) => {
  try {
    const summary = await reconcileActiveShipments();

    return res.json({
      success: true,
      message: "Shiprocket reconciliation completed",
      data: summary,
    });
  } catch (error) {
    console.error("Trigger Shiprocket reconciliation error:", error);
    return sendShiprocketError(
      res,
      error,
      "Failed to run Shiprocket reconciliation",
    );
  }
};

/**
 * Get pickup addresses
 * GET /api/admin/shiprocket/pickup-addresses
 */
exports.getPickupAddresses = async (req, res) => {
  try {
    const addresses = await shiprocketService.getPickupAddresses();

    const rawAddresses =
      addresses?.data?.shipping_address ||
      addresses?.shipping_address ||
      addresses?.data?.pickup_addresses ||
      addresses?.pickup_addresses ||
      [];

    const pickupAddresses = (Array.isArray(rawAddresses) ? rawAddresses : [])
      .map((address) => ({
        ...address,
        pickup_location:
          address?.pickup_location ||
          address?.address_name ||
          address?.address_nickname ||
          address?.nickname ||
          "Primary",
        pin_code:
          address?.pin_code ||
          address?.pincode ||
          address?.postal_code ||
          address?.postcode ||
          "",
      }))
      .filter((address) => Boolean(address.pin_code));

    res.json({
      success: true,
      data: {
        pickup_addresses: pickupAddresses,
        raw: addresses,
      },
    });
  } catch (error) {
    console.error("Get pickup addresses error:", error);
    return sendShiprocketError(res, error, "Failed to get pickup addresses");
  }
};

/**
 * Schedule pickup
 * POST /api/admin/shiprocket/schedule-pickup/:orderId
 */
exports.schedulePickup = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { pickup_date } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipping?.shipment_id) {
      return res.status(400).json({
        success: false,
        message: "No shipment found for this order",
      });
    }

    const result = await shiprocketService.schedulePickup(
      order.shipping.shipment_id,
      pickup_date,
    );

    // Update order with pickup date
    order.shipping.pickup_scheduled_date =
      pickup_date || result.pickup_scheduled_date;
    await order.save();

    res.json({
      success: true,
      message: "Pickup scheduled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Schedule pickup error:", error);
    return sendShiprocketError(res, error, "Failed to schedule pickup");
  }
};

/**
 * Generate manifest
 * POST /api/admin/shiprocket/manifest/:orderId
 */
exports.generateManifest = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipping?.shipment_id) {
      return res.status(400).json({
        success: false,
        message: "No shipment found for this order",
      });
    }

    // Generate manifest
    await shiprocketService.generateManifest([order.shipping.shipment_id]);

    // Print manifest to get URL
    const result = await shiprocketService.printManifest([
      order.shipping.shiprocket_order_id,
    ]);

    // Update order with manifest URL
    order.shipping.manifest_url = result.manifest_url;
    await order.save();

    res.json({
      success: true,
      message: "Manifest generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Generate manifest error:", error);
    return sendShiprocketError(res, error, "Failed to generate manifest");
  }
};

/**
 * Generate invoice
 * POST /api/admin/shiprocket/invoice/:orderId
 */
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipping?.shiprocket_order_id) {
      return res.status(400).json({
        success: false,
        message: "No Shiprocket order found for this order",
      });
    }

    const result = await shiprocketService.generateInvoice([
      order.shipping.shiprocket_order_id,
    ]);

    const invoiceUrl =
      result?.invoice_url ||
      result?.data?.invoice_url ||
      result?.response?.invoice_url ||
      null;

    if (invoiceUrl) {
      order.shipping.invoice_url = invoiceUrl;
      await order.save();
    }

    res.json({
      success: true,
      message: "Invoice generated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Generate invoice error:", error);
    return sendShiprocketError(res, error, "Failed to generate invoice");
  }
};

/**
 * Mark order as shipped
 * POST /api/admin/shiprocket/mark-shipped/:orderId
 */
exports.markAsShipped = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.shipping?.awb_code) {
      return res.status(400).json({
        success: false,
        message: "No AWB code found. Create shipment first.",
      });
    }

    order.status = "shipped";
    await order.save();

    res.json({
      success: true,
      message: "Order marked as shipped",
      order,
    });
  } catch (error) {
    console.error("Mark as shipped error:", error);
    return sendShiprocketError(res, error, "Failed to mark order as shipped");
  }
};

/**
 * Webhook handler for Shiprocket tracking updates
 * POST /api/shiprocket/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Verify webhook security token (if configured)
    if (process.env.SHIPROCKET_WEBHOOK_SECRET) {
      const receivedToken = req.headers["x-api-key"];
      if (receivedToken !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
        console.log("⚠️ Webhook unauthorized: Invalid security token");
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid security token",
        });
      }
    }

    const webhookData = req.body;

    console.log("📦 Shiprocket webhook received:", webhookData);

    // Extract order ID from webhook data
    const shiprocketOrderId = webhookData.sr_order_id || webhookData.order_id;
    const awbCode = webhookData.awb;
    const currentStatus =
      webhookData.current_status || webhookData.shipment_status;

    if (!shiprocketOrderId && !awbCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook data",
      });
    }

    // Find order by Shiprocket order ID or AWB
    let order;
    if (shiprocketOrderId) {
      order = await Order.findOne({
        "shipping.shiprocket_order_id": shiprocketOrderId,
      });
    } else if (awbCode) {
      order = await Order.findOne({ "shipping.awb_code": awbCode });
    }

    if (!order) {
      console.log("⚠️ Order not found for webhook data");
      return res
        .status(200)
        .json({ success: true, message: "Order not found" });
    }

    // Update shipping status
    order.shipping.current_status = currentStatus;
    order.shipping.last_tracking_update = new Date();

    // Update order status based on shipment status
    const statusMapping = {
      DELIVERED: "delivered",
      "OUT FOR DELIVERY": "shipped",
      "IN TRANSIT": "shipped",
      "PICKED UP": "processing",
      CANCELLED: "cancelled",
      RTO: "cancelled",
    };

    const newStatus = statusMapping[currentStatus?.toUpperCase()];
    if (newStatus && newStatus !== order.status) {
      order.status = newStatus;
    }

    await order.save();

    console.log(`✅ Order ${order.orderId} updated with webhook data`);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    // Always return 200 to avoid webhook retries
    res.status(200).json({
      success: false,
      message: error.message,
    });
  }
};
