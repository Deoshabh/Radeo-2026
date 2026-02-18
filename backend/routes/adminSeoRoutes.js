const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const admin = require('../middleware/admin');
const {
  getSettingsByKeys,
  upsertSetting,
} = require('../utils/siteSettings');
const { autoGenerateSeo, auditSeo } = require('../controllers/seoController');

// @route   GET /api/v1/admin/seo
// @desc    Get all SEO settings
// @access  Admin
router.get('/', authenticate, admin, async (req, res, next) => {
  try {
    const settings = await getSettingsByKeys(['seoSettings']);
    const seoSettings = settings[0]?.value || {};
    res.json({ success: true, seoSettings });
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/v1/admin/seo
// @desc    Update SEO settings
// @access  Admin
router.put('/', authenticate, admin, async (req, res, next) => {
  try {
    const { seoSettings } = req.body;

    if (!seoSettings || typeof seoSettings !== 'object') {
      return res.status(400).json({ message: 'seoSettings object is required' });
    }

    await upsertSetting({
      key: 'seoSettings',
      value: seoSettings,
      updatedBy: req.user._id,
      metadata: { source: 'admin-seo-panel' },
    });

    res.json({ success: true, message: 'SEO settings updated successfully' });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/v1/seo/public
// @desc    Get public SEO settings (for frontend metadata generation)
// @access  Public
router.get('/public', async (req, res, next) => {
  try {
    const settings = await getSettingsByKeys(['seoSettings']);
    const seoSettings = settings[0]?.value || {};
    res.json({ success: true, seoSettings });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/v1/admin/seo/auto-generate
// @desc    Auto-generate SEO metadata for products/categories
// @access  Admin
router.post('/auto-generate', authenticate, admin, autoGenerateSeo);

// @route   GET /api/v1/admin/seo/audit
// @desc    Audit SEO across all products/categories
// @access  Admin
router.get('/audit', authenticate, admin, auditSeo);

module.exports = router;
