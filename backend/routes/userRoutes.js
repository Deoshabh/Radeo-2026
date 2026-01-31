const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/userController");

// All routes are protected
router.get("/addresses", authenticate, getAddresses);
router.post("/addresses", authenticate, addAddress);
router.patch("/addresses/:id", authenticate, updateAddress);
router.delete("/addresses/:id", authenticate, deleteAddress);
router.patch("/addresses/:id/default", authenticate, setDefaultAddress);

module.exports = router;
