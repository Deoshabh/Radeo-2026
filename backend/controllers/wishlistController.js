const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const { log } = require("../utils/logger");

// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate(
      "products",
      "name slug price images isActive discount averageRating numReviews",
    ).lean();

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    res.json(wishlist);
  } catch (error) {
    log.error("Get wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/v1/wishlist/toggle
// @access  Private
exports.toggleWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        products: [productId],
      });
    } else {
      const index = wishlist.products.indexOf(productId);
      if (index > -1) {
        // Remove from wishlist
        wishlist.products.splice(index, 1);
      } else {
        // Add to wishlist
        wishlist.products.push(productId);
      }
      await wishlist.save();
    }

    // Populate and return
    await wishlist.populate("products", "name slug price images isActive discount averageRating numReviews");
    res.json(wishlist);
  } catch (error) {
    log.error("Toggle wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/v1/wishlist
// @access  Private
exports.clearWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.json({ message: "Wishlist already empty" });
    }

    wishlist.products = [];
    await wishlist.save();

    res.json({ message: "Wishlist cleared" });
  } catch (error) {
    log.error("Clear wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get product recommendations based on wishlist categories
// @route   GET /api/v1/wishlist/recommendations
// @access  Private
exports.getWishlistRecommendations = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate(
      "products",
      "category",
    );

    if (!wishlist || wishlist.products.length === 0) {
      return res.json({ success: true, recommendations: [] });
    }

    const wishlistProductIds = wishlist.products.map((p) => p._id);
    const categories = [
      ...new Set(wishlist.products.map((p) => p.category).filter(Boolean)),
    ];

    const recommendations = await Product.find({
      _id: { $nin: wishlistProductIds },
      category: { $in: categories },
      isActive: true,
    })
      .sort({ averageRating: -1, numReviews: -1 })
      .limit(8)
      .select("name price images category averageRating numReviews slug")
      .lean();

    res.json({ success: true, recommendations });
  } catch (error) {
    log.error("Wishlist recommendations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
