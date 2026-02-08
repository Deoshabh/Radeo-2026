const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Review content
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // Photo reviews (array of image URLs from MinIO) - Max 2 photos
    photos: {
      type: [String],
      validate: {
        validator: function (arr) {
          return arr.length <= 2;
        },
        message: "Maximum 2 photos allowed per review",
      },
      default: [],
    },
    // Verified purchase flag
    verifiedPurchase: {
      type: Boolean,
      default: false,
    },
    // Admin moderation
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Admin notes (private, not visible to users)
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Helpful votes
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    // Users who marked this review as helpful
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate reviews from same user for same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Virtual for photo count
reviewSchema.virtual("photoCount").get(function () {
  return this.photos ? this.photos.length : 0;
});

// Ensure virtuals are included in JSON
reviewSchema.set("toJSON", { virtuals: true });
reviewSchema.set("toObject", { virtuals: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
