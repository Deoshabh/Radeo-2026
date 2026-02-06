const User = require("../models/User");
const bcrypt = require("bcrypt");

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

    if (!role || !["customer", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be customer or admin",
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

// @desc    Get user history (orders, wishlist, cart, coupons)
// @route   GET /api/v1/admin/users/:id/history
// @access  Private/Admin
exports.getUserHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const Order = require("../models/Order");
    const Wishlist = require("../models/Wishlist");
    const Cart = require("../models/Cart");

    // Get user details
    const user = await User.findById(id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user orders
    const orders = await Order.find({ user: id })
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .lean();

    // Get wishlist
    const wishlist = await Wishlist.findOne({ user: id })
      .populate("products", "name images price")
      .lean();

    // Get cart
    const cart = await Cart.findOne({ user: id })
      .populate("items.product", "name images price")
      .lean();

    // Calculate statistics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce(
      (sum, order) => sum + (order.total || 0),
      0,
    );
    const completedOrders = orders.filter(
      (o) => o.status === "Delivered",
    ).length;
    const couponsUsed = orders
      .filter((o) => o.coupon?.code)
      .map((o) => ({
        code: o.coupon.code,
        discount: o.coupon.discount,
        orderId: o.orderId,
        date: o.createdAt,
      }));

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.addresses?.[0]?.phone || null,
          addresses: user.addresses || [],
        },
        orders: orders.map((order) => ({
          _id: order._id,
          orderId: order.orderId,
          total: order.total,
          status: order.status,
          itemCount: order.items.length,
          items: order.items,
          coupon: order.coupon,
          createdAt: order.createdAt,
        })),
        wishlist: {
          count: wishlist?.products?.length || 0,
          products: wishlist?.products || [],
        },
        cart: {
          itemCount: cart?.items?.length || 0,
          items: cart?.items || [],
        },
        statistics: {
          totalOrders,
          totalSpent,
          completedOrders,
          couponsUsed: couponsUsed.length,
          wishlistItems: wishlist?.products?.length || 0,
          cartItems: cart?.items?.length || 0,
        },
        couponsUsed,
      },
    });
  } catch (error) {
    console.error("Get user history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
