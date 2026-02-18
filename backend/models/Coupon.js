const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["flat", "percent"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null, // Cap for percent-type coupons (e.g., 20% off up to ₹500)
    },
    minOrder: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    expiry: {
      type: Date,
      required: true,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    perUserLimit: {
      type: Number,
      default: null, // null means unlimited per user
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
