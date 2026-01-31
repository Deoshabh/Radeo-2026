const Order = require("../models/Order");
const User = require("../models/User");

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email createdAt")
      .populate("items.product", "name slug category")
      .sort({ createdAt: -1 });

    // Enhance orders with additional user info
    const enhancedOrders = orders.map((order) => ({
      ...order.toObject(),
      userDetails: {
        name: order.user?.name || "Unknown User",
        email: order.user?.email || "N/A",
        joinedDate: order.user?.createdAt,
      },
    }));

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
