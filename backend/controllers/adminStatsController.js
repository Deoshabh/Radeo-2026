const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// @desc    Get admin statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    // Get order stats
    const orders = await Order.find();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered",
    ).length;

    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (order.total || order.subtotal || 0), 0);

    const codCount = orders.filter((o) => o.paymentMethod === "cod").length;
    const razorpayCount = orders.filter(
      (o) => o.paymentMethod === "razorpay",
    ).length;

    // Get product stats
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });

    // Get user stats
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    res.json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      paymentSplit: {
        cod: codCount,
        razorpay: razorpayCount,
      },
      totalProducts,
      activeProducts,
      inactiveProducts,
      totalUsers,
      totalAdmins,
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
