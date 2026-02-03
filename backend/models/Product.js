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
    // Product specifications
    specifications: {
      material: {
        type: String,
        default: "",
      },
      sole: {
        type: String,
        default: "",
      },
      construction: {
        type: String,
        default: "",
      },
      madeIn: {
        type: String,
        default: "India",
      },
    },
    // Care instructions
    careInstructions: {
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
    comparePrice: {
      type: Number,
    },
    brand: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    stock: {
      type: Number,
      default: 100, // Default to 100 so products are available immediately
    },
    sizes: [
      {
        size: String,
        stock: Number,
      },
    ],
    colors: [String],
    tags: [String],
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
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual field for inStock (calculated from stock quantity)
productSchema.virtual("inStock").get(function () {
  return this.stock > 0 && !this.isOutOfStock;
});

module.exports = mongoose.model("Product", productSchema);
