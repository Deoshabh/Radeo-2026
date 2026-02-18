const SiteSettings = require('../models/SiteSettings');
const SettingAuditLog = require('../models/SettingAuditLog');
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
const { runScheduledPublishCheck } = require('../services/publishWorkflowService');
const {
  CURRENT_LAYOUT_SCHEMA_VERSION,
  normalizeLayoutSchema,
  deriveHomeSectionsFromLayout,
} = require('../utils/layoutSchema');
const { getOrSetCache, invalidateCache } = require('../utils/cache');

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
  homePage: settings.homePage,
  layout: settings.layout,
  layoutSchemaVersion: settings.layoutSchemaVersion || CURRENT_LAYOUT_SCHEMA_VERSION,
  theme: settings.theme,
});

const getPublishedSnapshot = (settings) => {
  if (settings?.publishedSnapshot && typeof settings.publishedSnapshot === 'object') {
    return settings.publishedSnapshot;
  }
  return createSnapshotPayload(settings);
};

const normalizePublishWorkflowInput = (incoming = {}, previous = {}) => {
  const requestedStatus = incoming?.status;
  const allowedStatuses = new Set(['draft', 'scheduled', 'live']);
  const status = allowedStatuses.has(requestedStatus)
    ? requestedStatus
    : previous?.status || 'live';

  const scheduledAt = status === 'scheduled' && incoming?.scheduledAt
    ? new Date(incoming.scheduledAt)
    : null;

  return {
    ...previous,
    status,
    scheduledAt:
      scheduledAt && !Number.isNaN(scheduledAt.getTime())
        ? scheduledAt
        : null,
    publishedAt:
      status === 'live'
        ? new Date()
        : previous?.publishedAt || null,
    updatedAt: new Date(),
  };
};

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
    const { branding, banners, announcementBar, homeSections, homePage, publishWorkflow } = req.body;
    
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

    // Handle homePage (from CMS admin) — stored directly on the document
    if (homePage) {
      settings.homePage = homePage;
      settings.markModified('homePage');
    }

    if (homeSections && !req.body.layout) {
      // Deep merge for homeSections to avoid overwriting partial updates if needed, 
      // but usually the admin sends the whole object for a section.
      // Let's assume we replace the specific sections provided.
      if (homeSections.heroSection) settings.homeSections.heroSection = { ...settings.homeSections.heroSection.toObject(), ...homeSections.heroSection };
      if (homeSections.featuredProducts) settings.homeSections.featuredProducts = { ...settings.homeSections.featuredProducts.toObject(), ...homeSections.featuredProducts };
      if (homeSections.madeToOrder) settings.homeSections.madeToOrder = { ...settings.homeSections.madeToOrder.toObject(), ...homeSections.madeToOrder };
      if (homeSections.newsletter) settings.homeSections.newsletter = { ...settings.homeSections.newsletter.toObject(), ...homeSections.newsletter };
    }

    if (req.body.layout) {
      const normalizedLayout = normalizeLayoutSchema(req.body.layout || []);
      const currentHomeSections = settings.homeSections?.toObject
        ? settings.homeSections.toObject()
        : settings.homeSections || {};

      settings.layout = normalizedLayout;
      settings.layoutSchemaVersion = Number(req.body.layoutSchemaVersion) || CURRENT_LAYOUT_SCHEMA_VERSION;
      settings.homeSections = deriveHomeSectionsFromLayout(normalizedLayout, currentHomeSections);
    }

    if (req.body.theme) {
      const currentTheme = settings.theme?.toObject
        ? settings.theme.toObject()
        : settings.theme || {};
      settings.theme = { ...currentTheme, ...req.body.theme };
      settings.markModified('theme');
    }

    settings.publishWorkflow = normalizePublishWorkflowInput(
      publishWorkflow || {},
      settings.publishWorkflow || {},
    );

    // Always keep publishedSnapshot in sync with live data.
    // The snapshot was previously only updated when status === 'live',
    // which caused stale data on refresh when status was 'draft'/'scheduled'.
    settings.publishedSnapshot = createSnapshotPayload(settings);
    settings.markModified('publishedSnapshot');

    if (settings.publishWorkflow.status === 'live') {
      settings.publishWorkflow.publishedAt = new Date();
    }

    appendVersionSnapshot(settings, {
      label: req.body.versionLabel || 'Manual save',
      userId: req.user?.id || null,
    });
    
    await settings.save();
    await invalidateCache('settings:*');
    
    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Compare two version snapshots and return differences.
 * POST /api/v1/settings/history/diff
 * Body: { versionA: historyId, versionB: historyId | 'current' }
 */
