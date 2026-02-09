const express = require('express');
const router = express.Router();
const {
  getPublicSettings,
  getPublicSettingByKey,
} = require('../controllers/settingsController');

// @route   GET /api/v1/settings
router.get('/', getPublicSettings);

// @route   GET /api/v1/settings/:key
router.get('/:key', getPublicSettingByKey);

module.exports = router;
