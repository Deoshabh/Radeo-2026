const express = require("express");
const router = express.Router();
const { getSummary, getFunnel } = require("../controllers/analyticsController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(authenticate);
router.use(admin);

// GET /api/v1/admin/analytics/summary?period=7d
router.get("/summary", getSummary);

// GET /api/v1/admin/analytics/funnel?period=7d
router.get("/funnel", getFunnel);

module.exports = router;
