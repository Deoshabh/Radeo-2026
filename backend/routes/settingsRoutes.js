const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, restrictTo } = require('../middleware/auth');

// Public route
router.get('/public', settingsController.getPublicSettings);

// Admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/', settingsController.getAllSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
