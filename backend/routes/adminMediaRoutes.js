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
  optimizeAndUpload,
  getMetadata,
  getOrphanedMedia,
  deleteOrphanedMedia,
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

// POST /api/v1/admin/media/optimize - Optimize image + generate variants
router.post("/optimize", upload.single("image"), optimizeAndUpload);

// POST /api/v1/admin/media/metadata - Get image metadata
router.post("/metadata", upload.single("image"), getMetadata);

// GET /api/v1/admin/media/orphaned - Get orphaned media files
router.get("/orphaned", getOrphanedMedia);

// DELETE /api/v1/admin/media/orphaned/bulk - Bulk delete orphaned files
router.delete("/orphaned/bulk", deleteOrphanedMedia);

module.exports = router;
