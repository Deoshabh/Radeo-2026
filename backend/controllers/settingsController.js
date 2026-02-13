const SiteSettings = require('../models/SiteSettings');
const {
  PUBLIC_SETTING_KEYS,
  isKnownSettingKey,
  getPublicSettingValue,
  getSettingsByKeys,
  upsertSetting,
  bulkUpsertSettings,
  resetSettingToDefault,
  getSettingHistory: getSettingHistoryForKey,
} = require('../utils/siteSettings');

const forwardError = (res, next, err) => {
  if (err?.statusCode && res.statusCode === 200) {
    res.status(err.statusCode);
  }
  next(err);
};

/* =====================
   Get All Settings (Admin)
===================== */
exports.getAllSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Update Settings
===================== */
exports.updateSettings = async (req, res, next) => {
  try {
    const { branding, banners, announcementBar, homeSections } = req.body;
    
    // Validate inputs if necessary
    
    const settings = await SiteSettings.getSettings();
    
    if (branding) {
      if (branding.logo) settings.branding.logo = { ...settings.branding.logo, ...branding.logo };
      if (branding.favicon) settings.branding.favicon = { ...settings.branding.favicon, ...branding.favicon };
      if (branding.siteName) settings.branding.siteName = branding.siteName;
    }
    
    if (banners) {
      // Simple replacement is easier for reordering/editing list
      settings.banners = banners;
    }

    if (announcementBar) {
      settings.announcementBar = { ...settings.announcementBar.toObject(), ...announcementBar };
    }

    if (homeSections) {
      // Deep merge for homeSections to avoid overwriting partial updates if needed, 
      // but usually the admin sends the whole object for a section.
      // Let's assume we replace the specific sections provided.
      if (homeSections.heroSection) settings.homeSections.heroSection = { ...settings.homeSections.heroSection.toObject(), ...homeSections.heroSection };
      if (homeSections.featuredProducts) settings.homeSections.featuredProducts = { ...settings.homeSections.featuredProducts.toObject(), ...homeSections.featuredProducts };
      if (homeSections.madeToOrder) settings.homeSections.madeToOrder = { ...settings.homeSections.madeToOrder.toObject(), ...homeSections.madeToOrder };
      if (homeSections.newsletter) settings.homeSections.newsletter = { ...settings.homeSections.newsletter.toObject(), ...homeSections.newsletter };
    }
    
    await settings.save();
    
    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================
   Admin Settings APIs (Key-based)
===================== */
exports.getAdminSettings = async (req, res, next) => {
  try {
    const settings = await getSettingsByKeys(PUBLIC_SETTING_KEYS);
    res.json({ settings });
  } catch (err) {
    forwardError(res, next, err);
  }
};

exports.getAdminSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!isKnownSettingKey(key)) {
      return res.status(404).json({ message: `Unknown setting key: ${key}` });
    }

    const settings = await getSettingsByKeys([key]);
    if (!settings.length) {
      return res.status(404).json({ message: `Setting not found: ${key}` });
    }

    res.json(settings[0]);
  } catch (err) {
    forwardError(res, next, err);
  }
};

exports.updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body || {};

    if (value === undefined) {
      return res.status(400).json({ message: 'value is required' });
    }

    const saved = await upsertSetting({
      key,
      value,
      updatedBy: req.user?.id || null,
      metadata: {
        source: 'admin-settings-api',
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json(saved);
  } catch (err) {
    forwardError(res, next, err);
  }
};

exports.bulkUpdateSettings = async (req, res, next) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items must be a non-empty array' });
    }

    const invalidItem = items.find(
      (item) => !item || typeof item.key !== 'string' || item.value === undefined,
    );
    if (invalidItem) {
      return res.status(400).json({
        message: 'Each item must include key (string) and value',
      });
    }

    const results = await bulkUpsertSettings({
      items,
      updatedBy: req.user?.id || null,
      metadata: {
        source: 'admin-settings-api',
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.json({ message: 'Settings updated successfully', settings: results });
  } catch (err) {
    forwardError(res, next, err);
  }
};

exports.resetSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const saved = await resetSettingToDefault({
      key,
      updatedBy: req.user?.id || null,
    });

    res.json(saved);
  } catch (err) {
    forwardError(res, next, err);
  }
};

exports.getSettingHistory = async (req, res, next) => {
  try {
    const { key } = req.params;
    const limitParam = parseInt(req.query.limit, 10);
    const history = await getSettingHistoryForKey({
      key,
      limit: Number.isFinite(limitParam) ? limitParam : 20,
    });

    res.json({ history });
  } catch (err) {
    forwardError(res, next, err);
  }
};

/* =====================
   Public Settings (Key-based)
===================== */
exports.getPublicSettings = async (req, res, next) => {
  try {
    const settings = await getSettingsByKeys(PUBLIC_SETTING_KEYS);
    const publicSettings = settings.reduce((acc, item) => {
      acc[item.key] = getPublicSettingValue(item.key, item.value);
      return acc;
    }, {});

    res.json({ settings: publicSettings });
  } catch (err) {
    forwardError(res, next, err);
  }
};
