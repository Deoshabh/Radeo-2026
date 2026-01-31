const Order = require("../models/Order");

// @desc    Get admin statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    const orders = await Order.find();

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered"
    ).length;

    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const codCount = orders.filter((o) => o.paymentMethod === "cod").length;
    const razorpayCount = orders.filter(
      (o) => o.paymentMethod === "razorpay"
    ).length;

    res.json({
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      paymentSplit: {
        cod: codCount,
        razorpay: razorpayCount,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
