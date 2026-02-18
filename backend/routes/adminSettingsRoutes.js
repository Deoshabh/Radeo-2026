const express = require('express');
const router = express.Router();
const {
  getAdminSettings,
  getAdminSettingByKey,
  updateSetting,
  bulkUpdateSettings,
  resetSetting,
  getSettingHistory,
} = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');
const admin = require('../middleware/admin');
const { validateRequest } = require('../middleware/validateRequest');
const { updateSettingsSchema } = require('../validators/schemas');

router.use(authenticate);
router.use(admin);

// @route   GET /api/v1/admin/settings
router.get('/', getAdminSettings);

// @route   POST /api/v1/admin/settings/bulk
router.post('/bulk', validateRequest(updateSettingsSchema), bulkUpdateSettings);

// @route   GET /api/v1/admin/settings/:key
router.get('/:key', getAdminSettingByKey);

// @route   PUT /api/v1/admin/settings/:key
router.put('/:key', updateSetting);

// @route   POST /api/v1/admin/settings/:key/reset
router.post('/:key/reset', resetSetting);

// @route   GET /api/v1/admin/settings/:key/history
router.get('/:key/history', getSettingHistory);

module.exports = router;
