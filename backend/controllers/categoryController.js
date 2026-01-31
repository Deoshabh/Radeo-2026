const Category = require("../models/Category");

// @desc    Get active categories
// @route   GET /api/v1/categories
// @access  Public
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({
      name: 1,
    });
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
