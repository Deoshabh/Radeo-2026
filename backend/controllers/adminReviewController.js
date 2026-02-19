const { log } = require('../utils/logger');
const Review = require("../models/Review");
const Product = require("../models/Product");
const User = require("../models/User");
const { deleteObjects } = require("../utils/minio");

// @desc    Get all reviews with filters (admin)
// @route   GET /api/v1/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = "createdAt",
      order = "desc",
      rating,
      isHidden,
      verifiedPurchase,
      productId,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter query
    const filter = {};

    if (rating) filter.rating = parseInt(rating);
    if (isHidden !== undefined) filter.isHidden = isHidden === "true";
    if (verifiedPurchase !== undefined)
      filter.verifiedPurchase = verifiedPurchase === "true";
    if (productId) filter.product = productId;

    // Search in title and comment
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { comment: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const sortOptions = { [sort]: sortOrder };

    const reviews = await Review.find(filter)
      .populate("user", "name email")
      .populate("product", "name slug images")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments(filter);

    // Get statistics
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          hiddenReviews: {
            $sum: { $cond: ["$isHidden", 1, 0] },
          },
          verifiedReviews: {
            $sum: { $cond: ["$verifiedPurchase", 1, 0] },
          },
          averageRating: { $avg: "$rating" },
          totalPhotos: { $sum: { $size: "$photos" } },
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
      stats: stats[0] || {
        totalReviews: 0,
        hiddenReviews: 0,
        verifiedReviews: 0,
        averageRating: 0,
        totalPhotos: 0,
      },
    });
  } catch (error) {
    log.error("Get all reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single review by ID (admin)
// @route   GET /api/v1/admin/reviews/:id
// @access  Private/Admin
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate("user", "name email")
      .populate("product", "name slug images");

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    log.error("Get review by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Hide/Unhide a review
// @route   PATCH /api/v1/admin/reviews/:id/toggle-hidden
// @access  Private/Admin
exports.toggleReviewHidden = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    await review.populate("user", "name email");
    await review.populate("product", "name slug");

    res.json({
      message: review.isHidden
        ? "Review hidden successfully"
        : "Review unhidden successfully",
      review,
    });
  } catch (error) {
    log.error("Toggle review hidden error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update admin notes on a review
// @route   PATCH /api/v1/admin/reviews/:id/notes
// @access  Private/Admin
exports.updateReviewNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.adminNotes = adminNotes || "";
    await review.save();

    await review.populate("user", "name email");
    await review.populate("product", "name slug");

    res.json({
      message: "Admin notes updated successfully",
      review,
    });
  } catch (error) {
    log.error("Update review notes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete a review (admin)
// @route   DELETE /api/v1/admin/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Optional: Delete photos from MinIO if they exist
    if (review.photos && review.photos.length > 0) {
      const { deleteObject } = require("../utils/minio");
      for (const photoUrl of review.photos) {
        try {
          // Extract key from URL (format: https://endpoint/bucket/key)
          const urlParts = photoUrl.split("/");
          const key = urlParts.slice(4).join("/"); // Get everything after bucket name
          await deleteObject(key);
        } catch (err) {
          log.error("Error deleting photo from MinIO:", err);
          // Continue even if photo deletion fails
        }
      }
    }

    await review.deleteOne();

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    log.error("Delete review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Bulk hide/unhide reviews
// @route   POST /api/v1/admin/reviews/bulk-hide
// @access  Private/Admin
exports.bulkHideReviews = async (req, res) => {
  try {
    const { reviewIds, hide } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        message: "reviewIds must be a non-empty array",
      });
    }

    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { $set: { isHidden: hide === true } },
    );

    res.json({
      message: `${result.modifiedCount} review(s) ${hide ? "hidden" : "unhidden"} successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    log.error("Bulk hide reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Bulk delete reviews
// @route   POST /api/v1/admin/reviews/bulk-delete
// @access  Private/Admin
exports.bulkDeleteReviews = async (req, res) => {
  try {
    const { reviewIds } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        message: "reviewIds must be a non-empty array",
      });
    }

    // Fetch reviews to find associated photos for MinIO cleanup
    const reviewsWithPhotos = await Review.find({
      _id: { $in: reviewIds },
      'images.0': { $exists: true },
    }).select('images');

    // Collect all MinIO keys to delete
    const keysToDelete = [];
    for (const review of reviewsWithPhotos) {
      for (const img of review.images || []) {
        if (img.publicId) keysToDelete.push(img.publicId);
      }
    }

    // Delete photos from MinIO (best effort, don't block review deletion)
    if (keysToDelete.length > 0) {
      try {
        await deleteObjects(keysToDelete);
      } catch (err) {
        log.error("Failed to delete review photos from MinIO:", err);
      }
    }

    const result = await Review.deleteMany({ _id: { $in: reviewIds } });

    res.json({
      message: `${result.deletedCount} review(s) deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    log.error("Bulk delete reviews error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get review statistics (admin dashboard)
// @route   GET /api/v1/admin/reviews/stats
// @access  Private/Admin
exports.getReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: "$rating" },
                hiddenReviews: {
                  $sum: { $cond: ["$isHidden", 1, 0] },
                },
                verifiedReviews: {
                  $sum: { $cond: ["$verifiedPurchase", 1, 0] },
                },
                totalPhotos: { $sum: { $size: "$photos" } },
                reviewsWithPhotos: {
                  $sum: {
                    $cond: [{ $gt: [{ $size: "$photos" }, 0] }, 1, 0],
                  },
                },
              },
            },
          ],
          byRating: [
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
            {
              $sort: { _id: -1 },
            },
          ],
          recent: [
            {
              $sort: { createdAt: -1 },
            },
            {
              $limit: 5,
            },
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $unwind: "$user",
            },
            {
              $unwind: "$product",
            },
            {
              $project: {
                rating: 1,
                title: 1,
                createdAt: 1,
                isHidden: 1,
                "user.name": 1,
                "product.name": 1,
                "product.slug": 1,
              },
            },
          ],
        },
      },
    ]);

    const result = {
      overall: stats[0].overall[0] || {
        totalReviews: 0,
        averageRating: 0,
        hiddenReviews: 0,
        verifiedReviews: 0,
        totalPhotos: 0,
        reviewsWithPhotos: 0,
      },
      byRating: stats[0].byRating,
      recentReviews: stats[0].recent,
    };

    res.json(result);
  } catch (error) {
    log.error("Get review stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reply to a review (admin reply visible to customers)
// @route   PATCH /api/v1/admin/reviews/:id/reply
// @access  Private/Admin
exports.replyToReview = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.adminReply = {
      text: text.trim(),
      repliedAt: new Date(),
      repliedBy: req.user.id,
    };
    await review.save();

    res.json({ message: "Reply added successfully", review });
  } catch (error) {
    log.error("Reply to review error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete admin reply from a review
// @route   DELETE /api/v1/admin/reviews/:id/reply
// @access  Private/Admin
exports.deleteReply = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.adminReply = undefined;
    await review.save();

    res.json({ message: "Reply deleted", review });
  } catch (error) {
    log.error("Delete reply error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
