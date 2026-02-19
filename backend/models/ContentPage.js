const mongoose = require("mongoose");

const contentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "hero",
        "text",
        "image",
        "gallery",
        "features",
        "testimonials",
        "cta",
        "columns",
        "accordion",
        "table",
        "row",
        "column",
        "container",
        "heading",
        "button",
        "divider",
        "spacer",
      ],
    },
    position: {
      type: Number,
      required: true,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    visibility: {
      type: String,
      enum: ["all", "mobile", "desktop"],
      default: "all",
    },
  },
  { _id: false, timestamps: true }
);

const contentPageSchema = new mongoose.Schema(
  {
    // Page Identification
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9\-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
    },
    path: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\/[a-z0-9\-/]*$/, "Path must start with / and contain only lowercase letters, numbers, hyphens, and slashes"],
    },

    // Content Structure
    blocks: [contentBlockSchema],
    
    // SEO & Metadata
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    metaKeywords: [String],
    openGraphImage: String,
    canonicalUrl: String,
    noIndex: {
      type: Boolean,
      default: false,
    },
    noFollow: {
      type: Boolean,
      default: false,
    },

    // Page Configuration
    template: {
      type: String,
      enum: ["default", "full-width", "sidebar-left", "sidebar-right"],
      default: "default",
    },
    status: {
      type: String,
      enum: ["draft", "review", "published", "archived"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "password"],
      default: "public",
    },
    
    // Scheduling
    publishAt: {
      type: Date,
      index: true,
    },
    unpublishAt: Date,

    // Organization
    category: {
      type: String,
      enum: ["page", "post", "faq", "policy", "help", "custom"],
      default: "page",
      index: true,
    },
    tags: [String],
    order: {
      type: Number,
      default: 0,
    },

    // Versioning & Auditing
    version: {
      type: Number,
      default: 1,
    },

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

    // Performance
    cacheKey: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
contentPageSchema.index({ slug: 1, status: 1 });
contentPageSchema.index({ path: 1, status: 1 });
contentPageSchema.index({ category: 1, status: 1 });
contentPageSchema.index({ status: 1, publishAt: 1 });
contentPageSchema.index({ tags: 1 });
contentPageSchema.index({ "blocks.type": 1 });

// Virtual for URL
contentPageSchema.virtual("url").get(function () {
  return this.path;
});

// Virtual for isPublished (considers scheduling)
contentPageSchema.virtual("isPublished").get(function () {
  if (this.status !== "published") return false;
  
  const now = new Date();
  if (this.publishAt && this.publishAt > now) return false;
  if (this.unpublishAt && this.unpublishAt <= now) return false;
  
  return true;
});

// Pre-save hook to generate cache key
contentPageSchema.pre("save", function () {
  if (this.isModified("blocks") || this.isModified("status") || this.isModified("title")) {
    this.cacheKey = `cms:page:${this.slug}:v${this.version}:${Date.now()}`;
  }
});

// Static method to find published pages
contentPageSchema.statics.findPublished = function (query = {}) {
  const now = new Date();
  return this.find({
    ...query,
    status: "published",
    $or: [
      { publishAt: { $exists: false } },
      { publishAt: null },
      { publishAt: { $lte: now } },
    ],
    $and: [
      {
        $or: [
          { unpublishAt: { $exists: false } },
          { unpublishAt: null },
          { unpublishAt: { $gt: now } },
        ],
      },
    ],
  });
};

module.exports = mongoose.model("ContentPage", contentPageSchema);