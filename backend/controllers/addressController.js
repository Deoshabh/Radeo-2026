const Address = require("../models/Address");

// @desc    Get all addresses for logged-in user
// @route   GET /api/v1/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({
      isDefault: -1,
      createdAt: -1,
    });
    res.json(addresses);
  } catch (error) {
    console.error("Get addresses error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a new address
// @route   POST /api/v1/addresses
// @access  Private
exports.createAddress = async (req, res) => {
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

    // Validate required fields
    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    // Create address
    const address = await Address.create({
      user: req.user.id,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country: country || "India",
      isDefault: isDefault || false,
    });

    res.status(201).json(address);
  } catch (error) {
    console.error("Create address error:", error);

    // Return validation errors to frontend
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: errors.join(", ") });
    }

    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update an address
// @route   PATCH /api/v1/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
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

    const address = await Address.findOne({ _id: id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Update fields
    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await address.save();

    res.json(address);
  } catch (error) {
    console.error("Update address error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete an address
// @route   DELETE /api/v1/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    await address.deleteOne();

    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete address error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Set default address
// @route   PATCH /api/v1/addresses/:id/default
// @access  Private
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({ _id: id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    address.isDefault = true;
    await address.save();

    res.json(address);
  } catch (error) {
    console.error("Set default address error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
