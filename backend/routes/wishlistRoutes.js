const express = require("express");
const router = express.Router();
const {
  getWishlist,
  toggleWishlistItem,
  clearWishlist,
} = require("../controllers/wishlistController");
const { authenticate } = require("../middleware/auth");

// All routes require authentication
router.use(authenticate);

// @route   GET /api/v1/wishlist
router.get("/", getWishlist);

// @route   POST /api/v1/wishlist/toggle
router.post("/toggle", toggleWishlistItem);

// @route   DELETE /api/v1/wishlist
router.delete("/", clearWishlist);

module.exports = router;
