const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { log } = require("../utils/logger");

// Helper: build consistent cart response
function buildCartResponse(cart) {
  const items = cart.items || [];
  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce((sum, item) => {
      if (item.product && item.product.price) {
        return sum + item.product.price * item.quantity;
      }
      return sum;
    }, 0),
  };
}

// GET /api/v1/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
      "name slug price images sizes isActive discount colors",
    );

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    res.json(buildCartResponse(cart));
  } catch (error) {
    log.error("Error fetching cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};

// POST /api/v1/cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, size, quantity, color } = req.body;

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

    // Validate product existence, status, and stock
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res
        .status(404)
        .json({ message: "Product not found or unavailable" });
    }

    const sizeEntry = product.sizes?.find((s) => s.size === size);
    if (!sizeEntry) {
      return res
        .status(400)
        .json({ message: `Size "${size}" is not available for this product` });
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

    // Check if item already exists with same product, size, and color
    const itemColor = color || "";
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === size &&
        (item.color || "") === itemColor,
    );

    // Check stock against requested quantity
    if (sizeEntry.stock < qty) {
      return res.status(400).json({
        message: `Insufficient stock for size ${size}. Only ${sizeEntry.stock} available.`,
      });
    }

    if (existingItemIndex > -1) {
      // Update quantity (increment)
      const newQuantity = cart.items[existingItemIndex].quantity + qty;
      
      // Check stock again for the new total quantity
      if (sizeEntry.stock < newQuantity) {
        return res.status(400).json({
          message: `Insufficient stock for size ${size}. Only ${sizeEntry.stock} available.`,
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({ product: productId, size, color: itemColor, quantity: qty });
    }

    await cart.save();
    await cart.populate("items.product", "name slug price images sizes isActive discount colors");

    res.json(buildCartResponse(cart));
  } catch (error) {
    log.error("Error adding to cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};

// PUT /api/v1/cart/items
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;

    if (!productId || !size || quantity === undefined) {
      return res.status(400).json({ message: "Product ID, size, and quantity are required" });
    }

    const newQty = parseInt(quantity);
    if (newQty < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove item if quantity is 0
    if (newQty === 0) {
      const decodedSize = decodeURIComponent(size);
      cart.items = cart.items.filter(
        (item) =>
          !(
            item.product.toString() === productId &&
            item.size === decodedSize
          ),
      );
    } else {
      // Update quantity
      const itemIndex = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          item.size === size
      );

      if (itemIndex > -1) {
        // Verify stock before updating
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        const sizeEntry = product.sizes?.find((s) => s.size === size);
        if (!sizeEntry) {
           // Keep existing quantity if size not found (edge case) or remove? 
           // Safest to error out or remove. Let's error for now.
           return res.status(400).json({ message: "Size no longer available" });
        }

        if (sizeEntry.stock < newQty) {
          return res.status(400).json({
            message: `Insufficient stock for size ${size}. Only ${sizeEntry.stock} available.`,
          });
        }

        cart.items[itemIndex].quantity = newQty;
      } else {
        return res.status(404).json({ message: "Item not found in cart" });
      }
    }

    await cart.save();
    await cart.populate("items.product", "name slug price images sizes isActive discount colors");

    res.json(buildCartResponse(cart));
  } catch (error) {
    log.error("Error updating cart quantity:", error);
    res.status(500).json({ message: "Cart update failed" });
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

    // Remove item with matching product, size, and color
    const decodedSize = decodeURIComponent(size);
    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.size === decodedSize
        ),
    );

    await cart.save();
    await cart.populate("items.product", "name slug price images sizes isActive discount colors");

    res.json(buildCartResponse(cart));
  } catch (error) {
    log.error("Error removing from cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};

// DELETE /api/v1/cart
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    } else {
      cart.items = [];
      await cart.save();
    }

    res.json(buildCartResponse(cart));
  } catch (error) {
    log.error("Error clearing cart:", error);
    res.status(500).json({ message: "Cart operation failed" });
  }
};

// GET /api/v1/cart/validate
exports.validateCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.product", "name slug price images sizes isActive discount colors");

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.json({ valid: true, changes: [] });
    }

    const changes = [];
    let isValid = true;

    for (const item of cart.items) {
      // 1. Check if product exists and is active
      if (!item.product || !item.product.isActive) {
        changes.push({
          productId: item.product?._id,
          name: item.product?.name || "Unknown Product",
          message: "Product is no longer available",
          type: "removed"
        });
        isValid = false;
        continue;
      }

      // 2. Check stock
      const sizeEntry = item.product.sizes?.find((s) => s.size === item.size);
      const availableStock = sizeEntry ? sizeEntry.stock : 0;

      if (availableStock < item.quantity) {
        changes.push({
          productId: item.product._id,
          name: item.product.name,
          size: item.size,
          requested: item.quantity,
          available: availableStock,
          message: availableStock === 0 
            ? "Out of stock" 
            : `Only ${availableStock} left`,
          type: "stock_issue"
        });
        isValid = false;
      }
    }

    res.json({ valid: isValid, changes });
  } catch (error) {
    log.error("Error validating cart:", error);
    res.status(500).json({ message: "Validation failed" });
  }
};
