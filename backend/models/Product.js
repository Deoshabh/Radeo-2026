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
    // Care instructions as array of points
    careInstructions: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    price: {
      type: Number,
      required: true,
    },
    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    averageDeliveryCost: {
      type: Number,
      default: 0,
      min: 0,
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
        color: {
          type: String,
          trim: true, // Optional: matches a value in the colors array
        },
      },
    ],
    // 360 Degree View Images (Sequence)
    images360: [
      {
        url: { type: String, required: true },
        key: { type: String, required: true },
        order: { type: Number, default: 0 },
      }
    ],
    hotspots360: [
      {
        id: { type: String, required: true },
        frame: { type: Number, required: true },
        x: { type: Number, required: true, min: 0, max: 100 },
        y: { type: Number, required: true, min: 0, max: 100 },
        label: { type: String, default: '' },
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

// Indexes for performance
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });

// Compound indexes for common filters
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ brand: 1, isActive: 1 });
productSchema.index({ price: 1, isActive: 1 });

// MongoDB text index for full-text search (replaces $regex scans)
productSchema.index(
  { name: "text", description: "text", tags: "text", brand: "text" },
  { weights: { name: 10, tags: 5, brand: 3, description: 1 } },
);

// Virtual field for inStock (calculated from stock quantity)
productSchema.virtual("inStock").get(function () {
  return this.stock > 0 && !this.isOutOfStock;
});

module.exports = mongoose.model("Product", productSchema);
