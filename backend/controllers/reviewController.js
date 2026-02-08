const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { uploadBuffer, deleteObject } = require("../utils/minio");
const { generateReviewPhotoKey } = require("../middleware/uploadReviewPhotos");

// @desc    Get all reviews for a product
// @route   GET /api/v1/products/:productId/reviews
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "createdAt" } = req.query;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Only show non-hidden reviews
    const reviews = await Review.find({
      product: productId,
      isHidden: false,
    })
      .populate("user", "name")
      .sort(sort === "helpful" ? { helpfulVotes: -1 } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({
      product: productId,
      isHidden: false,
    });

    // Calculate rating statistics
    const ratingStats = await Review.aggregate([
      {
        $match: {
          product: product._id,
          isHidden: false,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          fiveStars: {
            $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
          },
          fourStars: {
            $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
          },
          threeStars: {
            $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
          },
          twoStars: {
            $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
          },
          oneStar: {
            $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasMore: skip + reviews.length < totalReviews,
      },
      ratingStats: ratingStats[0] || {
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create a review for a product
// @route   POST /api/v1/products/:productId/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user._id;
    const files = req.files; // From multer

    // Validate required fields
    if (!rating || !title || !comment) {
      return res.status(400).json({
        message: "Rating, title, and comment are required",
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // Validate photo count (max 2)
    if (files && files.length > 2) {
      return res.status(400).json({
        message: "Maximum 2 photos allowed per review",
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        message:
          "You have already reviewed this product. You can edit your existing review instead.",
      });
    }

    // Check if user purchased this product (verified purchase)
    const purchasedOrder = await Order.findOne({
      user: userId,
      "items.product": productId,
      status: { $in: ["delivered", "completed"] },
    });

    // Upload photos to MinIO if provided
    const photoUrls = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const key = generateReviewPhotoKey(
          userId.toString(),
          productId,
          file.originalname,
        );
        const publicUrl = await uploadBuffer(file.buffer, key, file.mimetype);
        photoUrls.push(publicUrl);
      }
    }

    // Create review
    const review = new Review({
      product: productId,
      user: userId,
      rating: parseInt(rating),
      title,
      comment,
      photos: photoUrls,
      verifiedPurchase: !!purchasedOrder,
    });

    await review.save();

    // Populate user data before sending response
    await review.populate("user", "name");

    res.status(201).json({
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc    Update user's own review
// @route   PATCH /api/v1/reviews/:id
// @access  Private
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user._id;
    const files = req.files; // New photos from multer

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own reviews" });
    }

    // Validate photo count (existing + new should not exceed 2)
    const existingPhotoCount = review.photos ? review.photos.length : 0;
    const newPhotoCount = files ? files.length : 0;
    if (existingPhotoCount + newPhotoCount > 2) {
      return res.status(400).json({
        message: `Maximum 2 photos allowed. You already have ${existingPhotoCount} photo(s).`,
      });
    }

    // Update fields
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          message: "Rating must be between 1 and 5",
        });
      }
      review.rating = parseInt(rating);
    }
    if (title) review.title = title;
    if (comment) review.comment = comment;

    // Upload new photos to MinIO if provided
    if (files && files.length > 0) {
      const newPhotoUrls = [];
      for (const file of files) {
        const key = generateReviewPhotoKey(
          userId.toString(),
          review.product.toString(),
          file.originalname,
        );
        const publicUrl = await uploadBuffer(file.buffer, key, file.mimetype);
        newPhotoUrls.push(publicUrl);
      }
      // Append new photos to existing ones
      review.photos = [...review.photos, ...newPhotoUrls];
    }

    await review.save();
    await review.populate("user", "name");

    res.json({
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc    Delete user's own review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own reviews" });
    }

    // Optional: Delete photos from MinIO if they exist
    if (review.photos && review.photos.length > 0) {
      for (const photoUrl of review.photos) {
        try {
          // Extract key from URL (format: https://endpoint/bucket/key)
          const urlParts = photoUrl.split("/");
          const key = urlParts.slice(4).join("/"); // Get everything after bucket name
          await deleteObject(key);
        } catch (err) {
          console.error("Error deleting photo from MinIO:", err);
          // Continue even if photo deletion fails
        }
      }
    }

    await review.deleteOne();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Mark review as helpful
// @route   POST /api/v1/reviews/:id/helpful
// @access  Private
exports.markReviewHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user already marked this as helpful
    const alreadyMarked = review.helpfulBy.some(
      (uid) => uid.toString() === userId.toString(),
    );

    if (alreadyMarked) {
      // Remove helpful vote
      review.helpfulBy = review.helpfulBy.filter(
        (uid) => uid.toString() !== userId.toString(),
      );
      review.helpfulVotes = Math.max(0, review.helpfulVotes - 1);
    } else {
      // Add helpful vote
      review.helpfulBy.push(userId);
      review.helpfulVotes += 1;
    }

    await review.save();

    res.json({
      message: alreadyMarked
        ? "Removed helpful vote"
        : "Marked review as helpful",
      helpfulVotes: review.helpfulVotes,
      isHelpful: !alreadyMarked,
    });
  } catch (error) {
    console.error("Mark review helpful error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's own reviews
// @route   GET /api/v1/reviews/me
// @access  Private
exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ user: userId })
      .populate("product", "name images slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({ user: userId });

    res.json({
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / parseInt(limit)),
        totalReviews,
        hasMore: skip + reviews.length < totalReviews,
      },
    });
  } catch (error) {
    console.error("Get my reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Upload review photos
// @route   POST /api/v1/reviews/upload-photos
// @access  Private
exports.uploadReviewPhotos = async (req, res) => {
  try {
    res.status(200).json({
      message:
        "Photo upload is now handled during review creation/update. Please use POST /api/v1/products/:productId/reviews with multipart/form-data.",
    });
  } catch (error) {
    console.error("Upload review photos error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
