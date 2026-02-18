const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    // Event classification
    event: {
      type: String,
      required: true,
      index: true,
      enum: [
        // Page views
        "page_view",
        // Product events
        "product_view",
        "product_search",
        "product_filter",
        // Cart events
        "add_to_cart",
        "remove_from_cart",
        // Checkout / Purchase
        "begin_checkout",
        "purchase",
        // User events
        "sign_up",
        "login",
        // Engagement
        "wishlist_add",
        "wishlist_remove",
        "review_submit",
        "share",
        // CMS
        "banner_click",
        "newsletter_signup",
      ],
    },

    // Optional references
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    sessionId: { type: String, index: true },

    // Event-specific payload (schemaless)
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Page / context info
    page: { type: String }, // e.g. "/products/nike-air-max"
    referrer: { type: String },

    // Device / client
    userAgent: { type: String },
    ip: { type: String },
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },

    // Timestamps are auto-managed but we need a compound index for time-range queries
  },
  {
    timestamps: true,
    collection: "analytics_events",
  },
);

// Compound indexes for common dashboard queries
analyticsEventSchema.index({ event: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, event: 1, createdAt: -1 });
analyticsEventSchema.index({ "properties.productId": 1, event: 1, createdAt: -1 });
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day TTL

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
