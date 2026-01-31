const express = require("express");
const router = express.Router();
const { getActiveCategories } = require("../controllers/categoryController");

// @route   GET /api/v1/categories
router.get("/", getActiveCategories);

module.exports = router;
