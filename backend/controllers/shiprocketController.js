const Order = require("../models/Order");
const shiprocketService = require("../utils/shiprocket");

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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get shipping rates",
      error: error.response?.data || error.message,
    });
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
      selling_price: (item.price / 100).toString(), // Convert from cents to rupees
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
      sub_total: (order.subtotal / 100).toFixed(2), // Convert from cents to rupees
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
      courier_id: courier_id,
      label_url: result.label_url,
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
      message: "Shipment created successfully",
      data: result,
      order: order,
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create shipment",
      error: error.response?.data || error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate label",
      error: error.response?.data || error.message,
    });
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

    if (!order.shipping?.awb_code) {
      return res.status(400).json({
        success: false,
        message: "No AWB code found for this order",
      });
    }

    const trackingData = await shiprocketService.trackByAWB(
      order.shipping.awb_code,
    );

    // Update order with latest tracking info
    if (trackingData.tracking_data) {
      order.shipping.current_status =
        trackingData.tracking_data.shipment_status;
      order.shipping.last_tracking_update = new Date();
      await order.save();
    }

    res.json({
      success: true,
      data: trackingData,
    });
  } catch (error) {
    console.error("Track shipment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to track shipment",
      error: error.response?.data || error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel shipment",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * Get pickup addresses
 * GET /api/admin/shiprocket/pickup-addresses
 */
exports.getPickupAddresses = async (req, res) => {
  try {
    const addresses = await shiprocketService.getPickupAddresses();

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Get pickup addresses error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get pickup addresses",
      error: error.response?.data || error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to schedule pickup",
      error: error.response?.data || error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate manifest",
      error: error.response?.data || error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to mark order as shipped",
    });
  }
};

/**
 * Webhook handler for Shiprocket tracking updates
 * POST /api/shiprocket/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
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
