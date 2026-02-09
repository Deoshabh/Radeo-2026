const express = require('express');
const router = express.Router();
const { submitContactMessage } = require('../controllers/contactController');

// @route   POST /api/v1/contact
router.post('/', submitContactMessage);

module.exports = router;
