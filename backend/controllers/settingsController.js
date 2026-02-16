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

const createSnapshotPayload = (settings) => ({
  branding: settings.branding,
  banners: settings.banners,
  announcementBar: settings.announcementBar,
  homeSections: settings.homeSections,
  layout: settings.layout,
  theme: settings.theme,
});

const appendVersionSnapshot = (settings, { label, userId } = {}) => {
  const snapshot = createSnapshotPayload(settings);

  const currentHistory = Array.isArray(settings.versionHistory)
    ? settings.versionHistory
    : [];

  currentHistory.push({
    label: label || 'Snapshot',
    snapshot,
    savedAt: new Date(),
    savedBy: userId || null,
  });

  const maxHistory = 50;
  settings.versionHistory = currentHistory.slice(-maxHistory);
  settings.currentVersion = (settings.currentVersion || 0) + 1;
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

    if (req.body.layout) {
      settings.layout = req.body.layout;
    }

    if (req.body.theme) {
      const currentTheme = settings.theme?.toObject
        ? settings.theme.toObject()
        : settings.theme || {};
      settings.theme = { ...currentTheme, ...req.body.theme };
    }

    appendVersionSnapshot(settings, {
      label: req.body.versionLabel || 'Manual save',
      userId: req.user?.id || null,
    });
    
    await settings.save();
    
    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};

exports.getThemeVersionHistory = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();

    const history = (settings.versionHistory || [])
      .slice()
      .reverse()
      .map((item) => ({
        id: item._id,
        label: item.label,
        savedAt: item.savedAt,
        savedBy: item.savedBy || null,
      }));

    res.json({
      currentVersion: settings.currentVersion || 1,
      history,
    });
  } catch (err) {
    next(err);
  }
};

exports.restoreThemeVersion = async (req, res, next) => {
  try {
    const { historyId } = req.body || {};

    if (!historyId) {
      return res.status(400).json({ message: 'historyId is required' });
    }

    const settings = await SiteSettings.getSettings();
    const historyItem = (settings.versionHistory || []).find(
      (item) => String(item._id) === String(historyId),
    );

    if (!historyItem) {
      return res.status(404).json({ message: 'Version snapshot not found' });
    }

    const snapshot = historyItem.snapshot || {};
    settings.branding = snapshot.branding || settings.branding;
    settings.banners = snapshot.banners || settings.banners;
    settings.announcementBar = snapshot.announcementBar || settings.announcementBar;
    settings.homeSections = snapshot.homeSections || settings.homeSections;
    settings.layout = snapshot.layout || settings.layout;
    settings.theme = snapshot.theme || settings.theme;

    appendVersionSnapshot(settings, {
      label: `Restore: ${historyItem.label || 'Snapshot'}`,
      userId: req.user?.id || null,
    });

    await settings.save();

    res.json({
      message: 'Theme version restored successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};

exports.exportThemeJson = async (_req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();

    const payload = {
      exportedAt: new Date().toISOString(),
      version: settings.currentVersion || 1,
      settings: createSnapshotPayload(settings),
    };

    res.json(payload);
  } catch (err) {
    next(err);
  }
};

exports.importThemeJson = async (req, res, next) => {
  try {
    const incoming = req.body || {};
    const importedSettings = incoming.settings || incoming;

    if (!importedSettings || typeof importedSettings !== 'object') {
      return res.status(400).json({ message: 'Invalid theme JSON payload' });
    }

    const settings = await SiteSettings.getSettings();

    if (importedSettings.branding) settings.branding = importedSettings.branding;
    if (importedSettings.banners) settings.banners = importedSettings.banners;
    if (importedSettings.announcementBar) settings.announcementBar = importedSettings.announcementBar;
    if (importedSettings.homeSections) settings.homeSections = importedSettings.homeSections;
    if (importedSettings.layout) settings.layout = importedSettings.layout;
    if (importedSettings.theme) settings.theme = importedSettings.theme;

    appendVersionSnapshot(settings, {
      label: incoming.label || 'Imported JSON',
      userId: req.user?.id || null,
    });

    await settings.save();

    res.json({
      message: 'Theme JSON imported successfully',
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
