const User = require("../models/User");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const Order = require("../models/Order");

    const page = parseInt(req.query.page) || 0; // 0 = return all (backward compatible)
    const limit = parseInt(req.query.limit) || 0;

    let usersQuery = User.find()
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 });

    if (page > 0 && limit > 0) {
      const skip = (page - 1) * limit;
      usersQuery = usersQuery.skip(skip).limit(limit);
    }

    const users = await usersQuery;

    // Batch fetch all order addresses in ONE query instead of N+1
    const userIds = users.map((u) => u._id);
    const allOrders = await Order.find({ user: { $in: userIds } })
      .sort({ createdAt: -1 })
      .select("user shippingAddress")
      .lean();

    // Group orders by userId
    const ordersByUser = {};
    for (const order of allOrders) {
      const uid = order.user.toString();
      if (!ordersByUser[uid]) ordersByUser[uid] = [];
      ordersByUser[uid].push(order);
    }

    // Map users to include isActive and collect all addresses from profile and orders
    const usersWithStatus = users.map((user) => {
      const userObj = user.toObject();
      const orders = ordersByUser[user._id.toString()] || [];

      const allAddresses = [];
      const profileAddresses = userObj.addresses || [];

      // Mark profile addresses as priority
      profileAddresses.forEach((addr) => {
        allAddresses.push({
          ...addr,
          source: "profile",
          isPriority: true,
        });
      });

      // Collect unique addresses from orders
      const seenPhones = new Set(
        profileAddresses.map((a) => a.phone).filter(Boolean),
      );

      orders.forEach((order) => {
        if (order.shippingAddress && order.shippingAddress.phone) {
          // Add if phone number not already in profile
          if (!seenPhones.has(order.shippingAddress.phone)) {
            seenPhones.add(order.shippingAddress.phone);
            allAddresses.push({
              fullName: order.shippingAddress.fullName,
              phone: order.shippingAddress.phone,
              addressLine1: order.shippingAddress.addressLine1,
              addressLine2: order.shippingAddress.addressLine2,
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              postalCode: order.shippingAddress.postalCode,
              country: order.shippingAddress.country || "India",
              source: "order",
              isPriority: false,
            });
          }
        }
      });

      return {
        ...userObj,
        addresses: allAddresses,
        isActive: !user.isBlocked,
      };
    });

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const Order = require("../models/Order");
    const user = await User.findById(req.params.id).select(
      "-passwordHash -resetPasswordToken -resetPasswordExpires",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userObj = user.toObject();

    // Collect all unique addresses from orders
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select("shippingAddress")
      .lean();

    const allAddresses = [];
    const profileAddresses = userObj.addresses || [];

    // Mark profile addresses as priority
    profileAddresses.forEach((addr) => {
      allAddresses.push({
        ...addr,
        source: "profile",
        isPriority: true,
      });
    });

    // Collect unique addresses from orders
    const seenPhones = new Set(
      profileAddresses.map((a) => a.phone).filter(Boolean),
    );

    orders.forEach((order) => {
      if (order.shippingAddress && order.shippingAddress.phone) {
        // Add if phone number not already in profile
        if (!seenPhones.has(order.shippingAddress.phone)) {
          seenPhones.add(order.shippingAddress.phone);
          allAddresses.push({
            fullName: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            addressLine1: order.shippingAddress.addressLine1,
            addressLine2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country || "India",
            source: "order",
            isPriority: false,
          });
        }
      }
    });

    res.json({ user: { ...userObj, addresses: allAddresses } });
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

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

    const userObj = user.toObject();

    // Get user orders
    const orders = await Order.find({ user: id })
      .populate("items.product", "name images")
      .sort({ createdAt: -1 })
      .lean();

    // Collect all unique addresses from profile and orders
    const allAddresses = [];
    const profileAddresses = userObj.addresses || [];

    // Mark profile addresses as priority
    profileAddresses.forEach((addr) => {
      allAddresses.push({
        ...addr,
        source: "profile",
        isPriority: true,
      });
    });

    // Collect unique addresses from orders
    const seenPhones = new Set(
      profileAddresses.map((a) => a.phone).filter(Boolean),
    );

    orders.forEach((order) => {
      if (order.shippingAddress && order.shippingAddress.phone) {
        // Add if phone number not already in profile
        if (!seenPhones.has(order.shippingAddress.phone)) {
          seenPhones.add(order.shippingAddress.phone);
          allAddresses.push({
            fullName: order.shippingAddress.fullName,
            phone: order.shippingAddress.phone,
            addressLine1: order.shippingAddress.addressLine1,
            addressLine2: order.shippingAddress.addressLine2,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            postalCode: order.shippingAddress.postalCode,
            country: order.shippingAddress.country || "India",
            source: "order",
            isPriority: false,
          });
        }
      }
    });

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
      (o) => String(o.status).toLowerCase() === "delivered",
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
          _id: userObj._id,
          name: userObj.name,
          email: userObj.email,
          phone: allAddresses?.[0]?.phone || null,
          addresses: allAddresses || [],
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
