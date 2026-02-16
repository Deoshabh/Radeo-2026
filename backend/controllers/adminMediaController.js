const { generateSignedUploadUrl, deleteObject, uploadBuffer } = require("../utils/minio");
const sharp = require("sharp");
const Product = require("../models/Product");
const { getOrSetCache, invalidateCache } = require("../utils/cache");

/**
 * Generate signed upload URL for admin
 * POST /api/v1/admin/media/upload-url
 */
exports.getUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, productSlug } = req.body;
    
    console.log("Values:" , req.body); // Debug log

    // Validate input
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileName and fileType are required",
      });
    }

    // Use provided slug or default to 'uploads'
    const folder = productSlug || 'uploads';

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
    const key = `products/${folder}/${timestamp}-${sanitizedFileName}`;

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

/**
 * Upload 360 viewer frames
 * POST /api/v1/admin/media/frames
 * Expects multipart/form-data with "frames" array
 */
exports.uploadFrames = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No frames uploaded",
      });
    }

    const { productSlug } = req.body;
    const folder = productSlug || "uploads";
    const timestamp = Date.now();

    // Process each frame
    // We run sequentially to maintain order if needed, but Promise.all is faster
    // Naming convention: frame_01.webp, frame_02.webp, etc.
    const uploadPromises = req.files.map(async (file, index) => {
      // 1. Process with Sharp
      const processedBuffer = await sharp(file.buffer)
        .resize(1500, 1500, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 }) // WebP conversion
        .toBuffer();

      // 2. Generate key
      // Sortable filename: frame_001.webp, frame_002.webp
      const sequenceNum = String(index + 1).padStart(3, "0");
      const key = `products/${folder}/360/${timestamp}/frame_${sequenceNum}.webp`;

      // 3. Upload to MinIO
      const url = await uploadBuffer(processedBuffer, key, "image/webp");
      
      // Return details
      return {
        index,
        url,
        key
      };
    });

    const results = await Promise.all(uploadPromises);

    // Sort by index to ensure order matches input
    results.sort((a, b) => a.index - b.index);
    const urls = results.map(r => r.url);

    if (productSlug) {
      await invalidateCache(`frame-manifest:${productSlug}`);
    }

    res.json({
      success: true,
      message: `Successfully uploaded ${urls.length} frames`,
      data: {
        frames: urls,
        folder: `products/${folder}/360/${timestamp}`
      },
    });
  } catch (error) {
    console.error("Error uploading frames:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload frames",
    });
  }
};

/**
 * Get 360 frame manifest for a product (cached in Redis)
 * GET /api/v1/admin/media/frames/:slug/manifest
 */
exports.getFrameManifest = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
    }

    const cacheKey = `frame-manifest:${slug}`;

    const manifest = await getOrSetCache(
      cacheKey,
      async () => {
        const product = await Product.findOne({ slug }).select("slug images360 updatedAt").lean();

        if (!product) {
          return null;
        }

        const frames = (product.images360 || [])
          .slice()
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((frame, index) => ({
            index,
            order: frame.order || index,
            url: frame.url,
            key: frame.key,
          }));

        return {
          slug: product.slug,
          frameCount: frames.length,
          frames,
          updatedAt: product.updatedAt,
        };
      },
      600,
    );

    if (!manifest) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: manifest,
    });
  } catch (error) {
    console.error("Error fetching frame manifest:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch frame manifest",
    });
  }
};
