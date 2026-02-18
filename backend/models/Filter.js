const mongoose = require("mongoose");

const filterSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["category", "priceRange", "size", "color", "material"],
    },
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // For price ranges
    minPrice: {
      type: Number,
      default: 0,
    },
    maxPrice: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
filterSchema.index({ type: 1, isActive: 1 });
filterSchema.index({ displayOrder: 1 });
module.exports = mongoose.model("Filter", filterSchema);
