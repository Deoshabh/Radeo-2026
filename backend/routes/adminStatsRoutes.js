const express = require("express");
const router = express.Router();
const {
	getAdminStats,
	getDependenciesHealth,
} = require("../controllers/adminStatsController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// Protect all routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/stats
router.get("/stats", getAdminStats);

// @route   GET /api/v1/admin/health/deps
router.get("/health/deps", getDependenciesHealth);

module.exports = router;
