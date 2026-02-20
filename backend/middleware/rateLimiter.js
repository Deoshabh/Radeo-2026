const rateLimit = require("express-rate-limit");
const { log } = require("../utils/logger");

// ──────────────────────────────────────────────
// Redis store (optional — falls back to memory)
// ──────────────────────────────────────────────
let RedisStore;
let redisStoreInstance;

try {
  const { RedisStore: RS } = require("rate-limit-redis");
  const { cacheClient } = require("../config/redis");

  RedisStore = RS;

  // Factory: creates a new RedisStore for each limiter (rate-limit-redis v4
  // requires a unique prefix per limiter to avoid key collisions).
  const createRedisStore = (prefix) =>
    new RedisStore({
      sendCommand: (...args) => cacheClient.call(...args),
      prefix: `rl:${prefix}:`,
    });

  redisStoreInstance = createRedisStore;
  log.info("Rate-limit Redis store loaded");
} catch {
  log.warn("rate-limit-redis not available — falling back to in-memory store");
}

// ──────────────────────────────────────────────
// Limiters
// ──────────────────────────────────────────────

/** General API limiter — 100 req / 15 min per IP */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
  ...(redisStoreInstance ? { store: redisStoreInstance("general") } : {}),
});

/** Auth endpoints — 10 req / 15 min per IP */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many auth attempts, please try again after 15 minutes" },
  ...(redisStoreInstance ? { store: redisStoreInstance("auth") } : {}),
});

/** Higher-throughput API limiter — 200 req / 15 min per IP */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Rate limit exceeded" },
  ...(redisStoreInstance ? { store: redisStoreInstance("api") } : {}),
});

module.exports = { generalLimiter, authLimiter, apiLimiter };
