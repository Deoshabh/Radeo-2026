const User = require("../models/User");
const Notification = require("../models/Notification");
const AppConfig = require("../models/AppConfig");
const AppBanner = require("../models/AppBanner");
const { getOrSetCache, invalidateCache } = require("../utils/cache");
const { log } = require("../utils/logger");

// ──────────────────────────────────────────────
// GET /api/v1/admin/app/stats — Admin dashboard KPIs
// ──────────────────────────────────────────────
exports.getAppStats = async (_req, res) => {
  try {
    const stats = await getOrSetCache("admin:app:stats", async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalAppInstalls,
        iosUsers,
        androidUsers,
        activeToday,
        notifsSentThisMonth,
        totalBanners,
        activeBanners,
      ] = await Promise.all([
        User.countDocuments({ expoPushToken: { $ne: "", $exists: true } }),
        User.countDocuments({ pushTokenPlatform: "ios" }),
        User.countDocuments({ pushTokenPlatform: "android" }),
        User.countDocuments({ updatedAt: { $gte: startOfDay } }),
        Notification.countDocuments({ createdAt: { $gte: startOfMonth } }),
        AppBanner.countDocuments(),
        AppBanner.countDocuments({ isActive: true }),
      ]);

      // Get app config for version info
      let config = await AppConfig.findById("global").lean();
      if (!config) config = {};

      return {
        totalAppInstalls,
        iosUsers,
        androidUsers,
        activeToday,
        notifsSentThisMonth,
        totalBanners,
        activeBanners,
        currentVersion: config.latestAppVersion || "1.0.0",
        minAppVersion: config.minAppVersion || "1.0.0",
        forceUpdate: config.forceUpdate || false,
        maintenanceMode: config.maintenanceMode || false,
      };
    }, 120); // 2 min cache

    res.json({ success: true, data: stats });
  } catch (error) {
    log.error("getAppStats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch app stats" });
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/admin/app/analytics — Installs over time, platform split, etc.
// ──────────────────────────────────────────────
exports.getAppAnalytics = async (req, res) => {
  try {
    const period = req.query.period || "30d";
    const cacheKey = `admin:app:analytics:${period}`;

    const analytics = await getOrSetCache(cacheKey, async () => {
      const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      const since = new Date();
      since.setDate(since.getDate() - days);

      // New users with push tokens (app installs) over time
      const installsByDay = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            expoPushToken: { $ne: "", $exists: true },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } },
      ]);

      // Platform split
      const platformSplit = await User.aggregate([
        { $match: { pushTokenPlatform: { $in: ["ios", "android"] } } },
        { $group: { _id: "$pushTokenPlatform", count: { $sum: 1 } } },
      ]);

      // Notification stats by day
      const notifsByDay = await Notification.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: 1 },
            read: { $sum: { $cond: ["$isRead", 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", total: 1, read: 1, _id: 0 } },
      ]);

      // Notification type breakdown
      const notifsByType = await Notification.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$type", total: { $sum: 1 }, read: { $sum: { $cond: ["$isRead", 1, 0] } } } },
        { $sort: { total: -1 } },
      ]);

      // Recently viewed (screen popularity proxy)
      const screenViews = await User.aggregate([
        { $match: { recentlyViewed: { $exists: true, $ne: [] } } },
        { $unwind: "$recentlyViewed" },
        { $group: { _id: "$recentlyViewed", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 20 },
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
            _id: 0,
            productId: "$_id",
            name: { $ifNull: ["$product.name", "Unknown Product"] },
            views: 1,
          },
        },
      ]);

      return {
        installsByDay,
        platformSplit: platformSplit.map((p) => ({ platform: p._id, count: p.count })),
        notifsByDay,
        notifsByType: notifsByType.map((n) => ({
          type: n._id,
          total: n.total,
          read: n.read,
          openRate: n.total > 0 ? Math.round((n.read / n.total) * 100) : 0,
        })),
        screenViews,
      };
    }, 300); // 5 min cache

    res.json({ success: true, data: analytics });
  } catch (error) {
    log.error("getAppAnalytics error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch app analytics" });
  }
};

