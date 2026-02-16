const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB per frame
});

const {
  getUploadUrl,
  deleteMedia,
  uploadFrames,
  getFrameManifest,
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

// POST /api/v1/admin/media/frames - Upload 360 viewer frames
router.post("/frames", upload.array("frames", 72), uploadFrames);

// GET /api/v1/admin/media/frames/:slug/manifest - Get cached frame manifest
router.get("/frames/:slug/manifest", getFrameManifest);

module.exports = router;
