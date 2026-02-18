const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      enum: ["link", "page", "category", "custom", "dropdown", "divider"],
      default: "link",
    },
    
    // Link configuration
    url: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (this.type === "link" || this.type === "custom") {
            return v && v.length > 0;
          }
          return true;
        },
        message: "URL is required for link and custom types",
      },
    },
    
    // Internal reference
    page: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContentPage",
    },
    category: {
      type: String, // Category slug
      trim: true,
    },
    
    // Behavior
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    noFollow: {
      type: Boolean,
      default: false,
    },
    
    // Display
    icon: String,
    cssClass: String,
    badgeText: String,
    badgeColor: {
      type: String,
      enum: ["red", "green", "blue", "yellow", "purple", "gray"],
      default: "red",
    },
    
    // Hierarchy
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    
    // Visibility
    visibility: {
      type: String,
      enum: ["all", "authenticated", "guest", "admin"],
      default: "all",
    },
    
    // Scheduling
    showFrom: Date,
    showUntil: Date,
  },
  { timestamps: true }
);

const navigationMenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
    },
    
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    
    // Menu Configuration
    location: {
      type: String,
      enum: ["header", "footer", "sidebar", "mobile", "social", "quicklinks", "custom"],
      default: "header",
      index: true,
    },
    
    items: [menuItemSchema],
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Caching
    cacheKey: String,
    lastUpdatedAt: Date,
    
    // Ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
navigationMenuSchema.index({ slug: 1, isActive: 1 });
navigationMenuSchema.index({ location: 1, isActive: 1 });
navigationMenuSchema.index({ "items.parent": 1 });

// Virtual for item count
navigationMenuSchema.virtual("itemCount").get(function () {
  return this.items.length;
});

// Virtual for active items (considering scheduling)
navigationMenuSchema.virtual("activeItems").get(function () {
  const now = new Date();
  return this.items.filter((item) => {
    // Check visibility based on auth status (simplified)
    // In real implementation, this would check req.user
    if (item.visibility === "admin") return false; // Only shown in admin context
    
    // Check scheduling
    if (item.showFrom && item.showFrom > now) return false;
    if (item.showUntil && item.showUntil <= now) return false;
    
    return true;
  });
});

// Pre-save hook to generate cache key
navigationMenuSchema.pre("save", function (next) {
  if (this.isModified("items") || this.isModified("isActive")) {
    this.cacheKey = `cms:menu:${this.slug}:${Date.now()}`;
    this.lastUpdatedAt = new Date();
  }
  next();
});

// Method to add item
navigationMenuSchema.methods.addItem = function (itemData) {
  // Set order if not provided
  if (itemData.order === undefined) {
    const maxOrder = this.items.reduce((max, item) => Math.max(max, item.order), -1);
    itemData.order = maxOrder + 1;
  }
  
  this.items.push(itemData);
  return this.save();
};

// Method to remove item
navigationMenuSchema.methods.removeItem = function (itemId) {
  const itemIndex = this.items.findIndex((item) => item._id.equals(itemId));
  if (itemIndex === -1) return Promise.resolve(this);
  
  // Remove the item
  this.items.splice(itemIndex, 1);
  
  // Update parent references for child items
  this.items.forEach((item) => {
    if (item.parent && item.parent.equals(itemId)) {
      item.parent = null;
    }
  });
  
  return this.save();
};

// Method to reorder items
navigationMenuSchema.methods.reorderItems = function (itemIds) {
  const itemMap = new Map(this.items.map((item) => [item._id.toString(), item]));
  
  // Recreate items array in the new order
  this.items = itemIds
    .map((id) => itemMap.get(id))
    .filter(Boolean)
    .map((item, index) => {
      item.order = index;
      return item;
    });
  
  return this.save();
};

// Static method to get menu by location
navigationMenuSchema.statics.findByLocation = function (location) {
  return this.findOne({ location, isActive: true });
};

module.exports = mongoose.model("NavigationMenu", navigationMenuSchema);