const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const mongoose = require("mongoose");
const redis = require("../config/redis");
const shiprocketService = require("../utils/shiprocket");
const { getStorageHealth } = require("../utils/minio");

// @desc    Get admin statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    // Get order stats
    const orders = await Order.find()
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const confirmedOrders = orders.filter(
      (o) => o.status === "confirmed",
    ).length;
    const shippedOrders = orders.filter((o) => o.status === "shipped").length;
    const deliveredOrders = orders.filter(
      (o) => o.status === "delivered",
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === "cancelled",
    ).length;

    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (order.total || order.subtotal || 0), 0);

    const pendingRevenue = orders
      .filter((o) => ["pending", "confirmed", "shipped"].includes(o.status))
      .reduce((sum, order) => sum + (order.total || order.subtotal || 0), 0);

    // Payment method stats
    const codOrders = orders.filter((o) => o.payment?.method === "cod");
    const onlineOrders = orders.filter((o) => o.payment?.method !== "cod");

    const codRevenue = codOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const onlineRevenue = onlineOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Get product stats
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Get user stats
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Recent orders (last 10)
    const recentOrders = orders.slice(0, 10).map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      customerName: order.user?.name || order.shippingAddress?.name,
      total: order.total,
      status: order.status,
      paymentMethod: order.payment?.method,
      createdAt: order.createdAt,
    }));

    // Top selling products
    const productSales = {};
    orders.forEach((order) => {
      if (order.status === "delivered" && order.items) {
        order.items.forEach((item) => {
          const productId = item.product?._id?.toString() || item.product;
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = {
                productId,
                name: item.product?.name || "Unknown Product",
                image: item.product?.images?.[0] || null,
                quantity: 0,
                revenue: 0,
              };
            }
            productSales[productId].quantity += item.quantity || 0;
            productSales[productId].revenue +=
              (item.price || 0) * (item.quantity || 0);
          }
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Sales trend (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });

      const dayRevenue = dayOrders
        .filter((o) => o.status === "delivered")
        .reduce((sum, order) => sum + (order.total || 0), 0);

      last7Days.push({
        date: date.toISOString().split("T")[0],
        orders: dayOrders.length,
        revenue: dayRevenue,
      });
    }

    // Sales trend (last 12 months)
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);

      const nextMonth = new Date(date);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= date && orderDate < nextMonth;
      });

      const monthRevenue = monthOrders
        .filter((o) => o.status === "delivered")
        .reduce((sum, order) => sum + (order.total || 0), 0);

      last12Months.push({
        month: date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        orders: monthOrders.length,
        revenue: monthRevenue,
        delivered: monthOrders.filter((o) => o.status === "delivered").length,
        cancelled: monthOrders.filter((o) => o.status === "cancelled").length,
      });
    }

    // Current month stats
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= currentMonthStart;
    });

    const currentMonthRevenue = currentMonthOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Previous month stats for comparison
    const previousMonthStart = new Date();
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    previousMonthStart.setDate(1);
    previousMonthStart.setHours(0, 0, 0, 0);

    const previousMonthEnd = new Date(currentMonthStart);

    const previousMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= previousMonthStart && orderDate < previousMonthEnd;
    });

    const previousMonthRevenue = previousMonthOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, order) => sum + (order.total || 0), 0);

    // Calculate growth
    const revenueGrowth =
      previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
          100
        : 0;

    const ordersGrowth =
      previousMonthOrders.length > 0
        ? ((currentMonthOrders.length - previousMonthOrders.length) /
            previousMonthOrders.length) *
          100
        : 0;

    // Category-wise sales
    const categorySales = {};
    orders.forEach((order) => {
      if (order.status === "delivered" && order.items) {
        order.items.forEach((item) => {
          if (item.product?.category) {
            const category = item.product.category;
            if (!categorySales[category]) {
              categorySales[category] = {
                category,
                quantity: 0,
                revenue: 0,
              };
            }
            categorySales[category].quantity += item.quantity || 0;
            categorySales[category].revenue +=
              (item.price || 0) * (item.quantity || 0);
          }
        });
      }
    });

    const topCategories = Object.values(categorySales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      // Order stats
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      // Revenue stats
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        cod: codRevenue,
        online: onlineRevenue,
      },
      // Payment split
      paymentSplit: {
        cod: {
          count: codOrders.length,
          revenue: codRevenue,
        },
        online: {
          count: onlineOrders.length,
          revenue: onlineRevenue,
        },
      },
      // Product stats
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        outOfStock: outOfStockProducts,
      },
      // User stats
      users: {
        customers: totalUsers,
        admins: totalAdmins,
      },
      // Recent orders
      recentOrders,
      // Top products
      topProducts,
      // Sales trend
      salesTrend: last7Days,
      monthlySalesTrend: last12Months,
      // Category sales
      topCategories,
      // Current month comparison
      currentMonth: {
        orders: currentMonthOrders.length,
        revenue: currentMonthRevenue,
        delivered: currentMonthOrders.filter((o) => o.status === "delivered")
          .length,
      },
      previousMonth: {
        orders: previousMonthOrders.length,
        revenue: previousMonthRevenue,
        delivered: previousMonthOrders.filter((o) => o.status === "delivered")
          .length,
      },
      growth: {
        revenue: revenueGrowth.toFixed(2),
        orders: ordersGrowth.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get admin dependencies health
// @route   GET /api/v1/admin/health/deps
// @access  Private/Admin
exports.getDependenciesHealth = async (_req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: { status: "checking" },
      redis: { status: "checking" },
      storage: { status: "checking" },
      shiprocket: { status: "checking" },
    },
  };

  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      health.dependencies.mongodb.status = "operational";
    } else {
      health.dependencies.mongodb.status = "disconnected";
      health.status = "DEGRADED";
    }
  } catch (error) {
    health.dependencies.mongodb = {
      status: "error",
      message: error.message,
    };
    health.status = "DEGRADED";
  }

  try {
    if (redis.status === "ready" || redis.status === "connect") {
      await redis.ping();
      health.dependencies.redis = {
        status: "operational",
        connection: redis.status,
      };
    } else {
      health.dependencies.redis = {
        status: "disconnected",
        connection: redis.status,
      };
      health.status = "DEGRADED";
    }
  } catch (error) {
    health.dependencies.redis = {
      status: "error",
      connection: redis.status,
      message: error.message,
    };
    health.status = "DEGRADED";
  }

  try {
    const storageHealth = await getStorageHealth();
    health.dependencies.storage = storageHealth;
    if (storageHealth.status !== "operational") {
      health.status = "DEGRADED";
    }
  } catch (error) {
    health.dependencies.storage = {
      status: "error",
      message: error.message,
    };
    health.status = "DEGRADED";
  }

  try {
    const shiprocketHealth = await shiprocketService.checkHealth();
    health.dependencies.shiprocket = {
      status: "operational",
      configured: shiprocketHealth.configured,
      authenticated: shiprocketHealth.authenticated,
      tokenExpiry: shiprocketHealth.tokenExpiry,
    };
  } catch (error) {
    health.dependencies.shiprocket = {
      status: "error",
      code: error.code,
      message: error.message,
    };
    health.status = "DEGRADED";
  }

  const statusCode = health.status === "OK" ? 200 : 503;
  return res.status(statusCode).json(health);
};
