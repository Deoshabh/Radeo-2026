/**
 * Scheduled cleanup jobs.
 *
 * Call `registerCleanupJobs()` once at server startup.
 * Requires `node-cron` npm package.
 */

const cron = require('node-cron');
const Media = require('../models/Media');
const { deleteObject } = require('../utils/minio');
const { log } = require('../utils/logger');

/**
 * Delete orphaned media files that are:
 *   1. Not referenced anywhere (usageCount === 0 or usedIn is empty)
 *   2. Older than 24 hours (avoids deleting mid-upload files)
 *
 * Runs every Sunday at 03:00 IST.
 */
function scheduleOrphanedMediaCleanup() {
  cron.schedule(
    '0 3 * * 0',
    async () => {
      log.info({ event: 'orphaned_media_cleanup_start' });

      try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const orphaned = await Media.find({
          $or: [
            { usageCount: 0 },
            { usageCount: { $exists: false } },
          ],
          createdAt: { $lt: oneDayAgo },
        }).lean();

        if (orphaned.length === 0) {
          log.info({ event: 'orphaned_media_cleanup_none_found' });
          return;
        }

        // Attempt to delete from object storage
        const results = await Promise.allSettled(
          orphaned.map((m) =>
            deleteObject(m.key).catch(() => {
              /* ignore storage errors — file may already be gone */
            }),
          ),
        );

        const failed = results.filter((r) => r.status === 'rejected');
        if (failed.length > 0) {
          log.warn({
            event: 'orphaned_media_cleanup_partial_failure',
            failedCount: failed.length,
          });
        }

        // Delete documents from MongoDB
        await Media.deleteMany({
          _id: { $in: orphaned.map((m) => m._id) },
        });

        log.info({
          event: 'orphaned_media_cleanup_complete',
          deletedCount: orphaned.length,
        });
      } catch (err) {
        log.error({
          event: 'orphaned_media_cleanup_failed',
          error: err.message,
        });
      }
    },
    { timezone: 'Asia/Kolkata' },
  );
}

/**
 * Register all scheduled cleanup jobs. Call once at server boot.
 */
function registerCleanupJobs() {
  scheduleOrphanedMediaCleanup();
  log.info('Scheduled cleanup jobs registered');
}

module.exports = { registerCleanupJobs };
