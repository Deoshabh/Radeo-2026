const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Razorpay = require("razorpay");
const crypto = require("crypto");

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

    // Validate product availability and stock
    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          message:
            "A product in your cart no longer exists. Please update your cart.",
        });
      }
      if (!item.product.isActive) {
        return res.status(400).json({
          message: `"${item.product.name}" is no longer available. Please remove it from your cart.`,
        });
      }
      if (item.product.isOutOfStock) {
        return res.status(400).json({
          message: `"${item.product.name}" is currently out of stock.`,
        });
      }
      if (
        item.product.stock !== undefined &&
        item.product.stock < item.quantity
      ) {
        return res.status(400).json({
          message: `Insufficient stock for "${item.product.name}". Only ${item.product.stock} available.`,
        });
      }
    }

    // Calculate subtotal and create items snapshot
    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      subtotal += itemTotal;

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
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    // Apply coupon if provided
    let discount = 0;
    let couponData = null;

    if (couponCode) {
      const Coupon = require("../models/Coupon");
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (coupon) {
        // Check if coupon is expired
        if (new Date(coupon.expiry) < new Date()) {
          return res.status(400).json({ message: "Coupon has expired" });
        }

        // Check minimum order value
        if (subtotal < coupon.minOrder) {
          return res.status(400).json({
            message: `Minimum order value of ₹${coupon.minOrder} required for this coupon`,
          });
        }

        // Calculate discount
        if (coupon.type === "flat") {
          discount = coupon.value;
        } else if (coupon.type === "percent") {
          discount = Math.floor((subtotal * coupon.value) / 100);
        }

        // Ensure discount doesn't exceed subtotal
        discount = Math.min(discount, subtotal);

        couponData = {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discount: discount,
        };
      }
    }

    const total = subtotal - discount;

    // Create order
    const order = await Order.create({
      orderId: generateOrderId(),
      user: req.user.id,
      items: orderItems,
      subtotal,
      discount,
      total,
      totalAmount: total, // Store total as totalAmount for frontend
      coupon: couponData,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        // Strip country code prefix (+91, 91, 0) to get bare 10-digit number
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
    });

    // Clear cart after order creation
    cart.items = [];
    await cart.save();

    // Return created order
    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);

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
    console.error("Get user orders error:", error);
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
    console.error("Get order by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/v1/orders/:id/razorpay
exports.createRazorpayOrder = async (req, res) => {
  try {
    // Validate Razorpay credentials first
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ Razorpay credentials missing in environment variables");
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

    // CRITICAL: Razorpay requires amount in paise (₹1 = 100 paise)
    // This is the ONLY place where we convert INR to paise
    // Use total (after discount) instead of subtotal
    const amountInPaise = Math.round((order.total || order.subtotal) * 100);

    console.log(
      `Creating Razorpay order for ₹${order.total || order.subtotal} (${amountInPaise} paise)`,
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
    console.error("Create Razorpay order error:", error);

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
    console.error("Verify Razorpay payment error:", error);
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

    // Update order status to cancelled
    order.status = "cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
