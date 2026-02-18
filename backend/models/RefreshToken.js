const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tokenHash: {
      type: String,
      required: true,
    },

    // Token family for rotation theft detection
    family: {
      type: String,
      required: true,
      index: true,
    },

    // Set when this token is rotated out — points to the replacement
    replacedByTokenId: {
      type: String,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    createdByIp: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

refreshTokenSchema.index({ userId: 1, tokenId: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ family: 1, userId: 1 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
