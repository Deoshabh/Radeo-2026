const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const SecurityEvent = require("../models/SecurityEvent");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { log } = require("../utils/logger");
const { recordSecurityEvent } = require("../utils/securityEvents");
const admin = require("../config/firebase");
const { cacheClient } = require("../config/redis");
const crypto = require("crypto");

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const Order = require("../models/Order");

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    let usersQuery = User.find()
      .select("-passwordHash -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const users = await usersQuery;
    const userIds = users.map((u) => u._id);

    const sessionCounts = await RefreshToken.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);

    const sessionCountByUserId = new Map(
      sessionCounts.map((row) => [String(row._id), row.count]),
    );

    // Batch fetch all order addresses in ONE query instead of N+1
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
        activeSessions: sessionCountByUserId.get(String(user._id)) || 0,
      };
    });

    res.json({ users: usersWithStatus });
  } catch (error) {
    log.error("Get all users error:", error);
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
    const activeSessions = await RefreshToken.countDocuments({ userId: user._id });

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

    res.json({ user: { ...userObj, addresses: allAddresses, activeSessions } });
  } catch (error) {
    log.error("Get user by ID error:", error);
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

    // Prevent demoting the last admin
    if (role === "customer") {
      const targetUser = await User.findById(id);
      if (targetUser && targetUser.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: "Cannot demote the last admin. Create another admin first.",
          });
        }
      }
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
    log.error("Update user role error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Block/Unblock user
// @route   PATCH /api/v1/admin/users/:id/toggle-block
// @access  Private/Admin
exports.toggleUserBlock = async (req, res) => {
  try {
    log.info("Toggle block request:", {
      userId: req.params.id,
      requesterId: req.user?.id || req.user?._id,
      requesterRole: req.user?.role,
    });

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      log.info("User not found:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    // Get requester ID (support both id and _id formats)
    const requesterId = (req.user.id || req.user._id).toString();

    // Prevent admin from blocking themselves
    if (user._id.toString() === requesterId) {
      log.info("Admin attempted to block themselves");
      return res.status(400).json({ message: "Cannot block yourself" });
    }

    // Toggle blocked status
    user.isBlocked = !user.isBlocked;
    await user.save();

    let revokedSessions = 0;
    if (user.isBlocked) {
      const revoked = await RefreshToken.deleteMany({ userId: user._id });
      revokedSessions = revoked.deletedCount || 0;
    }

    log.info("Admin user block toggled", {
      actionByUserId: String(req.user?.id || req.user?._id || "unknown"),
      targetUserId: String(user._id),
      targetEmail: user.email,
      blocked: user.isBlocked,
      reason: user.isBlocked ? "admin_block" : "admin_unblock",
      revokedSessions,
    });

    await recordSecurityEvent({
      eventType: "admin_user_block_toggled",
      actorUserId: req.user?.id || req.user?._id || null,
      targetUserId: user._id,
      reason: user.isBlocked ? "admin_block" : "admin_unblock",
      ip: req.ip,
      userAgent: req.headers["user-agent"] || null,
      metadata: {
        targetEmail: user.email,
        blocked: user.isBlocked,
        revokedSessions,
      },
    });

    log.info("User block status toggled:", {
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
        activeSessions: user.isBlocked ? 0 : await RefreshToken.countDocuments({ userId: user._id }),
      },
    });
  } catch (error) {
    log.error("Toggle user block error:", error);
    log.error("Error stack:", error.stack);
    log.error("Request params:", req.params);
    log.error("Request user:", req.user?._id);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Get recent security events
// @route   GET /api/v1/admin/users/security-events
// @access  Private/Admin
exports.getSecurityEvents = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const { eventType, userId, actorId, from, to } = req.query;

    const filter = {};

    if (eventType) {
      filter.eventType = eventType;
    }

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid userId" });
      }
      filter.targetUserId = userId;
    }

    if (actorId) {
      if (!mongoose.Types.ObjectId.isValid(actorId)) {
        return res.status(400).json({ success: false, message: "Invalid actorId" });
      }
      filter.actorUserId = actorId;
    }

    // Date range filter
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [events, total] = await Promise.all([
      SecurityEvent.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SecurityEvent.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: events.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      events,
    });
  } catch (error) {
    log.error("Get security events error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
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

    if (password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters with uppercase, lowercase, and a number",
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
    log.error("Create admin error:", error);
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
    log.error("Get user history error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Send password reset link to user via Firebase
// @route   POST /api/v1/admin/users/:id/send-password-reset
// @access  Private/Admin
exports.sendPasswordReset = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("email name");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const auth = admin.auth();
    if (!auth) {
      return res.status(503).json({
        success: false,
        message: "Firebase Admin not configured",
      });
    }

    const resetLink = await auth.generatePasswordResetLink(user.email);

    recordSecurityEvent({
      eventType: "admin_password_reset_sent",
      userId: user._id,
      performedBy: req.user._id,
      ip: req.ip,
      metadata: { targetEmail: user.email },
    }).catch(() => {});

    log.info(`Password reset link generated for ${user.email} by admin ${req.user._id}`);

    res.json({
      success: true,
      message: `Password reset link sent to ${user.email}`,
      resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined,
    });
  } catch (error) {
    log.error("Send password reset error:", error);
    res.status(500).json({
      success: false,
      message: error.code === "auth/user-not-found"
        ? "User not found in Firebase"
        : "Failed to generate password reset link",
    });
  }
};

// @desc    Force logout a user (revoke all sessions)
// @route   POST /api/v1/admin/users/:id/force-logout
// @access  Private/Admin
exports.forceLogout = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("email firebaseUid");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete all refresh tokens from DB
    const { deletedCount } = await RefreshToken.deleteMany({ userId: user._id });

    // Revoke Firebase refresh tokens if user has Firebase UID
    const auth = admin.auth();
    if (auth && user.firebaseUid) {
      try {
        await auth.revokeRefreshTokens(user.firebaseUid);
      } catch (err) {
        log.warn(`Firebase token revocation failed for ${user.firebaseUid}:`, err.message);
      }
    }

    recordSecurityEvent({
      eventType: "admin_force_logout",
      userId: user._id,
      performedBy: req.user._id,
      ip: req.ip,
      metadata: { sessionsRevoked: deletedCount },
    }).catch(() => {});

    log.info(`Force logout: ${deletedCount} sessions revoked for user ${user._id} by admin ${req.user._id}`);

    res.json({
      success: true,
      message: `User logged out from ${deletedCount} session(s)`,
      sessionsRevoked: deletedCount,
    });
  } catch (error) {
    log.error("Force logout error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Generate a short-lived impersonation token (superadmin only)
// @route   POST /api/v1/admin/users/:id/impersonate
// @access  Private/Superadmin
exports.impersonateUser = async (req, res) => {
  try {
    // Only superadmin can impersonate
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only superadmin can impersonate users",
      });
    }

    const targetUser = await User.findById(req.params.id).select("name email role");
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent impersonating other superadmins
    if (targetUser.role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Cannot impersonate another superadmin",
      });
    }

    // Generate a short-lived token stored in Valkey (5-minute TTL)
    const impersonationToken = crypto.randomBytes(32).toString("hex");
    const tokenKey = `impersonate:${impersonationToken}`;
    const tokenData = JSON.stringify({
      targetUserId: targetUser._id.toString(),
      adminUserId: req.user._id.toString(),
      createdAt: new Date().toISOString(),
    });

    await cacheClient.set(tokenKey, tokenData, "EX", 300); // 5 minutes

    recordSecurityEvent({
      eventType: "admin_impersonation_started",
      userId: targetUser._id,
      performedBy: req.user._id,
      ip: req.ip,
      metadata: {
        targetName: targetUser.name,
        targetEmail: targetUser.email,
        ttl: 300,
      },
    }).catch(() => {});

    log.warn(`Impersonation: admin ${req.user._id} impersonating user ${targetUser._id} (${targetUser.email})`);

    res.json({
      success: true,
      impersonationToken,
      expiresIn: 300,
      targetUser: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    log.error("Impersonate user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
