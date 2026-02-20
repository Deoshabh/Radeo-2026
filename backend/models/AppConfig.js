const mongoose = require("mongoose");

const appConfigSchema = new mongoose.Schema(
  {
    // There should only ever be one document — enforced by a fixed key.
    _id: {
      type: String,
      default: "global",
    },

    // Maintenance
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: "We are performing scheduled maintenance. Please check back shortly." },

    // App versioning (for React Native forced updates)
    minAppVersion: { type: String, default: "1.0.0" },
    forceUpdate: { type: Boolean, default: false },
    latestAppVersion: { type: String, default: "1.0.0" },
    updateUrl: {
      android: { type: String, default: "" },
      ios: { type: String, default: "" },
    },

    // Announcement banner (top of home screen)
    announcementBanner: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: "" },
      linkType: { type: String, enum: ["none", "url", "screen", "product", "category"], default: "none" },
      linkValue: { type: String, default: "" },
      bgColor: { type: String, default: "#000000" },
      textColor: { type: String, default: "#FFFFFF" },
    },

    // Branding
    primaryColor: { type: String, default: "#000000" },
    accentColor: { type: String, default: "#E53E3E" },

    // Feature flags
    features: {
      reviews: { type: Boolean, default: true },
      wishlist: { type: Boolean, default: true },
      coupons: { type: Boolean, default: true },
      cod: { type: Boolean, default: true },
      razorpay: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      recentlyViewed: { type: Boolean, default: true },
    },

    // Shipping
    freeShippingThreshold: { type: Number, default: 999 },
    defaultShippingCost: { type: Number, default: 79 },

    // Social links (for app footer / about screen)
    social: {
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      youtube: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },

    // Contact
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("AppConfig", appConfigSchema);
