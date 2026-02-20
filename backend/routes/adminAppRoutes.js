const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  getAppStats,
  getAppAnalytics,
  sendNotification,
  getNotificationHistory,
  getTargetCount,
  searchUsers,
  getCities,
} = require("../controllers/adminAppController");
const {
  updateAppConfig,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/appController");
const AppBanner = require("../models/AppBanner");

// All routes require admin auth
router.use(authenticate, admin);

// Dashboard stats
router.get("/stats", getAppStats);

// Analytics
router.get("/analytics", getAppAnalytics);

// App config (GET is public via appRoutes, PUT is here)
router.put("/config", updateAppConfig);

// Banners CRUD (GET public via appRoutes)
router.get("/banners", async (_req, res) => {
  try {
    const banners = await AppBanner.find().sort({ order: 1 }).lean();
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch banners" });
  }
});
router.post("/banners", createBanner);
router.patch("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);
router.patch("/banners/reorder", async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: "orderedIds array required" });
    }
    const ops = orderedIds.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    }));
    await AppBanner.bulkWrite(ops);
    const { invalidateCache } = require("../utils/cache");
    await invalidateCache("app:banners:*");
    res.json({ success: true, message: "Banners reordered" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to reorder banners" });
  }
});

// Notifications
router.post("/notifications/send", sendNotification);
router.get("/notifications/history", getNotificationHistory);
router.get("/notifications/target-count", getTargetCount);

// User search for targeting
router.get("/users/search", searchUsers);
router.get("/cities", getCities);

module.exports = router;
