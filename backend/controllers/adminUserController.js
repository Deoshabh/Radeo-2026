const User = require("../models/User");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    // Map users to include isActive for frontend compatibility
    const usersWithStatus = users.map((user) => ({
      ...user.toObject(),
      isActive: !user.isBlocked,
    }));

    res.json({ users: usersWithStatus });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user role
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["customer", "admin", "staff"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be customer, admin, or staff",
      });
    }

    // Check if promoting to admin
    if (role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      const MAX_ADMINS = 5;

      // Check current user's role
      const currentUser = await User.findById(id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // If user is not already an admin, check the limit
      if (currentUser.role !== "admin" && adminCount >= MAX_ADMINS) {
        return res.status(400).json({
          success: false,
          message: `Admin limit reached. Maximum ${MAX_ADMINS} admin accounts allowed. Currently: ${adminCount} admins.`,
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isActive: !user.isBlocked,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Block/Unblock user
// @route   PATCH /api/v1/admin/users/:id/toggle-block
// @access  Private/Admin
exports.toggleUserBlock = async (req, res) => {
  try {
    console.log("Toggle block request:", {
      userId: req.params.id,
      requesterId: req.user?.id || req.user?._id,
      requesterRole: req.user?.role,
    });

    const user = await User.findById(req.params.id);

    if (!user) {
      console.log("User not found:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    // Get requester ID (support both id and _id formats)
    const requesterId = (req.user.id || req.user._id).toString();

    // Prevent admin from blocking themselves
    if (user._id.toString() === requesterId) {
      console.log("Admin attempted to block themselves");
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    // Toggle blocked status
    user.isBlocked = !user.isBlocked;
    await user.save();

    console.log("User block status toggled:", {
      userId: user._id,
      isBlocked: user.isBlocked,
    });

    res.json({
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isActive: !user.isBlocked, // For frontend compatibility
      },
    });
  } catch (error) {
    console.error("Toggle user block error:", error);
    console.error("Error stack:", error.stack);
    console.error("Request params:", req.params);
    console.error("Request user:", req.user?._id);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Create new admin account
// @route   POST /api/v1/admin/users/create-admin
// @access  Private/Admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check admin limit (max 5 admins)
    const adminCount = await User.countDocuments({ role: "admin" });
    const MAX_ADMINS = 5;

    if (adminCount >= MAX_ADMINS) {
      return res.status(400).json({
        success: false,
        message: `Admin limit reached. Maximum ${MAX_ADMINS} admin accounts allowed. Currently: ${adminCount} admins.`,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const adminUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "admin",
      isBlocked: false,
    });

    // Return response (exclude password)
    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isBlocked: adminUser.isBlocked,
        isActive: !adminUser.isBlocked,
        createdAt: adminUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get user contact information
// @route   GET /api/v1/admin/users/:id/contact
// @access  Private/Admin
exports.getUserContact = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select(
      "name email addresses createdAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get default address or first address
    const defaultAddress =
      user.addresses?.find((addr) => addr.isDefault) || user.addresses?.[0];

    res.status(200).json({
      success: true,
      contact: {
        name: user.name,
        email: user.email,
        phone: defaultAddress?.phone || null,
        address: defaultAddress
          ? {
              fullName: defaultAddress.fullName,
              phone: defaultAddress.phone,
              addressLine1: defaultAddress.addressLine1,
              addressLine2: defaultAddress.addressLine2,
              city: defaultAddress.city,
              state: defaultAddress.state,
              postalCode: defaultAddress.postalCode,
              country: defaultAddress.country,
            }
          : null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get user contact error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get comprehensive user history
// @route   GET /api/v1/admin/users/:id/history
// @access  Private/Admin
exports.getUserHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const Order = require("../models/Order");
    const Wishlist = require("../models/Wishlist");
    const Cart = require("../models/Cart");

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch orders with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find({ user: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("items.product", "name images")
      .lean();

    const totalOrders = await Order.countDocuments({ user: id });

    // Format orders with payment details
    const orderHistory = orders.map((order) => ({
      orderId: order.orderId,
      date: order.createdAt,
      status: order.status,
      amount: order.total || order.totalAmount,
      paymentMode:
        order.payment?.method === "cod"
          ? "COD"
          : order.payment?.method === "razorpay"
            ? "Razorpay"
            : order.payment?.method === "stripe"
              ? "Stripe"
              : "Unknown",
      paymentStatus: order.payment?.status || "pending",
      items: order.items?.length || 0,
      coupon: order.coupon?.code || null,
      discount: order.discount || 0,
    }));

    // Fetch wishlist
    const wishlist = await Wishlist.findOne({ user: id })
      .populate("products", "name images price")
      .lean();

    const wishlistActivity =
      wishlist?.products
        ?.filter((product) => product != null)
        .map((product) => ({
          productId: product._id,
          name: product.name,
          image: product.images?.[0],
          price: product.price,
        })) || [];

    // Fetch cart
    const cart = await Cart.findOne({ user: id })
      .populate("items.product", "name images price")
      .lean();

    const cartActivity = {
      currentItems:
        cart?.items
          ?.filter((item) => item.product != null)
          .map((item) => ({
            productId: item.product._id,
            name: item.product.name,
            image: item.product.images?.[0],
            size: item.size,
            quantity: item.quantity,
            price: item.product.price,
          })) || [],
      updatedAt: cart?.updatedAt || null,
    };

    // Coupon usage - extract from orders
    const couponUsage = orders
      .filter((order) => order.coupon?.code)
      .map((order) => ({
        code: order.coupon.code,
        dateUsed: order.createdAt,
        discount: order.coupon.discount || order.discount,
        orderValue: order.total || order.totalAmount,
      }));

    // Calculate summary insights using aggregation
    const summaryData = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          totalSpend: {
            $sum: {
              $ifNull: ["$total", { $ifNull: ["$totalAmount", 0] }],
            },
          },
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          lastPurchaseDate: { $max: "$createdAt" },
        },
      },
    ]);

    const summary = summaryData[0]
      ? {
          totalSpend: summaryData[0].totalSpend || 0,
          totalOrders: summaryData[0].totalOrders || 0,
          completedOrders: summaryData[0].completedOrders || 0,
          pendingOrders: summaryData[0].pendingOrders || 0,
          cancelledOrders: summaryData[0].cancelledOrders || 0,
          lastPurchaseDate: summaryData[0].lastPurchaseDate || null,
          averageOrderValue:
            summaryData[0].totalOrders > 0
              ? summaryData[0].totalSpend / summaryData[0].totalOrders
              : 0,
          totalCouponSavings: couponUsage.reduce(
            (sum, c) => sum + (c.discount || 0),
            0,
          ),
        }
      : {
          totalSpend: 0,
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          lastPurchaseDate: null,
          averageOrderValue: 0,
          totalCouponSavings: 0,
        };

    res.status(200).json({
      success: true,
      history: {
        orders: {
          data: orderHistory,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalOrders / parseInt(limit)),
            totalOrders,
            hasMore: skip + orderHistory.length < totalOrders,
          },
        },
        wishlist: wishlistActivity,
        cart: cartActivity,
        coupons: couponUsage,
        summary,
      },
    });
  } catch (error) {
    console.error("Get user history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