exports.diffVersions = async (req, res, next) => {
  try {
    const { versionA, versionB } = req.body || {};
    if (!versionA || !versionB) {
      return res.status(400).json({ message: 'versionA and versionB are required' });
    }

    const settings = await SiteSettings.getSettings();
    const history = settings.versionHistory || [];

    const getSnapshot = (id) => {
      if (id === 'current') return createSnapshotPayload(settings);
      const item = history.find((h) => String(h._id) === String(id));
      return item?.snapshot || null;
    };

    const snapA = getSnapshot(versionA);
    const snapB = getSnapshot(versionB);

    if (!snapA) return res.status(404).json({ message: `Version ${versionA} not found` });
    if (!snapB) return res.status(404).json({ message: `Version ${versionB} not found` });

    // Shallow diff of top-level keys
    const allKeys = new Set([...Object.keys(snapA), ...Object.keys(snapB)]);
    const changes = {};
    for (const key of allKeys) {
      const a = JSON.stringify(snapA[key]);
      const b = JSON.stringify(snapB[key]);
      if (a !== b) {
        changes[key] = { before: snapA[key], after: snapB[key] };
      }
    }

    res.json({
      success: true,
      changedKeys: Object.keys(changes),
      changes,
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
        snapshot: {
          layout: item.snapshot?.layout || [],
          theme: item.snapshot?.theme || {},
        },
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
    const normalizedLayout = normalizeLayoutSchema(snapshot.layout || settings.layout || []);
    const baseHomeSections = snapshot.homeSections || settings.homeSections || {};
    settings.layout = normalizedLayout;
    settings.layoutSchemaVersion = Number(snapshot.layoutSchemaVersion) || CURRENT_LAYOUT_SCHEMA_VERSION;
    settings.homeSections = deriveHomeSectionsFromLayout(normalizedLayout, baseHomeSections);
    settings.theme = snapshot.theme || settings.theme;

    if ((settings.publishWorkflow?.status || 'live') === 'live') {
      settings.publishedSnapshot = createSnapshotPayload(settings);
      settings.publishWorkflow = {
        ...(settings.publishWorkflow || {}),
        publishedAt: new Date(),
        updatedAt: new Date(),
      };
    }

    appendVersionSnapshot(settings, {
      label: `Restore: ${historyItem.label || 'Snapshot'}`,
      userId: req.user?.id || null,
    });

    await settings.save();
    await invalidateCache('settings:*');

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
    const normalizedLayout = normalizeLayoutSchema(importedSettings.layout || settings.layout || []);
    const baseHomeSections = importedSettings.homeSections || settings.homeSections || {};
    settings.layout = normalizedLayout;
    settings.layoutSchemaVersion = Number(importedSettings.layoutSchemaVersion) || CURRENT_LAYOUT_SCHEMA_VERSION;
    settings.homeSections = deriveHomeSectionsFromLayout(normalizedLayout, baseHomeSections);
    if (importedSettings.theme) settings.theme = importedSettings.theme;

    if ((settings.publishWorkflow?.status || 'live') === 'live') {
      settings.publishedSnapshot = createSnapshotPayload(settings);
      settings.publishWorkflow = {
        ...(settings.publishWorkflow || {}),
        publishedAt: new Date(),
        updatedAt: new Date(),
      };
    }

    appendVersionSnapshot(settings, {
      label: incoming.label || 'Imported JSON',
      userId: req.user?.id || null,
    });

    await settings.save();
    await invalidateCache('settings:*');

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

    await invalidateCache('settings:*');
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

    await invalidateCache('settings:*');
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

    await invalidateCache('settings:*');
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
    const publicSettings = await getOrSetCache('settings:public', async () => {
      const settings = await getSettingsByKeys(PUBLIC_SETTING_KEYS);
      const result = settings.reduce((acc, item) => {
        acc[item.key] = getPublicSettingValue(item.key, item.value);
        return acc;
      }, {});

      const singletonSettings = await SiteSettings.getSettings();
      const publishedSnapshot = getPublishedSnapshot(singletonSettings);

      if (publishedSnapshot?.announcementBar) {
        result.announcementBar = publishedSnapshot.announcementBar;
      }

      if (publishedSnapshot?.banners) {
        result.banners = publishedSnapshot.banners;
        result.bannerSystem = {
          ...(result.bannerSystem || {}),
          banners: publishedSnapshot.banners,
        };
      }

      if (publishedSnapshot?.homeSections) {
        result.homeSections = {
          ...(result.homeSections || {}),
          ...publishedSnapshot.homeSections,
        };
        result.heroSection = result.homeSections.heroSection || result.heroSection;
        result.featuredProducts = result.homeSections.featuredProducts || result.featuredProducts;
      }

      // Include homePage data (from CMS admin) for the storefront
      if (publishedSnapshot?.homePage) {
        result.homePage = publishedSnapshot.homePage;
      } else if (singletonSettings.homePage) {
        result.homePage = singletonSettings.homePage;
      }

      if (publishedSnapshot?.layout) {
        result.layout = normalizeLayoutSchema(publishedSnapshot.layout);
        result.layoutSchemaVersion =
          Number(publishedSnapshot.layoutSchemaVersion) ||
          Number(singletonSettings.layoutSchemaVersion) ||
          CURRENT_LAYOUT_SCHEMA_VERSION;
      }

      if (publishedSnapshot?.theme) {
        // Key-value store theme should override snapshot (snapshot can be stale)
        const kvTheme = result.theme || {};
        result.theme = { ...publishedSnapshot.theme, ...kvTheme };
      }

      result.publishWorkflow = {
        status: singletonSettings.publishWorkflow?.status || 'live',
        scheduledAt: singletonSettings.publishWorkflow?.scheduledAt || null,
        publishedAt: singletonSettings.publishWorkflow?.publishedAt || null,
        updatedAt: singletonSettings.publishWorkflow?.updatedAt || null,
      };

      return result;
    }, 300);

    // Generate ETag from content hash
    const crypto = require('crypto');
    const etag = `"${crypto.createHash('md5').update(JSON.stringify(publicSettings)).digest('hex')}"`;

    // Check If-None-Match header
    if (req.headers['if-none-match'] === etag) {
      return res.status(304).end();
    }

    res.set('ETag', etag);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ settings: publicSettings });
  } catch (err) {
    forwardError(res, next, err);
  }
};

