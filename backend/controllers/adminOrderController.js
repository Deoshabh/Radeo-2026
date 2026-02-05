const Order = require("../models/Order");
const User = require("../models/User");
const { analyzeOrderRisks } = require("../utils/riskDetection");
const shiprocketService = require("../services/shiprocketService");

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email createdAt")
      .populate("items.product", "name slug category")
      .sort({ createdAt: -1 });

    // Enhance orders with additional user info and risk analysis
    const enhancedOrders = orders.map((order) => {
      const riskAnalysis = analyzeOrderRisks(order);

      return {
        ...order.toObject(),
        userDetails: {
          name: order.user?.name || "Unknown User",
          email: order.user?.email || "N/A",
          joinedDate: order.user?.createdAt,
        },
        riskAnalysis,
        // Age calculation (in hours)
        ageInHours: Math.floor(
          (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60),
        ),
      };
    });

    res.json({
      success: true,
      count: orders.length,
      orders: enhancedOrders,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Valid status values
    const validStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Define valid status transitions
    const validTransitions = {
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    // Check if transition is valid
    const allowedNextStatuses = validTransitions[order.status];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    // Update status
    order.status = status;
    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Get user details
    const user = await User.findById(userId).select("name email createdAt");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all orders for this user
    const orders = await Order.find({ user: userId })
      .populate("items.product", "name slug category images")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        joinedDate: user.createdAt,
      },
      orderCount: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateShippingInfo = async (req, res) => {
  try {
    const { courier, trackingId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update shipping info
    if (!order.shipping) {
      order.shipping = {};
    }

    if (courier !== undefined) {
      order.shipping.courier = courier;
    }

    if (trackingId !== undefined) {
      order.shipping.trackingId = trackingId;
    }

    await order.save();

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Update shipping info error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update shipping address
 * PUT /api/v1/admin/orders/:id/shipping-address
 */
exports.updateShippingAddress = async (req, res) => {
  try {
    const { shippingAddress } = req.body;

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Don't allow address change if shipment already created
    if (order.shipping?.shipment_id) {
      return res.status(400).json({
        message: "Cannot update address after shipment creation",
      });
    }

    // Update address
    order.shippingAddress = {
      ...order.shippingAddress,
      ...shippingAddress,
    };

    await order.save();

    res.json({
      success: true,
      message: "Shipping address updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update shipping address error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Bulk update order statuses
 * POST /api/v1/admin/orders/bulk/status
 */
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "Order IDs array is required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const validStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Define valid status transitions (same as updateOrderStatus)
    const validTransitions = {
      confirmed: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    };

    const results = {
      success: [],
      failed: [],
    };

    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId);

        if (!order) {
          results.failed.push({
            orderId,
            reason: "Order not found",
          });
          continue;
        }

        // Check if transition is valid
        const allowedNextStatuses = validTransitions[order.status] || [];
        if (!allowedNextStatuses.includes(status)) {
          results.failed.push({
            orderId,
            reason: `Cannot transition from ${order.status} to ${status}`,
          });
          continue;
        }

        order.status = status;
        await order.save();

        results.success.push(orderId);
      } catch (error) {
        results.failed.push({
          orderId,
          reason: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.success.length} orders successfully`,
      results,
    });
  } catch (error) {
    console.error("Bulk update status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Bulk create shipments
 * POST /api/v1/admin/orders/bulk/create-shipments
 */
exports.bulkCreateShipments = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "Order IDs array is required" });
    }

    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId);

        if (!order) {
          results.failed.push({
            orderId,
            reason: "Order not found",
          });
          continue;
        }

        // Skip if shipment already created
        if (order.shipping?.shipment_id) {
          results.skipped.push({
            orderId,
            reason: "Shipment already exists",
          });
          continue;
        }

        // Check for risk factors
        const riskAnalysis = analyzeOrderRisks(order);
        if (riskAnalysis.highSeverityCount > 0) {
          results.failed.push({
            orderId,
            reason: "High-risk order - manual review required",
            risks: riskAnalysis.risks,
          });
          continue;
        }

        // Attempt shipment creation
        // This would be handled by the dedicated shipment endpoint
        // For bulk operations, we just mark as ready
        if (!order.shipping) {
          order.shipping = {};
        }
        order.shipping.lifecycle_status = "ready_to_ship";
        order.shipping.shipment_creation_attempted = false;
        await order.save();

        results.success.push({
          orderId,
          message: "Marked ready for shipment creation",
        });
      } catch (error) {
        results.failed.push({
          orderId,
          reason: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${orderIds.length} orders`,
      results,
    });
  } catch (error) {
    console.error("Bulk create shipments error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Bulk print labels
 * POST /api/v1/admin/orders/bulk/print-labels
 */
exports.bulkPrintLabels = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: "Order IDs array is required" });
    }

    const labelUrls = [];
    const failed = [];

    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId);

        if (!order) {
          failed.push({ orderId, reason: "Order not found" });
          continue;
        }

        if (!order.shipping?.shipment_id) {
          failed.push({ orderId, reason: "No shipment created" });
          continue;
        }

        if (!order.shipping?.label_url) {
          failed.push({ orderId, reason: "Label not generated" });
          continue;
        }

        labelUrls.push({
          orderId: order._id,
          orderNumber: order.orderId,
          labelUrl: order.shipping.label_url,
        });
      } catch (error) {
        failed.push({ orderId, reason: error.message });
      }
    }

    res.json({
      success: true,
      labels: labelUrls,
      failed,
    });
  } catch (error) {
    console.error("Bulk print labels error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
