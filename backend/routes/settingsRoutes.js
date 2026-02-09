const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route
router.get('/public', settingsController.getPublicSettings);

// Admin routes
router.use(authenticate);
router.use(authorize('admin'));

router.get('/', settingsController.getAllSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
