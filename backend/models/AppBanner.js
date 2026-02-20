const mongoose = require("mongoose");

const appBannerSchema = new mongoose.Schema(
  {
    image: {
      url: { type: String, required: true },
      key: { type: String, default: "" }, // S3/MinIO key
    },

    // BlurHash placeholder for fast loading in React Native
    blurhash: { type: String, default: "" },

    // Where the banner links to
    linkType: {
      type: String,
      enum: ["none", "url", "product", "category", "screen"],
      default: "none",
    },
    linkValue: { type: String, default: "" },

    // Optional overlay text
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },

    // Visibility
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    // Platform targeting
    platform: {
      type: String,
      enum: ["app", "web", "both"],
      default: "both",
    },

    // Optional scheduling
    startDate: { type: Date },
    endDate: { type: Date },
  },
  {
    timestamps: true,
  },
);

appBannerSchema.index({ isActive: 1, platform: 1, order: 1 });
appBannerSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("AppBanner", appBannerSchema);
