const express = require("express");
const router = express.Router();
const {
  getAllCoupons,
  createCoupon,
  toggleCouponStatus,
} = require("../controllers/adminCouponController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// All routes require authentication and admin role
router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/coupons
router.get("/", getAllCoupons);

// @route   POST /api/v1/admin/coupons
router.post("/", createCoupon);

// @route   PATCH /api/v1/admin/coupons/:id/toggle
router.patch("/:id/toggle", toggleCouponStatus);

module.exports = router;
