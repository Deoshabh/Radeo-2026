const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { analyzeOrderRisks } = require("../utils/riskDetection");
const { invalidateCache } = require("../utils/cache");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { status, search, sortBy, order } = req.query;

    const filter = {};

    // Status Filter
    if (status && status !== 'all') {
      filter.status = status; // Exact match for status enum
    }

    // Search Logic (Complex: OrderId OR Shipping Details OR User Details)
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), 'i');
      
      // 1. Find matching users first
      const users = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = users.map(u => u._id);

      // 2. Construct OR query
      filter.$or = [
        { orderId: searchRegex },
        { 'shippingAddress.fullName': searchRegex },
        { 'shippingAddress.phone': searchRegex },
        { 'shipping.awb_code': searchRegex },
        { 'shipping.trackingId': searchRegex },
        { user: { $in: userIds } } // Match orders belonging to found users
      ];
    }

    // Sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Default
    }

    const totalOrders = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("user", "name email createdAt")
      .populate("items.product", "name slug category images")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

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
      totalOrders,
      page,
      totalPages: Math.ceil(totalOrders / limit),
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

    // Restore stock if cancelling
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.items) {
        if (item.product && item.quantity && item.size) {
          await Product.updateOne(
            { _id: item.product, "sizes.size": item.size },
            {
              $inc: {
                "sizes.$.stock": item.quantity,
                stock: item.quantity,
              },
            }
          );
        }
      }
      // Invalidate cache
      await invalidateCache("products:*");
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
    // Admin can no longer edit shipping addresses
    return res.status(403).json({
      success: false,
      message:
        "Address editing has been disabled for admins. Address is view-only.",
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

        if (status === "cancelled" && order.status !== "cancelled") {
          for (const item of order.items) {
            if (item.product && item.quantity && item.size) {
              await Product.updateOne(
                { _id: item.product, "sizes.size": item.size },
                {
                  $inc: {
                    "sizes.$.stock": item.quantity,
                    stock: item.quantity,
                  },
                }
              );
            }
          }
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

    if (status === "cancelled" && results.success.length > 0) {
      await invalidateCache("products:*");
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
