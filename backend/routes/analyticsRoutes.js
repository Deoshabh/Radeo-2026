const express = require("express");
const router = express.Router();
const { trackEvent, trackEvents } = require("../controllers/analyticsController");
const { optionalAuth } = require("../middleware/auth");

// Public tracking endpoints — optionalAuth to attach userId if logged in
router.post("/event", optionalAuth, trackEvent);
router.post("/events", optionalAuth, trackEvents);

module.exports = router;
