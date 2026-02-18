/**
 * Environment Variable Validation
 * Uses Zod to validate ALL required env vars at startup.
 * Server refuses to start if any variable is missing.
 */

const { z } = require("zod");

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),

  // Database
  MONGO_URI: z.string().min(1, "MONGO_URI is required"),

  // Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_SECRET_PREVIOUS: z.string().optional(), // For JWT rotation window

  // Redis / Valkey
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // S3-Compatible Storage (MinIO / R2)
  MINIO_ENDPOINT: z.string().min(1, "MINIO_ENDPOINT is required"),
  MINIO_PORT: z.string().default("9000"),
  MINIO_USE_SSL: z.string().default("false"),
  MINIO_ACCESS_KEY: z.string().min(1, "MINIO_ACCESS_KEY is required"),
  MINIO_SECRET_KEY: z.string().min(1, "MINIO_SECRET_KEY is required"),
  MINIO_BUCKET: z.string().min(1, "MINIO_BUCKET is required"),
  MINIO_REGION: z.string().default("us-east-1"),
  MINIO_PUBLIC_URL: z.string().optional(),
  MINIO_CDN_URL: z.string().optional(), // e.g. https://cdn.radeo.in

  // Payment
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(), // Set in Razorpay Dashboard → Webhooks

  // Shipping
  SHIPROCKET_EMAIL: z.string().email("SHIPROCKET_EMAIL must be a valid email"),
  SHIPROCKET_PASSWORD: z.string().min(1, "SHIPROCKET_PASSWORD is required"),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().default("radeo-2026"),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),

  // Cloudflare Turnstile (replaces reCAPTCHA)
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // CORS
  FRONTEND_URL: z.string().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),

  // Pusher (real-time notifications)
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
});

/**
 * Parse and validate environment variables.
 * Call at server startup — throws with clear error listing missing vars.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    );
    console.error(
      "\n❌ Environment validation failed:\n" + errors.join("\n") + "\n",
    );
    process.exit(1);
  }

  return result.data;
}

/**
 * Returns which env vars are set (true/false) without exposing values.
 * For admin-only /api/health/config endpoint.
 */
function getEnvStatus() {
  const keys = Object.keys(envSchema.shape);
  const status = {};
  for (const key of keys) {
    status[key] = Boolean(process.env[key]);
  }
  return status;
}

module.exports = { validateEnv, getEnvStatus, envSchema };