// ──────────────────────────────────────────────
// POST /api/v1/admin/app/notifications/send — Send push notification
// ──────────────────────────────────────────────
exports.sendNotification = async (req, res) => {
  try {
    const { title, body, imageUrl, type, data, target } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: "Title and body are required" });
    }

    // Determine target users
    let userQuery = {};
    let targetDescription = "all users";

    switch (target?.type) {
      case "all":
        userQuery = { expoPushToken: { $ne: "", $exists: true } };
        targetDescription = "all app users";
        break;
      case "user":
        if (!target.userId) return res.status(400).json({ success: false, message: "User ID required" });
        userQuery = { _id: target.userId };
        targetDescription = "specific user";
        break;
      case "city":
        if (!target.cities?.length) return res.status(400).json({ success: false, message: "Cities required" });
        userQuery = {
          "addresses.city": { $in: target.cities },
          expoPushToken: { $ne: "", $exists: true },
        };
        targetDescription = `users in ${target.cities.join(", ")}`;
        break;
      case "cart_abandoners":
        // Users with items in cart
        const Cart = require("../models/Cart");
        const cartsWithItems = await Cart.find({ "items.0": { $exists: true } }).select("user").lean();
        const cartUserIds = cartsWithItems.map((c) => c.user);
        userQuery = {
          _id: { $in: cartUserIds },
          expoPushToken: { $ne: "", $exists: true },
        };
        targetDescription = "users with items in cart";
        break;
      case "inactive": {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const Order = require("../models/Order");
        // Users whose last order is > 30 days ago
        const recentOrderUserIds = await Order.distinct("user", { createdAt: { $gte: thirtyDaysAgo } });
        userQuery = {
          _id: { $nin: recentOrderUserIds },
          expoPushToken: { $ne: "", $exists: true },
        };
        targetDescription = "users inactive for 30+ days";
        break;
      }
      default:
        userQuery = { expoPushToken: { $ne: "", $exists: true } };
    }

    // Get target user IDs
    const targetUsers = await User.find(userQuery).select("_id").lean();

    if (targetUsers.length === 0) {
      return res.status(404).json({ success: false, message: "No users match the target criteria" });
    }

    // Create notifications in bulk
    const notifications = targetUsers.map((u) => ({
      user: u._id,
      title,
      body,
      type: type || "promotion",
      data: data || {},
      imageUrl: imageUrl || "",
    }));

    await Notification.insertMany(notifications);

    // Invalidate cache
    await invalidateCache("admin:app:stats");

    res.json({
      success: true,
      message: `Notification sent to ${targetUsers.length} ${targetDescription}`,
      data: { sentTo: targetUsers.length },
    });
  } catch (error) {
    log.error("sendNotification error:", error);
    res.status(500).json({ success: false, message: "Failed to send notification" });
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/admin/app/notifications/history — Sent notifications
// ──────────────────────────────────────────────
exports.getNotificationHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Group by title+body+createdAt (batch sends) to show as single entries
    const pipeline = [
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: { title: "$title", body: "$body", type: "$type" },
          sentAt: { $first: "$createdAt" },
          sentTo: { $sum: 1 },
          readCount: { $sum: { $cond: ["$isRead", 1, 0] } },
          imageUrl: { $first: "$imageUrl" },
        },
      },
      { $sort: { sentAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          title: "$_id.title",
          body: "$_id.body",
          type: "$_id.type",
          sentAt: 1,
          sentTo: 1,
          readCount: 1,
          openRate: {
            $cond: [{ $gt: ["$sentTo", 0] }, { $round: [{ $multiply: [{ $divide: ["$readCount", "$sentTo"] }, 100] }, 1] }, 0],
          },
          imageUrl: 1,
        },
      },
    ];

    const [history, totalAgg] = await Promise.all([
      Notification.aggregate(pipeline),
      Notification.aggregate([
        { $group: { _id: { title: "$title", body: "$body", type: "$type" } } },
        { $count: "total" },
      ]),
    ]);

    const total = totalAgg[0]?.total || 0;

    res.json({
      success: true,
      data: history,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    log.error("getNotificationHistory error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notification history" });
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/admin/app/notifications/target-count — Preview target count
// ──────────────────────────────────────────────
exports.getTargetCount = async (req, res) => {
  try {
    const { type, userId, cities } = req.query;

    let query = {};

    switch (type) {
      case "all":
        query = { expoPushToken: { $ne: "", $exists: true } };
        break;
      case "user":
        query = { _id: userId };
        break;
      case "city":
        query = {
          "addresses.city": { $in: cities ? cities.split(",") : [] },
          expoPushToken: { $ne: "", $exists: true },
        };
        break;
      case "cart_abandoners": {
        const Cart = require("../models/Cart");
        const carts = await Cart.find({ "items.0": { $exists: true } }).select("user").lean();
        query = {
          _id: { $in: carts.map((c) => c.user) },
          expoPushToken: { $ne: "", $exists: true },
        };
        break;
      }
      case "inactive": {
        const ago = new Date();
        ago.setDate(ago.getDate() - 30);
        const Order = require("../models/Order");
        const recent = await Order.distinct("user", { createdAt: { $gte: ago } });
        query = { _id: { $nin: recent }, expoPushToken: { $ne: "", $exists: true } };
        break;
      }
      default:
        query = { expoPushToken: { $ne: "", $exists: true } };
    }

    const count = await User.countDocuments(query);
    res.json({ success: true, data: { count } });
  } catch (error) {
    log.error("getTargetCount error:", error);
    res.status(500).json({ success: false, message: "Failed to get target count" });
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/admin/app/users/search?q= — Search users for targeting
// ──────────────────────────────────────────────
exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q || "";
    if (q.length < 2) return res.json({ success: true, data: [] });

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    })
      .select("name email phone")
      .limit(10)
      .lean();

    res.json({ success: true, data: users });
  } catch (error) {
    log.error("searchUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to search users" });
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/admin/app/cities — Distinct cities from user addresses
// ──────────────────────────────────────────────
exports.getCities = async (_req, res) => {
  try {
    const cities = await getOrSetCache("admin:app:cities", async () => {
      const result = await User.aggregate([
        { $unwind: "$addresses" },
        { $group: { _id: "$addresses.city" } },
        { $match: { _id: { $ne: null, $ne: "" } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, city: "$_id" } },
      ]);
      return result.map((r) => r.city);
    }, 3600); // 1 hour cache

    res.json({ success: true, data: cities });
  } catch (error) {
    log.error("getCities error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch cities" });
  }
};
