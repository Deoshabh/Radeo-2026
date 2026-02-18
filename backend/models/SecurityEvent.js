const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

securityEventSchema.index({ eventType: 1, createdAt: -1 });
securityEventSchema.index({ targetUserId: 1, createdAt: -1 });
securityEventSchema.index({ actorUserId: 1, createdAt: -1 });
securityEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SecurityEvent", securityEventSchema);
