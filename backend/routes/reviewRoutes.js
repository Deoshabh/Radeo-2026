const express = require("express");
const router = express.Router();
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getMyReviews,
  uploadReviewPhotos,
} = require("../controllers/reviewController");
const { authenticate } = require("../middleware/auth");
const {
  uploadReviewPhotos: uploadMiddleware,
} = require("../middleware/uploadReviewPhotos");

// Public routes
// @route   GET /api/v1/products/:productId/reviews
router.get("/products/:productId/reviews", getProductReviews);

// Protected routes (require authentication)
// @route   POST /api/v1/products/:productId/reviews (with photo upload support)
router.post(
  "/products/:productId/reviews",
  authenticate,
  uploadMiddleware.array("photos", 2), // Max 2 photos
  createReview,
);

// @route   GET /api/v1/reviews/me
router.get("/reviews/me", authenticate, getMyReviews);

// @route   PATCH /api/v1/reviews/:id (with photo upload support)
router.patch(
  "/reviews/:id",
  authenticate,
  uploadMiddleware.array("photos", 2), // Max 2 additional photos
  updateReview,
);

// @route   DELETE /api/v1/reviews/:id
router.delete("/reviews/:id", authenticate, deleteReview);

// @route   POST /api/v1/reviews/:id/helpful
router.post("/reviews/:id/helpful", authenticate, markReviewHelpful);

// @route   POST /api/v1/reviews/upload-photos (deprecated)
router.post("/reviews/upload-photos", authenticate, uploadReviewPhotos);

module.exports = router;
