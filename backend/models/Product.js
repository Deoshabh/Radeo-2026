const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Additional product detail sections
    specifications: {
      type: String,
      default: "",
    },
    materialAndCare: {
      type: String,
      default: "",
    },
    shippingAndReturns: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    sizes: [
      {
        size: String,
        stock: Number,
      },
    ],
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        key: {
          type: String,
          required: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isOutOfStock: {
      type: Boolean,
      default: false,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
