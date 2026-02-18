const AnalyticsEvent = require("../models/AnalyticsEvent");
const { log } = require("../utils/logger");

/**
 * Detect device type from user-agent string
 */
function detectDevice(ua = "") {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|windows.*phone|blackberry/i.test(ua))
    return "mobile";
  if (ua) return "desktop";
  return "unknown";
}

/**
 * Track event â€” public endpoint (no auth required)
 * POST /api/v1/analytics/event
 */
exports.trackEvent = async (req, res) => {
  try {
    const { event, properties = {}, page, referrer, sessionId } = req.body;

    if (!event) {
      return res.status(400).json({ success: false, message: "event is required" });
    }

    const ua = req.headers["user-agent"] || "";
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    await AnalyticsEvent.create({
      event,
      userId: req.user?._id || null,
      sessionId: sessionId || null,
      properties,
      page,
      referrer,
      userAgent: ua,
      ip,
      device: detectDevice(ua),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    // Tracking should never break the user experience â€” log but return 200
    log.error("Analytics tracking error:", error);
    res.status(200).json({ success: true });
  }
};

/**
 * Batch track events
 * POST /api/v1/analytics/events
 */
exports.trackEvents = async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, message: "events array is required" });
    }

    if (events.length > 50) {
      return res.status(400).json({ success: false, message: "Max 50 events per batch" });
    }

    const ua = req.headers["user-agent"] || "";
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const device = detectDevice(ua);

    const docs = events
      .filter((e) => e.event)
      .map((e) => ({
        event: e.event,
        userId: req.user?._id || null,
        sessionId: e.sessionId || null,
        properties: e.properties || {},
        page: e.page,
        referrer: e.referrer,
        userAgent: ua,
        ip,
        device,
      }));

    await AnalyticsEvent.insertMany(docs, { ordered: false });

    res.status(201).json({ success: true, count: docs.length });
  } catch (error) {
    log.error("Analytics batch tracking error:", error);
    res.status(200).json({ success: true });
  }
};

/**
 * Get analytics summary â€” admin only
 * GET /api/v1/admin/analytics/summary?period=7d
 */
exports.getSummary = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const days = parseInt(period) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [eventCounts, topProducts, topPages, deviceBreakdown, dailyTrend] =
      await Promise.all([
        // Total counts by event type
        AnalyticsEvent.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: "$event", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),

        // Top viewed products
        AnalyticsEvent.aggregate([
          {
            $match: {
              event: "product_view",
              createdAt: { $gte: since },
              "properties.productId": { $exists: true },
            },
          },
          {
            $group: {
              _id: "$properties.productId",
              views: { $sum: 1 },
              name: { $first: "$properties.productName" },
            },
          },
          { $sort: { views: -1 } },
          { $limit: 10 },
        ]),

        // Top pages by page_view
        AnalyticsEvent.aggregate([
          {
            $match: {
              event: "page_view",
              createdAt: { $gte: since },
              page: { $exists: true, $ne: null },
            },
          },
          { $group: { _id: "$page", views: { $sum: 1 } } },
          { $sort: { views: -1 } },
          { $limit: 10 },
        ]),

        // Device breakdown
        AnalyticsEvent.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: "$device", count: { $sum: 1 } } },
        ]),

        // Daily event trend
        AnalyticsEvent.aggregate([
          { $match: { createdAt: { $gte: since } } },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                event: "$event",
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.date": 1 } },
        ]),
      ]);

    // Unique visitors (by sessionId)
    const uniqueVisitors = await AnalyticsEvent.distinct("sessionId", {
      createdAt: { $gte: since },
      sessionId: { $ne: null },
    });

    res.json({
      success: true,
      data: {
        period: `${days}d`,
        since,
        totalEvents: eventCounts.reduce((sum, e) => sum + e.count, 0),
        uniqueVisitors: uniqueVisitors.length,
        eventCounts: Object.fromEntries(eventCounts.map((e) => [e._id, e.count])),
        topProducts,
        topPages,
        deviceBreakdown: Object.fromEntries(deviceBreakdown.map((d) => [d._id, d.count])),
        dailyTrend,
      },
    });
  } catch (error) {
    log.error("Analytics summary error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch analytics summary" });
  }
};

/**
 * Get funnel data â€” admin only
 * GET /api/v1/admin/analytics/funnel?period=7d
 * Returns: product_view â†’ add_to_cart â†’ begin_checkout â†’ purchase
 */
exports.getFunnel = async (req, res) => {
  try {
    const period = req.query.period || "7d";
    const days = parseInt(period) || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const funnelSteps = ["product_view", "add_to_cart", "begin_checkout", "purchase"];

    const counts = await AnalyticsEvent.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          event: { $in: funnelSteps },
        },
      },
      {
        $group: {
          _id: "$event",
          total: { $sum: 1 },
          uniqueUsers: { $addToSet: { $ifNull: ["$sessionId", "$userId"] } },
        },
      },
    ]);

    const funnel = funnelSteps.map((step) => {
      const data = counts.find((c) => c._id === step);
      return {
        step,
        total: data?.total || 0,
        uniqueUsers: data?.uniqueUsers?.length || 0,
      };
    });

    // Compute conversion rates between steps
    for (let i = 1; i < funnel.length; i++) {
      const prev = funnel[i - 1].total;
      funnel[i].conversionRate = prev > 0 ? Math.round((funnel[i].total / prev) * 100) : 0;
    }

    res.json({
      success: true,
      data: { period: `${days}d`, funnel },
    });
  } catch (error) {
    log.error("Analytics funnel error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch funnel data" });
  }
};
