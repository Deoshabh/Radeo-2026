const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { verifyTurnstile } = require('../middleware/turnstile');
const { submitContactMessage } = require('../controllers/contactController');

const contactLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	message: { message: 'Too many contact requests, please try again later' },
	standardHeaders: true,
	legacyHeaders: false,
});

// @route   POST /api/v1/contact
router.post('/', contactLimiter, verifyTurnstile('contact_form', { optional: true }), submitContactMessage);

module.exports = router;
