const Product = require("../models/Product");

// GET /api/v1/products
exports.getAllProducts = async (req, res) => {
  try {
    const { featured, category } = req.query;

    const query = { isActive: true };

    // Filter by featured if requested
    if (featured === "true") {
      query.featured = true;
    }

    // Filter by category if provided
    if (category) {
      query.category = category.toLowerCase();
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/products/:slug
exports.getProductBySlug = async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
};

// GET /api/v1/products/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct("category", { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
