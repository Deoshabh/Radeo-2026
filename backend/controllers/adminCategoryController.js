const Category = require("../models/Category");
const { invalidateCache } = require("../utils/cache");
const { log } = require("../utils/logger");

// @desc    Get all categories
// @route   GET /api/v1/admin/categories
// @access  Private/Admin
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      displayOrder: 1,
      name: 1,
    });
    res.json({ categories });
  } catch (error) {
    log.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create category
// @route   POST /api/v1/admin/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, showInNavbar, displayOrder, image } =
      req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Name and slug are required" });
    }

    // Check for duplicate name
    const existingByName = await Category.findOne({ name });
    if (existingByName) {
      return res
        .status(400)
        .json({ message: "Category with this name already exists" });
    }

    // Auto-resolve slug collision with -2, -3, etc.
    let finalSlug = slug;
    let slugConflict = await Category.findOne({ slug: finalSlug });
    if (slugConflict) {
      let suffix = 2;
      while (slugConflict) {
        finalSlug = `${slug}-${suffix}`;
        slugConflict = await Category.findOne({ slug: finalSlug });
        suffix++;
        if (suffix > 50) break;
      }
    }

    const category = await Category.create({
      name,
      slug: finalSlug,
      description: description || "",
      showInNavbar: showInNavbar !== undefined ? showInNavbar : true,
      displayOrder: displayOrder || 0,
      image: image || null,
    });
    await invalidateCache("categories:*");
    res.status(201).json({ category });
  } catch (error) {
    log.error("Create category error:", error);
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
    await invalidateCache("categories:*");

    res.json({ category });
  } catch (error) {
    log.error("Toggle category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update category
// @route   PATCH /api/v1/admin/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      isActive,
      showInNavbar,
      displayOrder,
      image,
    } = req.body;
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
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (showInNavbar !== undefined) category.showInNavbar = showInNavbar;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (image !== undefined) category.image = image;

    await category.save();
    await invalidateCache("categories:*");
    res.json({ category });
  } catch (error) {
    log.error("Update category error:", error);
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
    await invalidateCache("categories:*");
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    log.error("Delete category error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
