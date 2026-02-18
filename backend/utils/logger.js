const morgan = require("morgan");
const { AsyncLocalStorage } = require("async_hooks");

/* ─── Optional Loki push (enabled when LOKI_HOST is set) ─── */
let lokiPush = null;
if (process.env.LOKI_HOST) {
  try {
    const http = require("http");
    const LOKI_URL = `${process.env.LOKI_HOST}/loki/api/v1/push`;

    // Batched push — flushes every 2 s or 50 entries
    const batch = [];
    const FLUSH_INTERVAL = 2000;
    const FLUSH_SIZE = 50;

    const flush = () => {
      if (batch.length === 0) return;
      const entries = batch.splice(0, batch.length);
      const payload = JSON.stringify({
        streams: [{
          stream: { app: "radeo-backend", env: process.env.NODE_ENV || "development" },
          values: entries.map(e => [String(e.ts * 1_000_000), e.line]),
        }],
      });
      const url = new URL(LOKI_URL);
      const req = http.request({
        hostname: url.hostname, port: url.port || 3100,
        path: url.pathname, method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      req.on("error", () => {}); // swallow — logging must never crash the app
      req.end(payload);
    };

    setInterval(flush, FLUSH_INTERVAL).unref();

    lokiPush = (line) => {
      batch.push({ ts: Date.now(), line });
      if (batch.length >= FLUSH_SIZE) flush();
    };
  } catch (_) {
    // Loki push setup failed — continue without it
  }
}

/**
 * AsyncLocalStorage for request context (requestId).
 * Accessible from anywhere without passing req around.
 */
const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Middleware: stores request context (id) in AsyncLocalStorage
 * so log.* calls anywhere in the call chain can include requestId.
 */
function requestContext(req, _res, next) {
  const store = { requestId: req.id || "-" };
  asyncLocalStorage.run(store, next);
}

function getRequestId() {
  const store = asyncLocalStorage.getStore();
  return store ? store.requestId : undefined;
}

/**
 * HTTP Request Logger Configuration
 * Uses Morgan for HTTP request logging
 * 
 * Production: JSON format to stdout (for Docker/K8s/Dokploy)
 * Development: Colored text format
 */

// Custom token for response time
morgan.token("response-time-ms", (req, res) => {
  if (!req._startAt || !res._startAt) return;
  const ms =
    (res._startAt[0] - req._startAt[0]) * 1000 +
    (res._startAt[1] - req._startAt[1]) / 1000000;
  return ms.toFixed(2);
});

// JSON format for production
const jsonFormat = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    content_length: tokens.res(req, res, 'content-length'),
    response_time: Number(tokens['response-time-ms'](req, res)),
    remote_addr: tokens['remote-addr'](req, res),
    user_agent: tokens['user-agent'](req, res),
    request_id: req.id || "-",
    timestamp: new Date().toISOString(),
  });
};

// Console logger (Environment aware)
const requestLogger = process.env.NODE_ENV === "production" 
  ? morgan(jsonFormat)
  : morgan("dev");

// Middleware wrapper
const logger = (req, res, next) => {
  // Skip OPTIONS and health checks to force reduce noise
  if (req.method === "OPTIONS" || req.url === "/api/health") {
    return next();
  }
  requestLogger(req, res, next);
};

/**
 * Custom logger for application events
 * Logs to stdout/stderr in JSON (Prod) or Text (Dev)
 */
const log = {
  info: (message, data = {}) => {
    const rid = getRequestId();
    if (process.env.NODE_ENV === "production") {
      const line = JSON.stringify({ level: "info", message, ...(rid && { request_id: rid }), ...data, timestamp: new Date().toISOString() });
      console.log(line);
      if (lokiPush) lokiPush(line);
    } else {
      console.log(`[${new Date().toISOString()}] ℹ️  INFO: ${message}`, data);
    }
  },

  error: (message, error = {}) => {
    const rid = getRequestId();
    if (process.env.NODE_ENV === "production") {
      const line = JSON.stringify({ 
        level: "error", 
        message, 
        ...(rid && { request_id: rid }),
        error: error.message, 
        stack: error.stack, 
        timestamp: new Date().toISOString() 
      });
      console.error(line);
      if (lokiPush) lokiPush(line);
    } else {
      console.error(`[${new Date().toISOString()}] ❌ ERROR: ${message}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  },

  warn: (message, data = {}) => {
    const rid = getRequestId();
    if (process.env.NODE_ENV === "production") {
      const line = JSON.stringify({ level: "warn", message, ...(rid && { request_id: rid }), ...data, timestamp: new Date().toISOString() });
      console.warn(line);
      if (lokiPush) lokiPush(line);
    } else {
      console.warn(`[${new Date().toISOString()}] ⚠️  WARN: ${message}`, data);
    }
  },

  success: (message, data = {}) => {
    const rid = getRequestId();
    if (process.env.NODE_ENV === "production") {
      const line = JSON.stringify({ level: "success", message, ...(rid && { request_id: rid }), ...data, timestamp: new Date().toISOString() });
      console.log(line);
      if (lokiPush) lokiPush(line);
    } else {
      console.log(`[${new Date().toISOString()}] ✅ SUCCESS: ${message}`, data);
    }
  },

  debug: (message, data = {}) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[${new Date().toISOString()}] 🐛 DEBUG: ${message}`, data);
    }
  },
};

module.exports = {
  logger,
  log,
  requestContext,
  getRequestId,
};
