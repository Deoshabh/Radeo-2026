const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  getAppConfig,
  updateAppConfig,
  getAppBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/appController");

// ── Public routes ──────────────────────────────
router.get("/config", getAppConfig);
router.get("/banners", getAppBanners);

// ── Admin routes ───────────────────────────────
router.put("/config", authenticate, admin, updateAppConfig);
router.post("/banners", authenticate, admin, createBanner);
router.patch("/banners/:id", authenticate, admin, updateBanner);
router.delete("/banners/:id", authenticate, admin, deleteBanner);

module.exports = router;
