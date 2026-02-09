const SiteSetting = require('../models/SiteSetting');
const SettingAuditLog = require('../models/SettingAuditLog');
const {
  SITE_SETTINGS_DEFAULTS,
  SETTING_CATEGORY_MAP,
  PUBLIC_SETTING_KEYS,
  isKnownSettingKey,
  getDefaultSettingValue,
  getPublicSettingValue,
} = require('../config/siteSettingsDefaults');

const MAX_SETTING_PAYLOAD_BYTES = 250000;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const ensureKnownKey = (key) => {
  if (!isKnownSettingKey(key)) {
    const error = new Error(`Unknown setting key: ${key}`);
    error.statusCode = 400;
    throw error;
  }
};

const ensurePayloadSize = (value) => {
  const json = JSON.stringify(value);
  if (Buffer.byteLength(json, 'utf8') > MAX_SETTING_PAYLOAD_BYTES) {
    const error = new Error(
      `Setting payload exceeds ${MAX_SETTING_PAYLOAD_BYTES} bytes limit`,
    );
    error.statusCode = 413;
    throw error;
  }
};

const getSettingsByKeys = async (keys = PUBLIC_SETTING_KEYS) => {
  const normalizedKeys = keys.filter((key) => isKnownSettingKey(key));
  const docs = await SiteSetting.find({ key: { $in: normalizedKeys } }).lean();
  const docMap = new Map(docs.map((doc) => [doc.key, doc]));

  return normalizedKeys.map((key) => {
    const doc = docMap.get(key);
    return {
      key,
      category: SETTING_CATEGORY_MAP[key] || 'general',
      value: doc ? doc.value : getDefaultSettingValue(key),
      isPublic: doc ? doc.isPublic : true,
      version: doc ? doc.version : 1,
      updatedAt: doc ? doc.updatedAt : null,
      createdAt: doc ? doc.createdAt : null,
      updatedBy: doc ? doc.updatedBy : null,
      source: doc ? 'database' : 'default',
    };
  });
};

const getSettingsObject = async (keys = PUBLIC_SETTING_KEYS) => {
  const settings = await getSettingsByKeys(keys);
  return settings.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
};

const upsertSetting = async ({
  key,
  value,
  updatedBy,
  metadata = {},
  action = null,
}) => {
  ensureKnownKey(key);
  ensurePayloadSize(value);

  const category = SETTING_CATEGORY_MAP[key] || 'general';
  const existing = await SiteSetting.findOne({ key });

  if (!existing) {
    const created = await SiteSetting.create({
      key,
      category,
      value,
      isPublic: true,
      version: 1,
      updatedBy,
    });

    await SettingAuditLog.create({
      key,
      action: action || 'create',
      oldValue: null,
      newValue: value,
      updatedBy,
      metadata,
    });

    return created;
  }

  const oldValue = deepClone(existing.value);
  existing.value = value;
  existing.category = category;
  existing.version += 1;
  existing.updatedBy = updatedBy;

  const updated = await existing.save();

  await SettingAuditLog.create({
    key,
    action: action || 'update',
    oldValue,
    newValue: value,
    updatedBy,
    metadata,
  });

  return updated;
};

const resetSettingToDefault = async ({ key, updatedBy }) => {
  ensureKnownKey(key);
  const defaultValue = getDefaultSettingValue(key);

  const saved = await upsertSetting({
    key,
    value: defaultValue,
    updatedBy,
    action: 'reset',
    metadata: { reason: 'reset-to-default' },
  });

  return saved;
};

const bulkUpsertSettings = async ({ items, updatedBy, metadata = {} }) => {
  const results = [];
  for (const item of items) {
    const saved = await upsertSetting({
      key: item.key,
      value: item.value,
      updatedBy,
      metadata: {
        ...metadata,
        mode: 'bulk',
      },
    });
    results.push(saved);
  }

  return results;
};

const getSettingHistory = async ({ key, limit = 20 }) => {
  ensureKnownKey(key);
  return SettingAuditLog.find({ key })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 100)))
    .populate('updatedBy', 'name email role')
    .lean();
};

module.exports = {
  SITE_SETTINGS_DEFAULTS,
  PUBLIC_SETTING_KEYS,
  isKnownSettingKey,
  getDefaultSettingValue,
  getPublicSettingValue,
  getSettingsByKeys,
  getSettingsObject,
  upsertSetting,
  resetSettingToDefault,
  bulkUpsertSettings,
  getSettingHistory,
};
