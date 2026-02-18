const Category = require("../models/Category");
const { getOrSetCache } = require("../utils/cache");
const { log } = require("../utils/logger");

// @desc    Get active categories
// @route   GET /api/v1/categories
// @access  Public
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await getOrSetCache(
      "categories:active",
      () => Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).lean(),
      3600, // 1 hour
    );
    res.json({ categories });
  } catch (error) {
    log.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get navbar categories (only those marked to show in navbar)
// @route   GET /api/v1/categories/navbar
// @access  Public
exports.getNavbarCategories = async (req, res) => {
  try {
    const categories = await getOrSetCache(
      "categories:navbar",
      () =>
        Category.find({ isActive: true, showInNavbar: true })
          .sort({ displayOrder: 1, name: 1 })
          .lean(),
      3600, // 1 hour
    );
    res.json({ categories });
  } catch (error) {
    log.error("Get navbar categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get category by slug
// @route   GET /api/v1/categories/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await getOrSetCache(
      `categories:slug:${req.params.slug}`,
      () => Category.findOne({ slug: req.params.slug, isActive: true }).lean(),
      1800, // 30 minutes
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ category });
  } catch (error) {
    log.error("Get category by slug error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
