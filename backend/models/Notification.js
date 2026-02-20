const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    body: { type: String, required: true },

    type: {
      type: String,
      enum: [
        "order_placed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "price_drop",
        "back_in_stock",
        "promotion",
        "new_arrival",
        "review_reply",
        "system",
      ],
      default: "system",
    },

    // Arbitrary payload — the app uses this to navigate on tap
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Image thumbnail (optional)
    imageUrl: { type: String, default: "" },

    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
