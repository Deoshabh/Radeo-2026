const multer = require("multer");
const crypto = require("crypto");

/**
 * Multer configuration for review photo uploads
 * Stores files in memory as Buffer for direct MinIO upload
 */

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      ),
      false,
    );
  }
};

// Memory storage for direct upload to MinIO
const storage = multer.memoryStorage();

// Configure multer for review photos
const uploadReviewPhotos = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 2, // Maximum 2 files
  },
});

/**
 * Generate unique filename for review photo
 * Format: reviews/{userId}/{productId}/{timestamp}-{random}.{ext}
 */
function generateReviewPhotoKey(userId, productId, originalName) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const ext = originalName.split(".").pop().toLowerCase();
  return `reviews/${userId}/${productId}/${timestamp}-${randomString}.${ext}`;
}

module.exports = {
  uploadReviewPhotos,
  generateReviewPhotoKey,
};
