const Cart = require("../models/Cart");

// GET /api/v1/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Always return consistent structure
    const response = {
      items: cart.items || [],
      totalItems: cart.items
        ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
        : 0,
      totalAmount: cart.items
        ? cart.items.reduce((sum, item) => {
            if (item.product && item.product.price) {
              return sum + item.product.price * item.quantity;
            }
            return sum;
          }, 0)
        : 0,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};

// POST /api/v1/cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    // Validate required fields
    if (!productId || !size) {
      return res
        .status(400)
        .json({ message: "Product ID and size are required" });
    }

    const qty = parseInt(quantity) || 1;
    if (qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Safely handle empty cart
    if (!cart.items) {
      cart.items = [];
    }

    // Check if item already exists with same product and size
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity = qty;
    } else {
      // Add new item
      cart.items.push({ product: productId, size, quantity: qty });
    }

    await cart.save();
    await cart.populate("items.product");

    res.json(cart);
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};

// DELETE /api/v1/cart/:productId/:size
exports.removeFromCart = async (req, res) => {
  try {
    const { productId, size } = req.params;

    if (!productId || !size) {
      return res
        .status(400)
        .json({ message: "Product ID and size are required" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Remove item with matching product and size
    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && item.size === size)
    );

    await cart.save();
    await cart.populate("items.product");

    res.json(cart);
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};

// DELETE /api/v1/cart
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      // Create empty cart if doesn't exist
      cart = await Cart.create({ user: req.user.id, items: [] });
    } else {
      cart.items = [];
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};
