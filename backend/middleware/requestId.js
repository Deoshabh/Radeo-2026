/**
 * Request ID Middleware
 * Attaches a unique ID to every request for tracing through logs.
 *
 * Uses crypto.randomUUID() (Node ≥19) for zero-dependency UUIDs.
 * Reads X-Request-Id header from Traefik/Cloudflare if present.
 */

const crypto = require("crypto");

function requestId(req, _res, next) {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  next();
}

module.exports = { requestId };
