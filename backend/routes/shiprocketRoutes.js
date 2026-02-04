const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getShippingRates,
  createShipment,
  generateLabel,
  trackShipment,
  cancelShipment,
  getPickupAddresses,
  schedulePickup,
  generateManifest,
  markAsShipped,
  handleWebhook,
} = require('../controllers/shiprocketController');

// Public webhook endpoint (no auth required)
router.post('/webhook', handleWebhook);

// Protect all other routes with authentication and admin check
router.use(authenticate);
router.use(admin);

// GET /pickup-addresses → get all pickup addresses
router.get('/pickup-addresses', getPickupAddresses);

// POST /rates → get shipping rates
router.post('/rates', getShippingRates);

// POST /create-shipment/:orderId → create shipment for an order
router.post('/create-shipment/:orderId', createShipment);

// POST /label/:orderId → generate shipping label
router.post('/label/:orderId', generateLabel);

// GET /track/:orderId → track shipment
router.get('/track/:orderId', trackShipment);

// POST /cancel/:orderId → cancel shipment
router.post('/cancel/:orderId', cancelShipment);

// POST /schedule-pickup/:orderId → schedule pickup
router.post('/schedule-pickup/:orderId', schedulePickup);

// POST /manifest/:orderId → generate and print manifest
router.post('/manifest/:orderId', generateManifest);

// POST /mark-shipped/:orderId → mark order as shipped
router.post('/mark-shipped/:orderId', markAsShipped);

module.exports = router;
