const express = require("express");
const router = express.Router();
const { getFilters } = require("../controllers/filterController");

// Public routes
router.get("/", getFilters);

module.exports = router;
