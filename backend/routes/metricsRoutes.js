/**
 * Prometheus Metrics Route
 *
 * Exposes application metrics at GET /api/metrics
 * Designed for internal/Traefik scraping — not exposed publicly.
 *
 * Uses prom-client for Node.js process metrics + custom counters.
 */

const express = require("express");
const router = express.Router();

let client;
let httpRequestDuration;
let httpRequestTotal;
let activeConnections;

try {
  client = require("prom-client");

  // Collect default Node.js metrics (CPU, memory, event loop, GC)
  client.collectDefaultMetrics({
    prefix: "radeo_",
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  });

  // Custom metrics
  httpRequestDuration = new client.Histogram({
    name: "radeo_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status_code"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  });

  httpRequestTotal = new client.Counter({
    name: "radeo_http_requests_total",
    help: "Total HTTP requests",
    labelNames: ["method", "route", "status_code"],
  });

  activeConnections = new client.Gauge({
    name: "radeo_active_connections",
    help: "Number of active HTTP connections",
  });
} catch {
  // prom-client not installed — metrics disabled
}

/**
 * Middleware: track request duration and count.
 * Add as early as possible in middleware chain.
 */
function metricsMiddleware(req, res, next) {
  if (!client || !httpRequestDuration) return next();

  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    activeConnections.dec();
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode,
    };
    end(labels);
    httpRequestTotal.inc(labels);
  });

  next();
}

/**
 * GET /api/metrics
 * Returns Prometheus-formatted metrics text.
 */
router.get("/", async (_req, res) => {
  if (!client) {
    return res.status(501).json({
      error: "Metrics disabled — install prom-client: npm i prom-client",
    });
  }

  try {
    res.set("Content-Type", client.register.contentType);
    const metrics = await client.register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { metricsRouter: router, metricsMiddleware };
