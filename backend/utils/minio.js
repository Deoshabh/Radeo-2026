const Minio = require("minio");

/**
 * MinIO Configuration with safe fallback defaults
 * Always initializes client to prevent runtime errors
 */
const MINIO_CONFIG = {
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT, 10) || 9000,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
};

const BUCKET_NAME = process.env.MINIO_BUCKET || "product-media";
const REGION = process.env.MINIO_REGION || "us-east-1";

// Always initialize MinIO client with fallback defaults
const minioClient = new Minio.Client(MINIO_CONFIG);

// Track initialization state
let isInitialized = false;
let initializationError = null;

/**
 * Initialize MinIO bucket with public read policy
 * Safe to call multiple times - tracks initialization state
 */
async function initializeBucket() {
  // Return immediately if already initialized
  if (isInitialized) {
    return;
  }

  // Return cached error if previous initialization failed
  if (initializationError) {
    throw initializationError;
  }

  try {
    // Test connection by checking bucket existence
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);

    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, REGION);
      console.log(`✅ MinIO: Bucket '${BUCKET_NAME}' created successfully`);
    } else {
      console.log(`✅ MinIO: Bucket '${BUCKET_NAME}' already exists`);
    }

    // Set bucket policy to allow public read access
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`✅ MinIO: Bucket policy set to public read`);

    isInitialized = true;
  } catch (error) {
    initializationError = error;
    console.error("❌ MinIO initialization error:", error.message);
    throw error;
  }
}

/**
 * Generate a signed URL for uploading files
 * @param {string} key - Object key (path) in MinIO
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<{signedUrl: string, publicUrl: string}>}
 */
async function generateSignedUploadUrl(key, contentType) {
  // Defensive check: Ensure MinIO is initialized
  if (!isInitialized) {
    throw new Error(
      "MinIO not initialized. Please ensure initializeBucket() was called at startup."
    );
  }

  try {
    // Validate content type (whitelist)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
    }

    // Generate signed PUT URL (5 minutes expiry)
    const signedUrl = await minioClient.presignedPutObject(
      BUCKET_NAME,
      key,
      5 * 60, // 5 minutes
      { "Content-Type": contentType }
    );

    // Generate public URL
    const publicUrl = getPublicUrl(key);

    return {
      signedUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error("❌ Error generating signed upload URL:", error.message);
    throw error;
  }
}

/**
 * Delete an object from MinIO
 * @param {string} key - Object key to delete
 * @returns {Promise<void>}
 */
async function deleteObject(key) {
  // Defensive check: Ensure MinIO is initialized
  if (!isInitialized) {
    throw new Error(
      "MinIO not initialized. Please ensure initializeBucket() was called at startup."
    );
  }

  try {
    await minioClient.removeObject(BUCKET_NAME, key);
    console.log(`✅ Object '${key}' deleted successfully`);
  } catch (error) {
    console.error(`❌ Error deleting object '${key}':`, error.message);
    throw error;
  }
}

/**
 * Get public URL for an object
 * @param {string} key - Object key
 * @returns {string} Public URL
 */
function getPublicUrl(key) {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const port =
    process.env.MINIO_PORT &&
    process.env.MINIO_PORT !== "80" &&
    process.env.MINIO_PORT !== "443"
      ? `:${process.env.MINIO_PORT}`
      : "";

  return `${protocol}://${process.env.MINIO_ENDPOINT}${port}/${BUCKET_NAME}/${key}`;
}

/**
 * Delete multiple objects from MinIO
 * @param {string[]} keys - Array of object keys to delete
 * @returns {Promise<void>}
 */
async function deleteObjects(keys) {
  // Defensive check: Ensure MinIO is initialized
  if (!isInitialized) {
    throw new Error(
      "MinIO not initialized. Please ensure initializeBucket() was called at startup."
    );
  }

  try {
    await minioClient.removeObjects(BUCKET_NAME, keys);
    console.log(`✅ ${keys.length} objects deleted successfully`);
  } catch (error) {
    console.error(`❌ Error deleting ${keys.length} objects:`, error.message);
    throw error;
  }
}

module.exports = {
  minioClient,
  initializeBucket,
  generateSignedUploadUrl,
  deleteObject,
  deleteObjects,
  getPublicUrl,
  BUCKET_NAME,
};
