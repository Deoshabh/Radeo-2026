const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const mongoose = require("mongoose");
const redis = require("../config/redis");
const shiprocketService = require("../utils/shiprocket");
const { getStorageHealth } = require("../utils/minio");
const { log } = require("../utils/logger");
const { getOrSetCache } = require("../utils/cache");

// @desc    Get admin statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  try {
    const stats = await getOrSetCache('admin:stats', async () => {
    const now = new Date();

    // Current month boundaries
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // Run all aggregations and counts in parallel
    const [
      statusAgg,
      revenueAgg,
      paymentAgg,
      topProductsAgg,
      last7DaysAgg,
      monthlyAgg,
      categoryAgg,
      recentOrders,
      totalProducts,
      activeProducts,
      inactiveProducts,
      outOfStockProducts,
      totalUsers,
      totalAdmins,
    ] = await Promise.all([
      // 1. Order counts by status
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // 2. Revenue aggregation (delivered + pending)
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "delivered"] },
                  { $ifNull: ["$total", { $ifNull: ["$subtotal", 0] }] },
                  0,
                ],
              },
            },
            pendingRevenue: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["pending", "confirmed", "shipped"]] },
                  { $ifNull: ["$total", { $ifNull: ["$subtotal", 0] }] },
                  0,
                ],
              },
            },
          },
        },
      ]),

      // 3. Payment method split
      Order.aggregate([
        {
          $group: {
            _id: { $cond: [{ $eq: ["$payment.method", "cod"] }, "cod", "online"] },
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "delivered"] },
                  { $ifNull: ["$total", 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),

      // 4. Top selling products (delivered orders)
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            quantity: { $sum: { $ifNull: ["$items.quantity", 0] } },
            revenue: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$items.price", 0] },
                  { $ifNull: ["$items.quantity", 0] },
                ],
              },
            },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: "$_id",
            name: { $ifNull: ["$product.name", "Unknown Product"] },
            image: { $arrayElemAt: [{ $ifNull: ["$product.images", []] }, 0] },
            quantity: 1,
            revenue: 1,
          },
        },
      ]),

      // 5. Sales trend (last 7 days)
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "delivered"] },
                  { $ifNull: ["$total", 0] },
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 6. Monthly sales trend (last 12 months)
      Order.aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            orders: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "delivered"] },
                  { $ifNull: ["$total", 0] },
                  0,
                ],
              },
            },
            delivered: {
              $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
            },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // 7. Category-wise sales (delivered orders)
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        { $match: { "productInfo.category": { $exists: true } } },
        {
          $group: {
            _id: "$productInfo.category",
            quantity: { $sum: { $ifNull: ["$items.quantity", 0] } },
            revenue: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$items.price", 0] },
                  { $ifNull: ["$items.quantity", 0] },
                ],
              },
            },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            category: "$_id",
            quantity: 1,
            revenue: 1,
            _id: 0,
          },
        },
      ]),

      // 8. Recent orders (last 10)
      Order.find()
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .select("orderId shippingAddress total status payment createdAt")
        .lean(),

      // 9-12. Product counts
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Product.countDocuments({ stock: 0 }),

      // 13-14. User counts
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "admin" }),
    ]);

    // Process status aggregation into a lookup
    const statusMap = {};
    for (const s of statusAgg) statusMap[s._id] = s.count;
    const totalOrders = Object.values(statusMap).reduce((a, b) => a + b, 0);

    // Process revenue
    const rev = revenueAgg[0] || { totalRevenue: 0, pendingRevenue: 0 };

    // Process payment split
    const payMap = {};
    for (const p of paymentAgg) payMap[p._id] = p;
    const cod = payMap.cod || { count: 0, revenue: 0 };
    const online = payMap.online || { count: 0, revenue: 0 };

    // Fill in last 7 days (some days may have no orders)
    const dayMap = new Map(last7DaysAgg.map((d) => [d._id, d]));
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const entry = dayMap.get(key);
      last7Days.push({
        date: key,
        orders: entry?.orders || 0,
        revenue: entry?.revenue || 0,
      });
    }

    // Fill in last 12 months
    const monthMap = new Map(
      monthlyAgg.map((m) => [`${m._id.year}-${m._id.month}`, m]),
    );
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const entry = monthMap.get(key);
      last12Months.push({
        month: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        orders: entry?.orders || 0,
        revenue: entry?.revenue || 0,
        delivered: entry?.delivered || 0,
        cancelled: entry?.cancelled || 0,
      });
    }

    // Current month vs previous month (from monthly agg)
    const curKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const prevKey = `${previousMonthStart.getFullYear()}-${previousMonthStart.getMonth() + 1}`;
    const curMonth = monthMap.get(curKey) || { orders: 0, revenue: 0, delivered: 0 };
    const prevMonth = monthMap.get(prevKey) || { orders: 0, revenue: 0, delivered: 0 };

    const revenueGrowth =
      prevMonth.revenue > 0
        ? ((curMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
        : 0;
    const ordersGrowth =
      prevMonth.orders > 0
        ? ((curMonth.orders - prevMonth.orders) / prevMonth.orders) * 100
        : 0;

    // Format recent orders
    const formattedRecentOrders = recentOrders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      customerName: order.user?.name || order.shippingAddress?.name,
      total: order.total,
      status: order.status,
      paymentMethod: order.payment?.method,
      createdAt: order.createdAt,
    }));

    return {
      orders: {
        total: totalOrders,
        pending: statusMap.pending || 0,
        confirmed: statusMap.confirmed || 0,
        shipped: statusMap.shipped || 0,
        delivered: statusMap.delivered || 0,
        cancelled: statusMap.cancelled || 0,
      },
      revenue: {
        total: rev.totalRevenue,
        pending: rev.pendingRevenue,
        cod: cod.revenue,
        online: online.revenue,
      },
      paymentSplit: {
        cod: { count: cod.count, revenue: cod.revenue },
        online: { count: online.count, revenue: online.revenue },
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts,
        outOfStock: outOfStockProducts,
      },
      users: {
        customers: totalUsers,
        admins: totalAdmins,
      },
      recentOrders: formattedRecentOrders,
      topProducts: topProductsAgg,
      salesTrend: last7Days,
      monthlySalesTrend: last12Months,
      topCategories: categoryAgg,
      currentMonth: {
        orders: curMonth.orders,
        revenue: curMonth.revenue,
        delivered: curMonth.delivered,
      },
      previousMonth: {
        orders: prevMonth.orders,
        revenue: prevMonth.revenue,
        delivered: prevMonth.delivered,
      },
      growth: {
        revenue: revenueGrowth.toFixed(2),
        orders: ordersGrowth.toFixed(2),
      },
    };
    }, 120);

    res.json(stats);
  } catch (error) {
    log.error("Get admin stats error:", error);
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
