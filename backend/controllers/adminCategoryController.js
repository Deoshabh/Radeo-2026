const Category = require("../models/Category");

// @desc    Get all categories
// @route   GET /api/v1/admin/categories
// @access  Private/Admin
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create category
// @route   POST /api/v1/admin/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: "Category name or slug already exists" });
    }

    const category = await Category.create({ name, slug });
    res.status(201).json({ category });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle category status
// @route   PATCH /api/v1/admin/categories/:id/toggle
// @access  Private/Admin
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({ category });
  } catch (error) {
    console.error("Toggle category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update category
// @route   PATCH /api/v1/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check if new name/slug conflicts with another category
    if (name || slug) {
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name: name || category.name }, { slug: slug || category.slug }],
      });

      if (existingCategory) {
        return res
          .status(400)
          .json({ message: "Category name or slug already exists" });
      }
    }

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ category });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/admin/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.deleteOne();
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
