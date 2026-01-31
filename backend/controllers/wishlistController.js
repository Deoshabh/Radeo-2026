const Wishlist = require("../models/Wishlist");

// @desc    Get user's wishlist
// @route   GET /api/v1/wishlist
// @access  Private
exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id }).populate(
      "products"
    );

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user.id, products: [] });
    }

    res.json(wishlist);
  } catch (error) {
    console.error("Get wishlist error:", error);
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
    await wishlist.populate("products");
    res.json(wishlist);
  } catch (error) {
    console.error("Toggle wishlist error:", error);
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
    console.error("Clear wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
