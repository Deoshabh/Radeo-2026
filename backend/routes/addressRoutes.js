const express = require("express");
const router = express.Router();
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  validateAddressAPI,
  checkPincodeServiceability,
} = require("../controllers/addressController");
const { authenticate } = require("../middleware/auth");

// Public endpoint for PIN code check
router.get("/check-pincode/:pincode", checkPincodeServiceability);

// All other routes require authentication
router.use(authenticate);

// @route   POST /api/v1/addresses/validate
router.post("/validate", validateAddressAPI);

// @route   GET /api/v1/addresses
router.get("/", getAddresses);

// @route   POST /api/v1/addresses
router.post("/", createAddress);

// @route   PATCH /api/v1/addresses/:id
router.patch("/:id", updateAddress);

// @route   DELETE /api/v1/addresses/:id
router.delete("/:id", deleteAddress);

// @route   PATCH /api/v1/addresses/:id/default
router.patch("/:id/default", setDefaultAddress);

module.exports = router;
