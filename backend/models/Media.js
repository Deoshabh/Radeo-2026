const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema(
  {
    // File Information
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
    },
    fileSize: {
      type: Number, // bytes
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      required: true,
    },
    
    // Storage Information
    bucket: {
      type: String,
      default: "cms-media",
    },
    key: {
      type: String,
      required: true,
      unique: true,
    },
    storageUrl: {
      type: String,
      required: true,
    },
    cdnUrl: {
      type: String,
      required: true,
    },


    // Responsive image variants (populated by image processing queue)
    variants: {
      thumb: String,  // 200x200 cover
      card: String,   // 600x600 inside
      full: String,   // 1200x1200 inside
    },
    processedAt: Date,
    
    // Image-specific fields
    width: Number,
    height: Number,
    aspectRatio: Number,

    
    // Categorization
    type: {
      type: String,
      enum: ["image", "video", "document", "audio", "other"],
      required: true,
    },
    category: {
      type: String,
      enum: ["banner", "gallery", "product", "avatar", "background", "icon", "other"],
      default: "other",
    },
    tags: [String],
    
    // Usage Tracking
    usageCount: {
      type: Number,
      default: 0,
    },
    usedIn: [
      {
        model: String, // "ContentPage", "Product", "User"
        modelId: mongoose.Schema.Types.ObjectId,
        field: String,
        addedAt: Date,
      },
    ],
    
    // Ownership
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    // Metadata
    altText: String,
    caption: String,
    credit: String,
    
    // Retention
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
mediaSchema.index({ type: 1, category: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ uploadedBy: 1 });
mediaSchema.index({ isArchived: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ usageCount: -1 });

// Virtual for file type category
mediaSchema.virtual("isImage").get(function () {
  return this.type === "image";
});

mediaSchema.virtual("isVideo").get(function () {
  return this.type === "video";
});

mediaSchema.virtual("isDocument").get(function () {
  return this.type === "document";
});

// Virtual for file size in human-readable format
mediaSchema.virtual("fileSizeHuman").get(function () {
  const bytes = this.fileSize;
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});

// Virtual for dimensions if image
mediaSchema.virtual("dimensions").get(function () {
  if (this.width && this.height) {
    return `${this.width}×${this.height}`;
  }
  return null;
});

// Pre-save hook to calculate aspect ratio for images
mediaSchema.pre("save", function () {
  if (this.isImage && this.width && this.height && this.height > 0) {
    this.aspectRatio = this.width / this.height;
  }
  
  // Generate CDN URL if not set
  if (!this.cdnUrl && this.storageUrl) {
    // Convert MinIO URL to CDN URL
    // Example: http://minio:9000/cms-media/filename.jpg → https://cdn.radeo.in/cms-media/filename.jpg
    const url = new URL(this.storageUrl);
    if (url.hostname === "minio" || url.hostname.includes("minio")) {
      this.cdnUrl = this.storageUrl.replace(
        url.origin,
        "https://cdn.radeo.in"
      );
    } else {
      this.cdnUrl = this.storageUrl;
    }
  }
});

// Method to increment usage count
mediaSchema.methods.incrementUsage = function (model, modelId, field) {
  this.usageCount += 1;
  this.usedIn.push({
    model,
    modelId,
    field,
    addedAt: new Date(),
  });
  return this.save();
};

// Method to decrement usage count
mediaSchema.methods.decrementUsage = function (model, modelId, field) {
  this.usageCount = Math.max(0, this.usageCount - 1);
  
  // Remove from usedIn array
  this.usedIn = this.usedIn.filter(
    (usage) =>
      !(usage.model === model && usage.modelId.equals(modelId) && usage.field === field)
  );
  
  return this.save();
};

// Static method to find unused media (for cleanup)
mediaSchema.statics.findUnused = function (olderThanDays = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  return this.find({
    usageCount: 0,
    createdAt: { $lt: cutoffDate },
    isArchived: false,
  });
};

module.exports = mongoose.model("Media", mediaSchema);