/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent error responses
 * Envelope: { success: false, message, errors?, timestamp }
 */

const { log } = require("../utils/logger");

// Not Found Handler - 404
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  // ── Ensure CORS headers are present even on error responses ──
  // When the error handler runs, the cors middleware may not have set
  // headers yet (e.g. on a CORS origin callback error).  Re-apply them
  // so the browser can still read the JSON error body.
  const origin = req.headers.origin;
  if (origin && !res.headersSent) {
    // Mirror the origin if it was allowed (simple check)
    const allowed = [
      'https://radeo.in',
      'https://www.radeo.in',
      process.env.FRONTEND_URL,
      ...(process.env.CORS_ALLOWED_ORIGINS ? process.env.CORS_ALLOWED_ORIGINS.split(',') : []),
    ].filter(Boolean);
    if (allowed.includes(origin) || process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  // Log error for debugging
  // Filter out bot noise / known scanners
  const ignorePatterns = [
    "wp-includes",
    "wp-admin",
    "wlwmanifest.xml",
    ".php",
    ".env",
    ".git",
    "xmlrpc.php",
  ];

  const isBotProbe = ignorePatterns.some((pattern) =>
    req.originalUrl.includes(pattern),
  );

  // Log error for debugging, unless it's a known bot probe returning 404
  if (!isBotProbe || res.statusCode !== 404) {
    log.error("Request error", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      path: req.path,
      method: req.method,
    });
  }

  // Default status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const timestamp = new Date().toISOString();
  const devStack = process.env.NODE_ENV === "development" ? err.stack : undefined;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
      timestamp,
      stack: devStack,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      errors: [{ field, message: `${field} already exists` }],
      timestamp,
      stack: devStack,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      timestamp,
      stack: devStack,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      timestamp,
      stack: devStack,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      timestamp,
      stack: devStack,
    });
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
      timestamp,
      stack: devStack,
    });
  }

  // CORS errors
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "CORS policy violation",
      timestamp,
      stack: devStack,
    });
  }

  // Rate limit errors
  if (err.message && err.message.includes("Too many requests")) {
    return res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      timestamp,
      stack: devStack,
    });
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    timestamp,
    stack: devStack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
