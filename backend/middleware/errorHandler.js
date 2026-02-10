/**
 * Global Error Handling Middleware
 * Catches all errors and returns consistent error responses
 */

// Not Found Handler - 404
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
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
    console.error("❌ Error:", {
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      path: req.path,
      method: req.method,
    });
  }

  // Default status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(400).json({
      message: "Validation failed",
      errors,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} already exists`,
      field,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      message: "Invalid token",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      message: "Token expired",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    return res.status(400).json({
      message: "Validation failed",
      errors,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // CORS errors
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      message: "CORS policy violation",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Rate limit errors
  if (err.message && err.message.includes("Too many requests")) {
    return res.status(429).json({
      message: "Too many requests, please try again later",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Default error response
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

// Async handler wrapper to catch errors in async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
