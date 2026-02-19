const Minio = require("minio");
const { log } = require("./logger");

/**
 * ===============================
 * S3-Compatible Object Storage Configuration
 * ===============================
 * Supports: RustFS, MinIO, AWS S3, Cloudflare R2, or any S3-compatible storage
 *
 * Bucket structure:
 *   radeo-products  — product images (public read, versioned)
 *   radeo-media     — CMS media uploads (public read, versioned)
 *   radeo-reviews   — customer review photos (private)
 *   radeo-temp      — pre-signed upload staging (auto-deleted after 24h)
 */
const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_REGION,
  MINIO_PUBLIC_URL,
  MINIO_CDN_URL,
} = process.env;

if (
  !MINIO_ENDPOINT ||
  !MINIO_PORT ||
  !MINIO_ACCESS_KEY ||
  !MINIO_SECRET_KEY ||
  !MINIO_BUCKET
) {
  throw new Error(
    "❌ Missing required S3 storage environment variables (MINIO_*)",
  );
}

/** Bucket name constants */
const BUCKETS = {
  PRODUCTS: process.env.MINIO_BUCKET_PRODUCTS || "radeo-products",
  MEDIA: process.env.MINIO_BUCKET_MEDIA || "radeo-media",
  REVIEWS: process.env.MINIO_BUCKET_REVIEWS || "radeo-reviews",
  TEMP: process.env.MINIO_BUCKET_TEMP || "radeo-temp",
  /** Legacy default bucket — for backward compatibility */
  DEFAULT: MINIO_BUCKET,
};

/** CDN base URL — serves images via Cloudflare edge cache (e.g. https://cdn.radeo.in) */
const CDN_BASE_URL = (MINIO_CDN_URL || MINIO_PUBLIC_URL || "").replace(/\/$/, "");

const REGION = MINIO_REGION || "us-east-1";

// Internal state
let minioClient = null;
let isInitialized = false;

/**
 * Initialize S3 bucket and policy
 * Works with RustFS, MinIO, AWS S3, or any S3-compatible storage
 * MUST be called before server starts
 */
async function initializeBucket() {
  if (isInitialized) return;

  try {
    log.info("Initializing S3-compatible storage client...", {
      endpoint: MINIO_ENDPOINT,
      port: MINIO_PORT,
      ssl: MINIO_USE_SSL,
    });

    const useSSL = String(MINIO_USE_SSL).toLowerCase() === "true";

    minioClient = new Minio.Client({
      endPoint: MINIO_ENDPOINT,
      port: Number(MINIO_PORT),
      useSSL: useSSL,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });

    log.info(
      `Testing connection to ${useSSL ? "https" : "http"}://${MINIO_ENDPOINT}:${MINIO_PORT}`,
    );

    // Ensure all buckets exist with appropriate policies
    for (const [label, bucketName] of Object.entries(BUCKETS)) {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        log.info(`Bucket '${bucketName}' does not exist, creating...`);
        await minioClient.makeBucket(bucketName, REGION);
        log.success(`Bucket created: ${bucketName}`);
      } else {
        log.info(`Bucket exists: ${bucketName}`);
      }

      // Public read policy for PRODUCTS, MEDIA, DEFAULT; private for REVIEWS, TEMP
      if (label === "PRODUCTS" || label === "MEDIA" || label === "DEFAULT") {
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      }
    }

    log.success("Storage bucket initialization complete");
    isInitialized = true;
  } catch (error) {
    log.error("S3 storage initialization failed", {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });
    throw error;
  }
}

/**
 * Internal guard
 */
function requireInitialized() {
  if (!isInitialized || !minioClient) {
    throw new Error("MinIO not initialized. Server should not have started.");
  }
}

/**
 * Generate signed upload URL
 */
async function generateSignedUploadUrl(key, contentType) {
  requireInitialized();

  const allowedTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "video/mp4", "video/webm",
  ];

  if (!allowedTypes.includes(contentType.toLowerCase())) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, WebP, MP4, WebM");
  }

  const signedUrl = await minioClient.presignedPutObject(
    MINIO_BUCKET,
    key,
    5 * 60,
    { "Content-Type": contentType },
  );

  return {
    signedUrl,
    publicUrl: getPublicUrl(key),
    key,
  };
}

/**
 * Delete one object
 */
async function deleteObject(key) {
  requireInitialized();
  await minioClient.removeObject(MINIO_BUCKET, key);
}

/**
 * Delete multiple objects
 */
async function deleteObjects(keys) {
  requireInitialized();
  await minioClient.removeObjects(MINIO_BUCKET, keys);
}

/**
 * Public URL
 * Prefers MINIO_CDN_URL (Cloudflare-fronted), then MINIO_PUBLIC_URL, then direct
 */
function getPublicUrl(key, bucket = MINIO_BUCKET) {
  if (CDN_BASE_URL) {
    return `${CDN_BASE_URL}/${bucket}/${key}`;
  }
  if (MINIO_PUBLIC_URL) {
    const baseUrl = MINIO_PUBLIC_URL.replace(/\/$/, "");
    return `${baseUrl}/${bucket}/${key}`;
  }
  const useSSL = String(MINIO_USE_SSL).toLowerCase() === "true";
  const protocol = useSSL ? "https" : "http";
  return `${protocol}://${MINIO_ENDPOINT}/${bucket}/${key}`;
}

/**
 * Upload buffer directly to MinIO
 * @param {Buffer} buffer - File buffer
 * @param {string} key - Object key/path
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL
 */
async function uploadBuffer(buffer, key, contentType) {
  requireInitialized();

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/mpeg",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedTypes.includes(contentType.toLowerCase())) {
    throw new Error(
      "Invalid file type. Allowed types: Images, Videos, PDFs, Docs.",
    );
  }

  const metadata = {
    "Content-Type": contentType,
  };

  await minioClient.putObject(
    MINIO_BUCKET,
    key,
    buffer,
    buffer.length,
    metadata,
  );
  return getPublicUrl(key);
}

/**
 * Runtime storage health check
 */
async function getStorageHealth() {
  const details = {
    endpoint: MINIO_ENDPOINT,
    bucket: MINIO_BUCKET,
    initialized: isInitialized,
  };

  if (!isInitialized || !minioClient) {
    return {
      status: "disconnected",
      details,
    };
  }

  try {
    const bucketExists = await minioClient.bucketExists(MINIO_BUCKET);
    return {
      status: bucketExists ? "operational" : "degraded",
      details: {
        ...details,
        bucketExists,
      },
    };
  } catch (error) {
    return {
      status: "error",
      details: {
        ...details,
        error: error.message,
      },
    };
  }
}

module.exports = {
  initializeBucket,
  generateSignedUploadUrl,
  deleteObject,
  deleteObjects,
  getPublicUrl,
  uploadBuffer,
  getStorageHealth,
  BUCKETS,
};