/* =====================
   Manual Publish Workflow Check (Admin)
===================== */
exports.runPublishWorkflowNow = async (req, res, next) => {
  try {
    const result = await runScheduledPublishCheck();
    const settings = await SiteSettings.getSettings();

    if (result?.promoted) {
      await SettingAuditLog.create({
        key: 'publishWorkflow',
        action: 'update',
        oldValue: {
          status: 'scheduled',
        },
        newValue: {
          status: 'live',
          publishedAt: settings.publishWorkflow?.publishedAt || null,
        },
        updatedBy: req.user?.id || null,
        metadata: {
          source: 'manual-publish-check',
          triggeredBy: req.user?.email || req.user?.id || null,
        },
      });
    }

    await invalidateCache('settings:*');
    res.json({
      message: result?.promoted
        ? 'Scheduled publish promoted to live'
        : 'Publish workflow check completed',
      result,
      publishWorkflow: settings.publishWorkflow || {},
    });
  } catch (err) {
    forwardError(res, next, err);
  }
};

/* =====================
   Reset Storefront Defaults (Admin)
===================== */
exports.resetStorefrontDefaults = async (req, res, next) => {
  try {
    const settings = await SiteSettings.getSettings();

    const defaultHomeSections = {
      heroSection: SITE_SETTINGS_DEFAULTS.heroSection,
      featuredProducts: SITE_SETTINGS_DEFAULTS.featuredProducts,
      madeToOrder: SITE_SETTINGS_DEFAULTS.homeSections?.madeToOrder || {},
      newsletter: SITE_SETTINGS_DEFAULTS.homeSections?.newsletter || {},
    };

    const defaultLayout = normalizeLayoutSchema([
      {
        id: 'hero',
        type: 'hero',
        enabled: defaultHomeSections.heroSection?.enabled !== false,
        data: defaultHomeSections.heroSection,
      },
      {
        id: 'products',
        type: 'products',
        enabled: defaultHomeSections.featuredProducts?.enabled !== false,
        data: defaultHomeSections.featuredProducts,
      },
      {
        id: 'madeToOrder',
        type: 'madeToOrder',
        enabled: defaultHomeSections.madeToOrder?.enabled !== false,
        data: defaultHomeSections.madeToOrder,
      },
      {
        id: 'newsletter',
        type: 'newsletter',
        enabled: defaultHomeSections.newsletter?.enabled !== false,
        data: defaultHomeSections.newsletter,
      },
    ]);

    settings.branding = {
      logo: { url: '', alt: 'Logo' },
      favicon: { url: '' },
      siteName: 'Radeo',
    };
    settings.banners = [];
    settings.announcementBar = SITE_SETTINGS_DEFAULTS.announcementBar;
    settings.layout = defaultLayout;
    settings.layoutSchemaVersion = CURRENT_LAYOUT_SCHEMA_VERSION;
    settings.homeSections = deriveHomeSectionsFromLayout(defaultLayout, defaultHomeSections);
    settings.theme = {
      primaryColor: '#3B2F2F',
      secondaryColor: '#E5D3B3',
      fontFamily: 'Inter',
      borderRadius: '8px',
    };
    settings.publishWorkflow = {
      status: 'live',
      scheduledAt: null,
      publishedAt: new Date(),
      updatedAt: new Date(),
      lockOwner: null,
      lockUntil: null,
    };

    settings.publishedSnapshot = createSnapshotPayload(settings);

    appendVersionSnapshot(settings, {
      label: 'Reset to defaults',
      userId: req.user?.id || null,
    });

    await settings.save();

    await bulkUpsertSettings({
      items: PUBLIC_SETTING_KEYS.map((key) => ({
        key,
        value: SITE_SETTINGS_DEFAULTS[key],
      })),
      updatedBy: req.user?.id || null,
      metadata: {
        source: 'admin-reset-defaults',
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    await invalidateCache('settings:*');
    res.json({
      message: 'Storefront reset to default settings successfully',
      settings,
    });
  } catch (err) {
    forwardError(res, next, err);
  }
};
