const Minio = require("minio");

/**
 * ===============================
 * MinIO Configuration (STRICT)
 * ===============================
 * Uses ONLY environment variables
 * No silent fallbacks in production
 */
const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_REGION,
} = process.env;

if (
  !MINIO_ENDPOINT ||
  !MINIO_PORT ||
  !MINIO_ACCESS_KEY ||
  !MINIO_SECRET_KEY ||
  !MINIO_BUCKET
) {
  throw new Error("❌ Missing required MinIO environment variables");
}

const REGION = MINIO_REGION || "us-east-1";

// Internal state
let minioClient = null;
let isInitialized = false;

/**
 * Initialize MinIO bucket and policy
 * MUST be called before server starts
 */
async function initializeBucket() {
  if (isInitialized) return;

  console.log("🪣 Initializing MinIO client...");
  console.log("📡 Endpoint:", MINIO_ENDPOINT);
  console.log("🔐 SSL:", MINIO_USE_SSL);

  minioClient = new Minio.Client({
    endPoint: MINIO_ENDPOINT,
    port: Number(MINIO_PORT),
    useSSL: MINIO_USE_SSL === "true",
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
  });

  // Check bucket
  const exists = await minioClient.bucketExists(MINIO_BUCKET);
  if (!exists) {
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

  console.log("✅ MinIO bucket policy set (public read)");
  isInitialized = true;
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
 * Public URL (HTTPS safe)
 */
function getPublicUrl(key) {
  return `https://${MINIO_ENDPOINT}/${MINIO_BUCKET}/${key}`;
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

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(contentType.toLowerCase())) {
    throw new Error(
      "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
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

module.exports = {
  initializeBucket,
  generateSignedUploadUrl,
  deleteObject,
  deleteObjects,
  getPublicUrl,
  uploadBuffer,
};
