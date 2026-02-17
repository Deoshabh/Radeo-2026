const Minio = require("minio");

/**
 * ===============================
 * S3-Compatible Object Storage Configuration
 * ===============================
 * Supports: RustFS, MinIO, AWS S3, or any S3-compatible storage
 * Uses ONLY environment variables
 * No silent fallbacks in production
 *
 * Note: Despite using "MINIO_*" env var names, this works with ANY S3-compatible storage
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
    console.log("🪣 Initializing S3-compatible storage client...");
    console.log("📡 Endpoint:", MINIO_ENDPOINT);
    console.log("🔐 Port:", MINIO_PORT);
    console.log("🔐 SSL:", MINIO_USE_SSL);
    console.log(
      "🔑 Access Key:",
      MINIO_ACCESS_KEY ? "***" + MINIO_ACCESS_KEY.slice(-4) : "NOT SET",
    );



    const useSSL = String(MINIO_USE_SSL).toLowerCase() === "true";

    minioClient = new Minio.Client({
      endPoint: MINIO_ENDPOINT,
      port: Number(MINIO_PORT),
      useSSL: useSSL,
      accessKey: MINIO_ACCESS_KEY,
      secretKey: MINIO_SECRET_KEY,
    });

    console.log(
      `🔍 Testing connection to ${useSSL ? "https" : "http"}://${MINIO_ENDPOINT}:${MINIO_PORT}`,
    );

    // Check bucket
    const exists = await minioClient.bucketExists(MINIO_BUCKET);
    if (!exists) {
      console.log(`📦 Bucket '${MINIO_BUCKET}' does not exist, creating...`);
      await minioClient.makeBucket(MINIO_BUCKET, REGION);
      console.log(`✅ Bucket created: ${MINIO_BUCKET}`);
    } else {
      console.log(`✅ Bucket exists: ${MINIO_BUCKET}`);
    }

    // Public read policy
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(MINIO_BUCKET, JSON.stringify(policy));

    console.log("✅ Storage bucket policy set (public read)");
    isInitialized = true;
  } catch (error) {
    console.error("❌ S3 storage initialization failed:");
    console.error("  Error Code:", error.code);
    console.error("  Error Message:", error.message);
    console.error("  Status Code:", error.statusCode);
    console.error("  Full Error:", JSON.stringify(error, null, 2));
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

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (!allowedTypes.includes(contentType.toLowerCase())) {
    throw new Error("Invalid file type");
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
 * Uses MINIO_PUBLIC_URL if set (recommended for Docker/internal networking)
 * Falls back to constructing URL from MINIO_ENDPOINT
 */
function getPublicUrl(key) {
  if (MINIO_PUBLIC_URL) {
    // Remove trailing slash if present
    const baseUrl = MINIO_PUBLIC_URL.replace(/\/$/, "");
    return `${baseUrl}/${MINIO_BUCKET}/${key}`;
  }
  const useSSL = String(MINIO_USE_SSL).toLowerCase() === "true";
  const protocol = useSSL ? "https" : "http";
  return `${protocol}://${MINIO_ENDPOINT}/${MINIO_BUCKET}/${key}`;
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
};
