const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { updateSettingsSchema } = require('../validators/schemas');

// Public route
router.get('/public', settingsController.getPublicSettings);

// Admin routes
router.use(authenticate);
router.use(authorize('admin', 'designer', 'publisher'));

router.get('/', settingsController.getAllSettings);
router.put('/', validateRequest(updateSettingsSchema), settingsController.updateSettings);
router.get('/history', settingsController.getThemeVersionHistory);
router.post('/history/restore', settingsController.restoreThemeVersion);
router.post('/history/diff', settingsController.diffVersions);
router.post('/publish/run', settingsController.runPublishWorkflowNow);
router.post('/reset-defaults', settingsController.resetStorefrontDefaults);
router.get('/export', settingsController.exportThemeJson);
router.post('/import', settingsController.importThemeJson);

module.exports = router;
