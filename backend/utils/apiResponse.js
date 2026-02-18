// ===============================
// API Response Helpers
// Ensures consistent { success, message, data/errors, timestamp } envelope
// ===============================

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {*} data - Response payload
 * @param {string} [message='OK']
 * @param {number} [statusCode=200]
 */
const success = (res, data = null, message = "OK", statusCode = 200) => {
  const body = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== null && data !== undefined) {
    body.data = data;
  }

  return res.status(statusCode).json(body);
};

/**
 * Send an error response
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {Array|null} [errors=null] - Validation error details
 */
const error = (res, message = "Internal Server Error", statusCode = 500, errors = null) => {
  const body = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    body.errors = errors;
  }

  if (process.env.NODE_ENV === "development") {
    body.statusCode = statusCode;
  }

  return res.status(statusCode).json(body);
};

module.exports = { success, error };
