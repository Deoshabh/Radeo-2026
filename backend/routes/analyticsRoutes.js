const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { trackEvent, trackEvents } = require("../controllers/analyticsController");
const { optionalAuth } = require("../middleware/auth");

const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: "Too many analytics requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public tracking endpoints — optionalAuth to attach userId if logged in
router.post("/event", analyticsLimiter, optionalAuth, trackEvent);
router.post("/events", analyticsLimiter, optionalAuth, trackEvents);

module.exports = router;
