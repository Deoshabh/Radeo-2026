const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const CurrencyUtils = require("../utils/currencyUtils");
const crypto = require("crypto");
const { log } = require("../utils/logger");
const { cacheClient } = require("../config/redis");
const { recordSecurityEvent } = require("../utils/securityEvents");

// @desc    Get all coupons
// @route   GET /api/v1/admin/coupons
// @access  Private/Admin
exports.getAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments({})
    ]);
    res.json({ success: true, data: { coupons, total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    log.error("Get all coupons error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new coupon
// @route   POST /api/v1/admin/coupons
// @access  Private/Admin
exports.createCoupon = async (req, res) => {
  try {
    const { code, type, value, minOrder, expiry } = req.body;

    // Validate required fields
    if (!code || !type || !value || !expiry) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Validate type
    if (!["flat", "percent"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Type must be 'flat' or 'percent'" });
    }

    // Validate value
    if (value <= 0) {
      return res.status(400).json({ message: "Value must be greater than 0" });
    }

    // Validate percent type
    if (type === "percent" && value > 100) {
      return res.status(400).json({ message: "Percentage cannot exceed 100" });
    }

    // Validate expiry
    const expiryDate = new Date(expiry);
    if (expiryDate <= new Date()) {
      return res
        .status(400)
        .json({ message: "Expiry date must be in the future" });
    }

    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    // Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value,
      maxDiscount: req.body.maxDiscount || null,
      minOrder: minOrder || 0,
      expiry: expiryDate,
      validFrom: req.body.validFrom ? new Date(req.body.validFrom) : Date.now(),
      usageLimit: req.body.usageLimit || null,
      perUserLimit: req.body.perUserLimit || null,
      firstOrderOnly: req.body.firstOrderOnly || false,
      applicableCategories: req.body.applicableCategories || [],
      description: req.body.description || "",
    });

    res.status(201).json(coupon);
  } catch (error) {
    log.error("Create coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Toggle coupon active status
// @route   PATCH /api/v1/admin/coupons/:id/toggle
// @access  Private/Admin
exports.toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json(coupon);
  } catch (error) {
    log.error("Toggle coupon status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update a coupon
// @route   PATCH /api/v1/admin/coupons/:id
// @access  Private/Admin
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, type, value, minOrder, expiry, isActive } = req.body;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Validate type if provided
    if (type && !["flat", "percent"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Type must be 'flat' or 'percent'" });
    }

    // Validate value if provided
    if (value !== undefined) {
      if (value <= 0) {
        return res
          .status(400)
          .json({ message: "Value must be greater than 0" });
      }
      if (type === "percent" && value > 100) {
        return res
          .status(400)
          .json({ message: "Percentage cannot exceed 100" });
      }
    }

    // Validate expiry if provided
    if (expiry) {
      const expiryDate = new Date(expiry);
      if (expiryDate <= new Date()) {
        return res
          .status(400)
          .json({ message: "Expiry date must be in the future" });
      }
      coupon.expiry = expiryDate;
    }
    
    if (req.body.validFrom) {
        coupon.validFrom = new Date(req.body.validFrom);
    }

    // Check if new code conflicts with another coupon
    if (code && code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        _id: { $ne: id },
        code: code.toUpperCase(),
      });
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
      coupon.code = code.toUpperCase();
    }

    if (type) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (minOrder !== undefined) coupon.minOrder = minOrder;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (req.body.usageLimit !== undefined) coupon.usageLimit = req.body.usageLimit;
    if (req.body.perUserLimit !== undefined) coupon.perUserLimit = req.body.perUserLimit;
    if (req.body.maxDiscount !== undefined) coupon.maxDiscount = req.body.maxDiscount;
    if (req.body.firstOrderOnly !== undefined) coupon.firstOrderOnly = req.body.firstOrderOnly;
    if (req.body.applicableCategories !== undefined) coupon.applicableCategories = req.body.applicableCategories;
    if (req.body.description !== undefined) coupon.description = req.body.description;

    await coupon.save();
    res.json(coupon);
  } catch (error) {
    log.error("Update coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a coupon
// @route   DELETE /api/v1/admin/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await coupon.deleteOne();
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    log.error("Delete coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Validate and apply coupon
// @route   POST /api/v1/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const clientIp = req.ip || "unknown";

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // ── Rate limiting via Valkey: 10 attempts per IP per hour ──
    const rateLimitKey = `coupon:ratelimit:${clientIp}`;
    const cooldownKey = `coupon:cooldown:${clientIp}`;
    try {
      // Check cooldown (30s lockout after 5 consecutive failures)
      const cooldown = await cacheClient.get(cooldownKey);
      if (cooldown) {
        return res.status(429).json({
          message: "Too many failed attempts. Please wait 30 seconds.",
        });
      }

      const attempts = await cacheClient.incr(rateLimitKey);
      if (attempts === 1) await cacheClient.expire(rateLimitKey, 3600); // 1 hour window
      if (attempts > 10) {
        return res.status(429).json({
          message: "Too many coupon attempts. Please try again later.",
        });
      }
    } catch {
      // Valkey down — proceed without rate limiting
    }

    const inputCode = code.toUpperCase().trim();

    // Find coupon candidates by first 3 characters (prefix query)
    const prefix = inputCode.slice(0, 3);
    const candidates = await Coupon.find({
      code: { $regex: `^${prefix}`, $options: "i" },
    }).lean();

    // Timing-safe comparison against all candidates
    let matchedCoupon = null;
    for (const candidate of candidates) {
      const storedBuf = Buffer.from(candidate.code, "utf8");
      const inputBuf = Buffer.from(inputCode, "utf8");
      // Buffers must be same length for timingSafeEqual
      if (storedBuf.length === inputBuf.length) {
        if (crypto.timingSafeEqual(storedBuf, inputBuf)) {
          matchedCoupon = candidate;
          // Don't break — process all candidates to ensure constant-time
        }
      }
    }

    if (!matchedCoupon) {
      // Track failed attempt for cooldown
      try {
        const failKey = `coupon:fails:${clientIp}`;
        const fails = await cacheClient.incr(failKey);
        if (fails === 1) await cacheClient.expire(failKey, 300); // 5-min window
        if (fails >= 5) {
          await cacheClient.set(cooldownKey, "1", "EX", 30); // 30s cooldown
          await cacheClient.del(failKey);
        }
      } catch { /* Valkey down */ }

      // Log security event for probing
      recordSecurityEvent({
        eventType: "coupon_probe",
        ip: clientIp,
        userAgent: req.headers["user-agent"] || null,
        metadata: { attemptedCode: inputCode },
      }).catch(() => {});

      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Reset fail counter on success
    try {
      await cacheClient.del(`coupon:fails:${clientIp}`);
    } catch { /* ignore */ }

    // ── Standard validation checks ──
    if (!matchedCoupon.isActive) {
      return res
        .status(400)
        .json({ message: "This coupon is no longer active" });
    }

    const now = new Date();

    if (matchedCoupon.validFrom && new Date(matchedCoupon.validFrom) > now) {
      return res.status(400).json({ message: "This coupon is not yet valid" });
    }

    if (new Date(matchedCoupon.expiry) < now) {
      return res.status(400).json({ message: "This coupon has expired" });
    }

    if (cartTotal < matchedCoupon.minOrder) {
      return res.status(400).json({
        message: `Minimum order value of ${CurrencyUtils.format(matchedCoupon.minOrder)} required to use this coupon`,
      });
    }

    if (matchedCoupon.usageLimit != null && matchedCoupon.usedCount >= matchedCoupon.usageLimit) {
      return res.status(400).json({ message: "This coupon has reached its usage limit" });
    }

    // Calculate discount
    let discount = 0;
    if (matchedCoupon.type === "flat") {
      discount = matchedCoupon.value;
    } else if (matchedCoupon.type === "percent") {
      discount = (cartTotal * matchedCoupon.value) / 100;
      if (matchedCoupon.maxDiscount && discount > matchedCoupon.maxDiscount) {
        discount = matchedCoupon.maxDiscount;
      }
    }

    if (discount > cartTotal) {
      discount = cartTotal;
    }

    res.json({
      success: true,
      coupon: {
        code: matchedCoupon.code,
        type: matchedCoupon.type,
        value: matchedCoupon.value,
        maxDiscount: matchedCoupon.maxDiscount,
        discount: Math.round(discount),
      },
    });
  } catch (error) {
    log.error("Validate coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get coupon performance stats (aggregated from orders)
// @route   GET /api/v1/admin/coupons/stats
// @access  Private/Admin
exports.getCouponStats = async (req, res) => {
  try {
    // Aggregate order data grouped by coupon code
    const orderStats = await Order.aggregate([
      { $match: { "coupon.code": { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { $toUpper: "$coupon.code" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          totalDiscount: { $sum: "$discount" },
          uniqueUsers: { $addToSet: "$user" },
          avgOrderValue: { $avg: "$total" },
          lastUsed: { $max: "$createdAt" },
        },
      },
      {
        $project: {
          code: "$_id",
          totalOrders: 1,
          totalRevenue: 1,
          totalDiscount: 1,
          uniqueUsers: { $size: "$uniqueUsers" },
          avgOrderValue: { $round: ["$avgOrderValue", 0] },
          lastUsed: 1,
          _id: 0,
        },
      },
    ]);

    // Get all coupons and merge with stats
    const coupons = await Coupon.find({}).lean();
    const statsMap = {};
    orderStats.forEach((s) => { statsMap[s.code] = s; });

    const result = coupons.map((c) => {
      const s = statsMap[c.code.toUpperCase()] || {};
      return {
        _id: c._id,
        code: c.code,
        type: c.type,
        value: c.value,
        maxDiscount: c.maxDiscount,
        minOrder: c.minOrder,
        expiry: c.expiry,
        validFrom: c.validFrom,
        isActive: c.isActive,
        usageLimit: c.usageLimit,
        usedCount: c.usedCount || 0,
        description: c.description,
        // Performance metrics
        totalOrders: s.totalOrders || 0,
        totalRevenue: s.totalRevenue || 0,
        totalDiscount: s.totalDiscount || 0,
        uniqueUsers: s.uniqueUsers || 0,
        avgOrderValue: s.avgOrderValue || 0,
        lastUsed: s.lastUsed || null,
      };
    });

    res.json(result);
  } catch (error) {
    log.error("Get coupon stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
