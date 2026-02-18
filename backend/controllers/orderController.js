const mongoose = require("mongoose");
const Order = require("../models/Order");
const { invalidateCache } = require("../utils/cache");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const StockMovement = require("../models/StockMovement");
const Wishlist = require("../models/Wishlist");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { log } = require("../utils/logger");
const { cacheClient } = require("../config/redis");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    // Validate shipping address
    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    const requiredFields = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
    ];

    for (const field of requiredFields) {
      if (!shippingAddress[field] || shippingAddress[field].trim() === "") {
        return res.status(400).json({
          message: `${field} is required in shipping address`,
          field: field,
        });
      }
    }

    // Fetch cart for the user
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product",
    );

    // Check if cart exists and has items
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Validate product availability and per-size stock
    // Re-fetch products fresh from DB (cart.populate snapshot may be stale)
    const productIds = cart.items.map((item) => item.product._id);
    const freshProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(freshProducts.map((p) => [p._id.toString(), p]));

    const outOfStockItems = [];
    for (const item of cart.items) {
      const product = productMap.get(item.product._id.toString());
      if (!product) {
        return res.status(400).json({
          message:
            "A product in your cart no longer exists. Please update your cart.",
        });
      }
      if (!product.isActive) {
        outOfStockItems.push({ name: product.name, reason: "unavailable" });
        continue;
      }
      if (product.isOutOfStock) {
        outOfStockItems.push({ name: product.name, reason: "out_of_stock" });
        continue;
      }

      // Check per-size stock minus active reservations
      const sizeEntry = product.sizes?.find((s) => s.size === item.size);
      const dbStock = sizeEntry ? sizeEntry.stock : product.stock;

      // Check Valkey for existing reservations on this item
      const reservationKey = `reserve:${product._id}:${item.size || "default"}`;
      let reserved = 0;
      try {
        const val = await cacheClient.get(reservationKey);
        if (val) reserved = parseInt(val, 10) || 0;
      } catch { /* Valkey down â€” skip reservation check */ }

      const availableStock = (dbStock || 0) - reserved;
      if (availableStock < item.quantity) {
        outOfStockItems.push({
          name: product.name,
          size: item.size,
          reason: "insufficient_stock",
          available: Math.max(0, availableStock),
          requested: item.quantity,
        });
      }
    }

    if (outOfStockItems.length > 0) {
      return res.status(409).json({
        message: `Stock unavailable for: ${outOfStockItems.map((i) => i.name).join(", ")}`,
        outOfStockItems,
      });
    }

    // Reserve stock in Valkey (15-minute TTL)
    const reservationKeys = [];
    try {
      for (const item of cart.items) {
        const key = `reserve:${item.product._id}:${item.size || "default"}`;
        await cacheClient.incrby(key, item.quantity);
        await cacheClient.expire(key, 900); // 15 minutes
        reservationKeys.push({ key, quantity: item.quantity });
      }
    } catch {
      // Valkey down â€” proceed without reservation (transaction will still guard)
    }

    // Calculate subtotal and create items snapshot
    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      // Safe currency addition
      const CurrencyUtils = require('../utils/currencyUtils');
      const itemTotal = item.product.price * item.quantity;
      subtotal = CurrencyUtils.add(subtotal, itemTotal);

      // Get primary image URL from images array
      const primaryImage =
        item.product.images?.find((img) => img.isPrimary)?.url ||
        item.product.images?.[0]?.url ||
        null;

      return {
        product: item.product._id,
        name: item.product.name,
        image: primaryImage,
        size: item.size,
        color: item.color || "",
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    // Apply coupon if provided
    let discount = 0;
    let couponData = null;

    if (couponCode) {
      const couponService = require('../services/couponService');
      const validation = await couponService.validateCoupon(couponCode, subtotal, req.user.id, cart.items);

      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      discount = validation.discount;
      couponData = validation.coupon;
    }

    // Calculate shipping cost (server-side, mirrors frontend logic)
    const shippingCost = subtotal > 1000 ? 0 : 50;
    
    // Total = Subtotal + Shipping - Discount
    const CurrencyUtils = require('../utils/currencyUtils');
    let total = CurrencyUtils.add(subtotal, shippingCost);
    total = CurrencyUtils.subtract(total, discount);

    // === Transactional order creation ===
    const session = await mongoose.startSession();
    let order;

    try {
      await session.withTransaction(async () => {
        // 1. Decrement stock for each item atomically
        for (const item of cart.items) {
          const result = await Product.updateOne(
            {
              _id: item.product._id,
              "sizes.size": item.size,
              "sizes.stock": { $gte: item.quantity },
            },
            {
              $inc: {
                "sizes.$.stock": -item.quantity,
                stock: -item.quantity,
              },
            },
            { session },
          );

          if (result.modifiedCount === 0) {
            throw new Error(
              `Insufficient stock for "${item.product.name}" (size ${item.size}). Please update your cart.`,
            );
          }
        }

        // 2. Increment coupon usage if applicable
        if (couponData && couponCode) {
           // We use the service/model logic here but need session support. 
           // Since service method might not support session, we'll keep the direct DB update here for transactional safety
           // OR update service to accept session. 
           // For now, let's keep the direct update to ensure session passing, but use the clean logic.
           
           // Ideally: await couponService.incrementUsage(couponData._id, session);
           // Let's stick to the direct invalidation for now to avoid modifying service too much for session propagation 
           // unless we update service method.
           
           const couponUpdateResult = await require("../models/Coupon").updateOne(
            { 
              _id: couponData._id,
              $or: [
                { usageLimit: null },
                { usageLimit: 0 }, // 0 or null usually means unlimited
                { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
              ]
            },
            { $inc: { usedCount: 1 } },
            { session }
          );

          if (couponUpdateResult.modifiedCount === 0) {
             throw new Error("Coupon usage limit reached or coupon invalid");
          }
        }

        // 3. Create order
        const [createdOrder] = await Order.create(
          [
            {
              orderId: generateOrderId(),
              user: req.user.id,
              items: orderItems,
              subtotal,
              discount,
              shippingCost,
              total,
              totalAmount: total,
              coupon: couponData,
              shippingAddress: {
                fullName: shippingAddress.fullName.trim(),
                phone: shippingAddress.phone
                  .trim()
                  .replace(/[\s\-()]/g, "")
                  .replace(/^(\+?91|0)/, ""),
                addressLine1: shippingAddress.addressLine1.trim(),
                addressLine2: shippingAddress.addressLine2?.trim() || "",
                city: shippingAddress.city.trim(),
                state: shippingAddress.state.trim(),
                postalCode: shippingAddress.postalCode.trim(),
                country: shippingAddress.country || "India",
              },
              payment: {
                method: paymentMethod || "cod",
                status: "pending",
              },
              status: "confirmed",
              fulfillmentType: "made_to_order",
            },
          ],
          { session },
        );

        order = createdOrder;

        // 4. Clear cart
        cart.items = [];
        await cart.save({ session });
      });
    } finally {
      session.endSession();
    }

    // Release Valkey stock reservations (stock already decremented in DB)
    for (const { key, quantity } of reservationKeys) {
      try { await cacheClient.decrby(key, quantity); } catch { /* Valkey down â€” ignore */ }
    }

    // Invalidate product cache
    await invalidateCache("products:*");

    // Emit Real-time Event to Admin Dashboard
    const { emitAdminOrderCreated } = require("../utils/soketi");
    // Fire and forget - don't await/block response
    emitAdminOrderCreated(order).catch(err => log.error("Socket emit failed", err));

    // Log stock movements (fire-and-forget)
    setImmediate(() => {
      const movements = order.items.map((item) => ({
        product: item.product,
        type: "sale",
        quantity: -item.quantity,
        size: item.size || null,
        orderId: order._id,
        orderCode: order.orderId,
        performedBy: req.user.id,
      }));
      StockMovement.insertMany(movements).catch((err) =>
        log.error("Failed to log stock movements (sale)", err),
      );
    });

    // Remove purchased products from wishlist (fire-and-forget)
    setImmediate(() => {
      const purchasedProductIds = order.items.map((item) => item.product);
      Wishlist.updateOne(
        { user: req.user.id },
        { $pull: { products: { $in: purchasedProductIds } } },
      ).catch((err) =>
        log.error("Failed to clean wishlist after purchase", err),
      );
    });

    // Return created order
    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    log.error("Create order error:", error);

    // Release Valkey reservations on failure
    if (typeof reservationKeys !== 'undefined') {
      for (const { key, quantity } of reservationKeys) {
        try { await cacheClient.decrby(key, quantity); } catch { /* ignore */ }
      }
    }

    // Stock-related errors from transaction
    if (error.message && error.message.includes("Insufficient stock")) {
      return res.status(400).json({ message: error.message });
    }

    // Return useful validation messages instead of generic 500
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        message: firstError.message || "Validation failed",
        field: firstError.path,
      });
    }

    res
      .status(500)
      .json({ message: "Failed to create order. Please try again." });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "name slug category images price")
      .sort({ createdAt: -1 });

    // Add summary for each order
    const ordersWithSummary = orders.map((order) => ({
      ...order.toObject(),
      summary: {
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        orderDate: order.createdAt,
        lastUpdated: order.updatedAt,
      },
    }));

    res.json({
      success: true,
      count: orders.length,
      orders: ordersWithSummary,
    });
  } catch (error) {
    log.error("Get user orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name slug category images price")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to the user
    if (order.user._id.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    log.error("Get order by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/v1/orders/:id/razorpay
exports.createRazorpayOrder = async (req, res) => {
  try {
    // Validate Razorpay credentials first
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      log.error("âŒ Razorpay credentials missing in environment variables");
      return res.status(500).json({
        message: "Payment system not configured. Please contact support.",
        error: "RAZORPAY_CREDENTIALS_MISSING",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to the user
    if (order.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this order" });
    }

    if (order.payment.method !== "razorpay") {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    if (order.payment.status === "paid") {
      return res.status(400).json({ message: "Order already paid" });
    }

    // CRITICAL: Razorpay requires amount in paise (â‚¹1 = 100 paise)
    // This is the ONLY place where we convert INR to paise
    // Use total (after discount) instead of subtotal
    const CurrencyUtils = require('../utils/currencyUtils');
    const payAmount = order.total || order.subtotal;
    const amountInPaise = CurrencyUtils.toPaise(payAmount);

    log.info(
      `Creating Razorpay order for â‚¹${order.total || order.subtotal} (${amountInPaise} paise)`,
    );

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${order._id}`,
    });

    order.payment.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    log.error("Create Razorpay order error:", error);

    // Provide more specific error messages
    if (error.error && error.error.description) {
      return res.status(500).json({
        message: "Payment gateway error: " + error.error.description,
        error: "RAZORPAY_API_ERROR",
      });
    }

    res.status(500).json({
      message: "Failed to initialize payment. Please try again or use COD.",
      error: "SERVER_ERROR",
    });
  }
};

// POST /api/v1/orders/:id/verify
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to the user
    if (order.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this order" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update order payment status
    order.payment.status = "paid";
    order.payment.transactionId = razorpay_payment_id;
    await order.save();

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    log.error("Verify Razorpay payment error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Cancel an order
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order belongs to the user
    if (order.user._id.toString() !== req.user.id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to cancel this order" });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "processing", "confirmed"];
    if (!cancellableStatuses.includes(order.status.toLowerCase())) {
      return res.status(400).json({
        message: `Cannot cancel order with status: ${order.status}. Only pending, processing, or confirmed orders can be cancelled.`,
      });
    }

    // === Transactional order cancellation ===
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. Restore stock for each item
        for (const item of order.items) {
          if (item.product && item.size) { // check if product still exists
             await Product.updateOne(
              { _id: item.product, "sizes.size": item.size },
              {
                $inc: {
                  "sizes.$.stock": item.quantity,
                  stock: item.quantity,
                },
              },
              { session }
            );
          }
        }

        // 2. Update order status to cancelled
        order.status = "cancelled";
        order.cancellation = {
          reason: req.body.reason || "Customer requested cancellation",
          cancelledAt: new Date(),
          cancelledBy: "customer",
        };
        await order.save({ session });
      });
    } finally {
      session.endSession();
    }

    // Log stock movements (fire-and-forget)
    setImmediate(() => {
      const movements = order.items
        .filter((item) => item.product && item.size)
        .map((item) => ({
          product: item.product,
          type: "cancellation",
          quantity: item.quantity,
          size: item.size || null,
          orderId: order._id,
          orderCode: order.orderId,
          performedBy: req.user.id,
          note: "Customer cancellation",
        }));
      StockMovement.insertMany(movements).catch((err) =>
        log.error("Failed to log stock movements (cancellation)", err),
      );
    });

    // Invalidate product cache
    await invalidateCache("products:*");

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    log.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
