// ===============================
// Soketi (Pusher) Client Configuration
// ===============================
const Pusher = require("pusher");
const { log } = require("./logger");

/**
 * Initialize Soketi client
 * Soketi is a Pusher-compatible WebSocket server
 */
const soketi = new Pusher({
  appId: process.env.SOKETI_APP_ID || "3e0253375c04",
  key: process.env.SOKETI_APP_KEY || "cd67be17429b0e155331afb09ea69d07",
  secret:
    process.env.SOKETI_APP_SECRET ||
    "ed3e608ce438ab7946defa4fdb9a8a040b9dff9bf0135877938f3924d8ed0688",
  cluster: process.env.SOKETI_CLUSTER || "mt1",
  host:
    process.env.SOKETI_HOST || "adobot-soketi-dbe669-157-173-218-96.traefik.me",
  port: parseInt(process.env.SOKETI_PORT) || 6001,
  useTLS: process.env.SOKETI_USE_TLS === "true",
});

/**
 * Emit order tracking update to connected clients
 * @param {String} orderId - MongoDB order ID
 * @param {Object} data - Update data (status, awbCode, etc.)
 */
const emitOrderUpdate = async (orderId, data) => {
  try {
    await soketi.trigger(`order-${orderId}`, "tracking-update", {
      orderId,
      timestamp: new Date().toISOString(),
      ...data,
    });
    log.info(`âœ… Soketi: Emitted tracking-update for order ${orderId}`);
  } catch (error) {
    log.error("âŒ Soketi emit error:", error.message);
  }
};

/**
 * Emit global shipment update (admin dashboard)
 * @param {Object} data - Shipment data
 */
const emitGlobalShipmentUpdate = async (data) => {
  try {
    await soketi.trigger("shipments", "shipment-update", {
      timestamp: new Date().toISOString(),
      ...data,
    });
    log.info(`âœ… Soketi: Emitted global shipment-update`);
  } catch (error) {
    log.error("âŒ Soketi emit error:", error.message);
  }
};

/**
 * Emit new order event to admin dashboard
 * @param {Object} order - The created order object
 */
const emitAdminOrderCreated = async (order) => {
  try {
    await soketi.trigger("admin-updates", "order:created", {
      id: order.orderId,
      amount: order.totalAmount,
      customer: order.shippingAddress?.fullName,
      timestamp: new Date().toISOString(),
    });
    log.info(`âœ… Soketi: Emitted admin order:created for ${order.orderId}`);
  } catch (error) {
    log.error("âŒ Soketi emit error:", error.message);
  }
};

/**
 * Emit new contact message event to admin dashboard
 * @param {Object} contact - The created contact message object
 */
const emitAdminContactMessage = async (contact) => {
  try {
    await soketi.trigger("admin-updates", "contact:new", {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject || "(no subject)",
      preview: (contact.message || "").slice(0, 120),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Fire-and-forget â€” don't break contact form submission
  }
};

module.exports = {
  soketi,
  emitOrderUpdate,
  emitGlobalShipmentUpdate,
  emitAdminOrderCreated,
  emitAdminContactMessage,
};
