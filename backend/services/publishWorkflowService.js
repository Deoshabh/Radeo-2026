const SiteSettings = require('../models/SiteSettings');
const SettingAuditLog = require('../models/SettingAuditLog');
const { log } = require('../utils/logger');
const { tokenClient } = require('../config/redis');

const DEFAULT_INTERVAL_MS = Number(process.env.PUBLISH_WORKFLOW_INTERVAL_MS || 60000);
const WORKER_LEASE_MS = Number(process.env.PUBLISH_WORKFLOW_LEASE_MS || 45000);
const WORKER_ID = process.env.HOSTNAME || `pid-${process.pid}`;

const createSnapshotPayload = (settings) => ({
  branding: settings.branding,
  banners: settings.banners,
  announcementBar: settings.announcementBar,
  homeSections: settings.homeSections,
  homePage: settings.homePage,
  layout: settings.layout,
  layoutSchemaVersion: settings.layoutSchemaVersion || 1,
  theme: settings.theme,
});

const LOCK_KEY = 'lock:publish-workflow';
const LOCK_TTL = 55; // seconds (interval is 60s)

const runScheduledPublishCheck = async () => {
  // Acquire Valkey distributed lock (prevents multi-instance races)
  let lockAcquired = false;
  try {
    const result = await tokenClient.set(LOCK_KEY, WORKER_ID, 'EX', LOCK_TTL, 'NX');
    lockAcquired = result === 'OK';
  } catch {
    // Valkey down — fall through to MongoDB-level lock
    lockAcquired = true;
  }

  if (!lockAcquired) {
    return { promoted: false, reason: 'valkey-lock-held' };
  }

  try {
    const now = new Date();
    const leaseUntil = new Date(Date.now() + WORKER_LEASE_MS);

    const settings = await SiteSettings.findOneAndUpdate(
      {
        isDefault: true,
        $or: [
          { 'publishWorkflow.lockUntil': { $exists: false } },
          { 'publishWorkflow.lockUntil': null },
          { 'publishWorkflow.lockUntil': { $lt: now } },
          { 'publishWorkflow.lockOwner': WORKER_ID },
        ],
      },
      {
        $set: {
          'publishWorkflow.lockOwner': WORKER_ID,
          'publishWorkflow.lockUntil': leaseUntil,
        },
      },
      { new: true },
    );

    if (!settings) {
      return { promoted: false, reason: 'lock-not-acquired' };
    }

    const workflow = settings.publishWorkflow || {};

    if (workflow.status !== 'scheduled') {
      settings.publishWorkflow = {
        ...workflow,
        lockOwner: null,
        lockUntil: null,
      };
      await settings.save();
      return { promoted: false, reason: 'not-scheduled' };
    }

    const scheduledAt = workflow.scheduledAt ? new Date(workflow.scheduledAt) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      settings.publishWorkflow = {
        ...workflow,
        lockOwner: null,
        lockUntil: null,
      };
      await settings.save();
      return { promoted: false, reason: 'invalid-schedule' };
    }
    if (Date.now() < scheduledAt.getTime()) {
      settings.publishWorkflow = {
        ...workflow,
        lockOwner: null,
        lockUntil: null,
      };
      await settings.save();
      return { promoted: false, reason: 'not-due-yet', scheduledAt };
    }

    settings.publishWorkflow = {
      ...workflow,
      status: 'live',
      scheduledAt: null,
      publishedAt: new Date(),
      updatedAt: new Date(),
      lockOwner: null,
      lockUntil: null,
    };

    settings.publishedSnapshot = createSnapshotPayload(settings);
    await settings.save();

    await SettingAuditLog.create({
      key: 'publishWorkflow',
      action: 'update',
      oldValue: { status: 'scheduled' },
      newValue: { status: 'live', publishedAt: settings.publishWorkflow.publishedAt },
      metadata: {
        source: 'scheduled-worker',
        workerId: WORKER_ID,
      },
    });

    log.info('[publish-workflow] Scheduled publish promoted to live.');
    return {
      promoted: true,
      reason: 'scheduled-promoted',
      publishedAt: settings.publishWorkflow.publishedAt,
    };
  } catch (error) {
    log.error('[publish-workflow] Failed scheduled publish check:', error.message);
    return {
      promoted: false,
      reason: 'error',
      error: error.message,
    };
  } finally {
    // Release Valkey lock
    try { await tokenClient.del(LOCK_KEY); } catch { /* ignore */ }
  }
};

const startPublishWorkflowWorker = () => {
  if (process.env.NODE_ENV === 'test') return () => {};

  runScheduledPublishCheck();
  const timer = setInterval(runScheduledPublishCheck, DEFAULT_INTERVAL_MS);

  return () => {
    clearInterval(timer);
  };
};

module.exports = {
  runScheduledPublishCheck,
  startPublishWorkflowWorker,
};
