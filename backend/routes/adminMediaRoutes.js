const express = require("express");
const router = express.Router();
const {
  getUploadUrl,
  deleteMedia,
} = require("../controllers/adminMediaController");
const { authenticate } = require("../middleware/auth");
const admin = require("../middleware/admin");

// All routes require admin authentication
router.use(authenticate);
router.use(admin);

// POST /api/v1/admin/media/upload-url - Generate signed upload URL
router.post("/upload-url", getUploadUrl);

// DELETE /api/v1/admin/media - Delete media object
router.delete("/", deleteMedia);

module.exports = router;
