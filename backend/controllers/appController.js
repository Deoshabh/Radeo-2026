const AppConfig = require("../models/AppConfig");
const AppBanner = require("../models/AppBanner");
const { getOrSetCache, invalidateCache } = require("../utils/cache");
const { log } = require("../utils/logger");

// ──────────────────────────────────────────────
// GET /api/v1/app/config — Public
// ──────────────────────────────────────────────
exports.getAppConfig = async (_req, res) => {
  try {
    const config = await getOrSetCache("app:config", async () => {
      // Upsert: create default doc if none exists
      let doc = await AppConfig.findById("global").lean();
      if (!doc) {
        doc = await AppConfig.create({ _id: "global" });
        doc = doc.toObject();
      }
      return doc;
    }, 300); // Cache 5 minutes

    res.json({ success: true, data: config });
  } catch (error) {
    log.error("getAppConfig error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch app config" });
  }
};

// ──────────────────────────────────────────────
// PUT /api/v1/app/config — Admin only
// ──────────────────────────────────────────────
exports.updateAppConfig = async (req, res) => {
  try {
    const config = await AppConfig.findByIdAndUpdate(
      "global",
      { $set: req.body },
      { new: true, upsert: true, runValidators: true },
    );

    await invalidateCache("app:config");

    res.json({ success: true, data: config });
  } catch (error) {
    log.error("updateAppConfig error:", error);
    res.status(500).json({ success: false, message: "Failed to update app config" });
  }
};

// ──────────────────────────────────────────────
// GET /api/v1/app/banners?platform=app — Public
// ──────────────────────────────────────────────
exports.getAppBanners = async (req, res) => {
  try {
    const platform = req.query.platform || "both";
    const cacheKey = `app:banners:${platform}`;

    const banners = await getOrSetCache(cacheKey, async () => {
      const now = new Date();

      const query = {
        isActive: true,
        platform: { $in: [platform, "both"] },
        $or: [
          { startDate: { $exists: false }, endDate: { $exists: false } },
          { startDate: null, endDate: null },
          { startDate: { $lte: now }, endDate: { $gte: now } },
          { startDate: { $lte: now }, endDate: null },
          { startDate: null, endDate: { $gte: now } },
        ],
      };

      return AppBanner.find(query).sort({ order: 1 }).lean();
    }, 600); // Cache 10 minutes

    res.json({ success: true, data: banners });
  } catch (error) {
    log.error("getAppBanners error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch banners" });
  }
};

// ──────────────────────────────────────────────
// Admin banner CRUD
// ──────────────────────────────────────────────
exports.createBanner = async (req, res) => {
  try {
    const banner = await AppBanner.create(req.body);
    await invalidateCache("app:banners:*");
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    log.error("createBanner error:", error);
    res.status(500).json({ success: false, message: "Failed to create banner" });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const banner = await AppBanner.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

    await invalidateCache("app:banners:*");
    res.json({ success: true, data: banner });
  } catch (error) {
    log.error("updateBanner error:", error);
    res.status(500).json({ success: false, message: "Failed to update banner" });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await AppBanner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });

    await invalidateCache("app:banners:*");
    res.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    log.error("deleteBanner error:", error);
    res.status(500).json({ success: false, message: "Failed to delete banner" });
  }
};
