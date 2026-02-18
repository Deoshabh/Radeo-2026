const express = require("express");
const router = express.Router();
const {
  getAllReviews,
  getReviewById,
  toggleReviewHidden,
  updateReviewNotes,
  deleteReview,
  bulkHideReviews,
  bulkDeleteReviews,
  getReviewStats,
  replyToReview,
  deleteReply,
} = require("../controllers/adminReviewController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// All routes require authentication and admin role
router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/reviews/stats
router.get("/stats", getReviewStats);

// @route   GET /api/v1/admin/reviews
router.get("/", getAllReviews);

// @route   GET /api/v1/admin/reviews/:id
router.get("/:id", getReviewById);

// @route   PATCH /api/v1/admin/reviews/:id/toggle-hidden
router.patch("/:id/toggle-hidden", toggleReviewHidden);

// @route   PATCH /api/v1/admin/reviews/:id/notes
router.patch("/:id/notes", updateReviewNotes);

// @route   PATCH /api/v1/admin/reviews/:id/reply
router.patch("/:id/reply", replyToReview);

// @route   DELETE /api/v1/admin/reviews/:id/reply
router.delete("/:id/reply", deleteReply);

// @route   DELETE /api/v1/admin/reviews/:id
router.delete("/:id", deleteReview);

// @route   POST /api/v1/admin/reviews/bulk-hide
router.post("/bulk-hide", bulkHideReviews);

// @route   POST /api/v1/admin/reviews/bulk-delete
router.post("/bulk-delete", bulkDeleteReviews);

module.exports = router;
