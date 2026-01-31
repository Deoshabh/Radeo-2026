const { generateSignedUploadUrl, deleteObject } = require("../utils/minio");

/**
 * Generate signed upload URL for admin
 * POST /api/v1/admin/media/upload-url
 */
exports.getUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, productSlug } = req.body;

    // Validate input
    if (!fileName || !fileType || !productSlug) {
      return res.status(400).json({
        success: false,
        message: "fileName, fileType, and productSlug are required",
      });
    }

    // Validate file size (if provided)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.body.fileSize && req.body.fileSize > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit",
      });
    }

    // Sanitize filename
    const sanitizedFileName = fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");

    // Generate unique object key
    const timestamp = Date.now();
    const key = `products/${productSlug}/${timestamp}-${sanitizedFileName}`;

    // Generate signed URL
    const result = await generateSignedUploadUrl(key, fileType);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate upload URL",
    });
  }
};

/**
 * Delete media object from MinIO
 * DELETE /api/v1/admin/media
 */
exports.deleteMedia = async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Object key is required",
      });
    }

    await deleteObject(key);

    res.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting media:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete media",
    });
  }
};
