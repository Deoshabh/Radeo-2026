const User = require("../models/User");
const { log } = require("../utils/logger");

// GET /api/v1/user/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    log.error("Get profile error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch profile" });
  }
};

// PATCH /api/v1/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate email format if provided
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate phone format if provided (10-digit Indian number)
    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    log.error("Update profile error:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile" });
  }
};

// GET /api/v1/user/addresses
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("addresses");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.addresses || []);
  } catch (error) {
    log.error("Get addresses error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch addresses" });
  }
};

// POST /api/v1/user/addresses
exports.addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const user = await User.findById(req.user.id);

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // If this is the first address, make it default
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country: country || "India",
      isDefault: makeDefault,
    });

    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    log.error("Add address error:", error);
    res
      .status(500)
      .json({ message: "Failed to add address" });
  }
};

// PATCH /api/v1/user/addresses/:id
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user.id);
    const address = user.addresses.id(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // If setting as default, unset others
    if (updates.isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(address, updates);
    await user.save();

    res.json(user.addresses);
  } catch (error) {
    log.error("Update address error:", error);
    res
      .status(500)
      .json({ message: "Failed to update address" });
  }
};

// DELETE /api/v1/user/addresses/:id
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    const address = user.addresses.id(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(id);

    // If deleted address was default, set first remaining as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.json(user.addresses);
  } catch (error) {
    log.error("Delete address error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete address" });
  }
};

// PATCH /api/v1/user/addresses/:id/default
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    const address = user.addresses.id(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Unset all defaults, then set this one
    user.addresses.forEach((addr) => (addr.isDefault = false));
    address.isDefault = true;

    await user.save();

    res.json(user.addresses);
  } catch (error) {
    log.error("Set default address error:", error);
    res
      .status(500)
      .json({ message: "Failed to set default address" });
  }
};
