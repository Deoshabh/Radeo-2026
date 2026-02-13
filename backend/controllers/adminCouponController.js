const Coupon = require("../models/Coupon");

// @desc    Get all coupons
// @route   GET /api/v1/admin/coupons
// @access  Private/Admin
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error("Get all coupons error:", error);
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
      minOrder: minOrder || 0,
      expiry: expiryDate,
      usageLimit: req.body.usageLimit || null,
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error("Create coupon error:", error);
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
    console.error("Toggle coupon status error:", error);
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

    await coupon.save();
    res.json(coupon);
  } catch (error) {
    console.error("Update coupon error:", error);
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
    console.error("Delete coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Validate and apply coupon
// @route   POST /api/v1/coupons/validate
// @access  Public
exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    // Find coupon (case-insensitive)
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res
        .status(400)
        .json({ message: "This coupon is no longer active" });
    }

    // Check if coupon is expired
    if (new Date(coupon.expiry) < new Date()) {
      return res.status(400).json({ message: "This coupon has expired" });
    }

    // Check minimum order value
    if (cartTotal < coupon.minOrder) {
      return res.status(400).json({
        message: `Minimum order value of ₹${coupon.minOrder} required to use this coupon`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "flat") {
      discount = coupon.value;
    } else if (coupon.type === "percent") {
      discount = (cartTotal * coupon.value) / 100;
    }

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Math.round(discount),
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
