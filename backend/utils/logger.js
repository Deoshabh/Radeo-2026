const morgan = require("morgan");

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
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify({ level: "info", message, ...data, timestamp: new Date().toISOString() }));
    } else {
      console.log(`[${new Date().toISOString()}] ℹ️  INFO: ${message}`, data);
    }
  },

  error: (message, error = {}) => {
    if (process.env.NODE_ENV === "production") {
      console.error(JSON.stringify({ 
        level: "error", 
        message, 
        error: error.message, 
        stack: error.stack, 
        timestamp: new Date().toISOString() 
      }));
    } else {
      console.error(`[${new Date().toISOString()}] ❌ ERROR: ${message}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  },

  warn: (message, data = {}) => {
    if (process.env.NODE_ENV === "production") {
      console.warn(JSON.stringify({ level: "warn", message, ...data, timestamp: new Date().toISOString() }));
    } else {
      console.warn(`[${new Date().toISOString()}] ⚠️  WARN: ${message}`, data);
    }
  },

  success: (message, data = {}) => {
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify({ level: "success", message, ...data, timestamp: new Date().toISOString() }));
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
};
