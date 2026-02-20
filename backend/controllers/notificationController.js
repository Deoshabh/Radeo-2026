const Notification = require("../models/Notification");
const { log } = require("../utils/logger");

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// ──────────────────────────────────────────────
// GET /api/v1/user/notifications
// ──────────────────────────────────────────────
exports.getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE));
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ user: req.user.id }),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    log.error("getNotifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/user/notifications/unread-count
// ──────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    log.error("getUnreadCount error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch unread count" });
  }
};

// ──────────────────────────────────────────────
// PATCH /api/v1/user/notifications/:id/read
// ──────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    log.error("markAsRead error:", error);
    res.status(500).json({ success: false, message: "Failed to mark notification as read" });
  }
};

// ──────────────────────────────────────────────
// PATCH /api/v1/user/notifications/read-all
// ──────────────────────────────────────────────
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true },
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    log.error("markAllAsRead error:", error);
    res.status(500).json({ success: false, message: "Failed to mark notifications as read" });
  }
};

// ──────────────────────────────────────────────
// Helper: create a notification (called by other services)
// ──────────────────────────────────────────────
exports.createNotification = async ({ userId, title, body, type = "system", data = {}, imageUrl = "" }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      body,
      type,
      data,
      imageUrl,
    });
    return notification;
  } catch (error) {
    log.error("createNotification error:", error);
    return null;
  }
};
