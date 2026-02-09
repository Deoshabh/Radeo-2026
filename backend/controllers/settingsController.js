const {
  PUBLIC_SETTING_KEYS,
  isKnownSettingKey,
  getDefaultSettingValue,
  getPublicSettingValue,
  getSettingsByKeys,
  upsertSetting,
  resetSettingToDefault,
  bulkUpsertSettings,
  getSettingHistory,
} = require('../utils/siteSettings');

const parseKeys = (rawKeys) => {
  if (!rawKeys) {
    return PUBLIC_SETTING_KEYS;
  }

  return rawKeys
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .filter((key) => isKnownSettingKey(key));
};

const toSettingsObject = (settingsList, { usePublicValues = false } = {}) => {
  return settingsList.reduce((acc, item) => {
    acc[item.key] = usePublicValues
      ? getPublicSettingValue(item.key, item.value)
      : item.value;
    return acc;
  }, {});
};

exports.getPublicSettings = async (req, res) => {
  try {
    const keys = parseKeys(req.query.keys);
    const settings = await getSettingsByKeys(keys);

    const publicSettings = settings.filter((setting) => setting.isPublic !== false);

    return res.json({
      settings: toSettingsObject(publicSettings, { usePublicValues: true }),
      keys: publicSettings.map((setting) => setting.key),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to fetch public settings',
    });
  }
};

exports.getPublicSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    if (!isKnownSettingKey(key)) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    const settings = await getSettingsByKeys([key]);
    const setting = settings[0];

    if (!setting || setting.isPublic === false) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    return res.json({
      key,
      value: getPublicSettingValue(setting.key, setting.value),
      source: setting.source,
      updatedAt: setting.updatedAt,
      version: setting.version,
    });
  } catch (error) {
    console.error('Get public setting error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to fetch setting',
    });
  }
};

exports.getAdminSettings = async (req, res) => {
  try {
    const keys = parseKeys(req.query.keys);
    const settings = await getSettingsByKeys(keys);

    return res.json({ settings });
  } catch (error) {
    console.error('Get admin settings error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to fetch admin settings',
    });
  }
};

exports.getAdminSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    if (!isKnownSettingKey(key)) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    const settings = await getSettingsByKeys([key]);
    return res.json({ setting: settings[0] });
  } catch (error) {
    console.error('Get admin setting by key error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to fetch setting',
    });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!isKnownSettingKey(key)) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    if (value === undefined) {
      return res.status(400).json({ message: 'Setting value is required' });
    }

    const updated = await upsertSetting({
      key,
      value,
      updatedBy: req.user?._id,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return res.json({
      key: updated.key,
      value: updated.value,
      category: updated.category,
      version: updated.version,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Update setting error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to update setting',
    });
  }
};

exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: 'items must be a non-empty array' });
    }

    for (const item of items) {
      if (!item || !item.key || item.value === undefined) {
        return res.status(400).json({
          message: 'Each item must contain key and value',
        });
      }

      if (!isKnownSettingKey(item.key)) {
        return res.status(400).json({
          message: `Unknown setting key in bulk payload: ${item.key}`,
        });
      }
    }

    await bulkUpsertSettings({
      items,
      updatedBy: req.user?._id,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    const keys = items.map((item) => item.key);
    const settings = await getSettingsByKeys(keys);

    return res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to bulk update settings',
    });
  }
};

exports.resetSetting = async (req, res) => {
  try {
    const { key } = req.params;

    if (!isKnownSettingKey(key)) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    const updated = await resetSettingToDefault({
      key,
      updatedBy: req.user?._id,
    });

    return res.json({
      message: 'Setting reset to default',
      key,
      value: updated.value,
      version: updated.version,
      updatedAt: updated.updatedAt,
      defaultValue: getDefaultSettingValue(key),
    });
  } catch (error) {
    console.error('Reset setting error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to reset setting',
    });
  }
};

exports.getSettingHistory = async (req, res) => {
  try {
    const { key } = req.params;
    const { limit } = req.query;

    if (!isKnownSettingKey(key)) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    const history = await getSettingHistory({
      key,
      limit: Number(limit) || 20,
    });

    return res.json({
      key,
      history,
    });
  } catch (error) {
    console.error('Get setting history error:', error);
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to fetch setting history',
    });
  }
};
