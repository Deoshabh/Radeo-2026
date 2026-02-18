const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
} = require("../controllers/userController");
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

// All routes are protected
router.get("/profile", authenticate, getProfile);
router.patch("/profile", authenticate, updateProfile);
router.get("/addresses", authenticate, getAddresses);
router.post("/addresses", authenticate, createAddress);
router.patch("/addresses/:id", authenticate, updateAddress);
router.delete("/addresses/:id", authenticate, deleteAddress);
router.patch("/addresses/:id/default", authenticate, setDefaultAddress);

module.exports = router;
