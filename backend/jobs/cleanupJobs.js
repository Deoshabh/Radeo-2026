/**
 * Scheduled cleanup jobs.
 *
 * Call `registerCleanupJobs()` once at server startup.
 * Requires `node-cron` npm package.
 */

const cron = require('node-cron');
const mongoose = require('mongoose');
const Media = require('../models/Media');
const Order = require('../models/Order');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { deleteObject } = require('../utils/minio');
const { invalidateCache } = require('../utils/cache');
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
 * Cancel abandoned orders that have been in "confirmed" state
 * for 30+ minutes without successful payment.
 *
 * These are orders where the customer started checkout (stock was
 * decremented) but never completed Razorpay payment.
 * Stock is restored inside a MongoDB transaction.
 *
 * Runs every 10 minutes.
 */
function scheduleAbandonedOrderCleanup() {
  cron.schedule(
    '*/10 * * * *',
    async () => {
      log.info({ event: 'abandoned_order_cleanup_start' });

      try {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Find orders that are confirmed but never paid, older than 30 min
        const abandonedOrders = await Order.find({
          status: 'confirmed',
          'payment.status': { $in: ['pending', null] },
          'payment.method': { $ne: 'cod' },
          createdAt: { $lt: thirtyMinAgo },
        }).lean();

        if (abandonedOrders.length === 0) {
          log.info({ event: 'abandoned_order_cleanup_none_found' });
          return;
        }

        let cancelledCount = 0;

        for (const abandonedOrder of abandonedOrders) {
          const session = await mongoose.startSession();
          try {
            await session.withTransaction(async () => {
              // Restore stock for each item
              for (const item of abandonedOrder.items) {
                if (!item.product || !item.quantity) continue;

                if (item.size) {
                  await Product.updateOne(
                    { _id: item.product, 'sizes.size': item.size },
                    {
                      $inc: {
                        'sizes.$.stock': item.quantity,
                        stock: item.quantity,
                      },
                    },
                    { session },
                  );
                } else {
                  await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } },
                    { session },
                  );
                }
              }

              // Cancel the order
              await Order.updateOne(
                { _id: abandonedOrder._id },
                {
                  $set: {
                    status: 'cancelled',
                    'payment.status': 'expired',
                    cancellation: {
                      reason: 'Payment not completed within 30 minutes',
                      cancelledAt: new Date(),
                      cancelledBy: 'system',
                    },
                  },
                },
                { session },
              );
            });

            cancelledCount++;

            // Log stock movements (fire-and-forget, outside transaction)
            const movements = abandonedOrder.items
              .filter((item) => item.product && item.quantity)
              .map((item) => ({
                product: item.product,
                type: 'abandoned_order',
                quantity: item.quantity,
                size: item.size || null,
                orderId: abandonedOrder._id,
                orderCode: abandonedOrder.orderId,
                note: 'Abandoned order auto-cancelled — stock restored',
              }));
            StockMovement.insertMany(movements).catch((err) =>
              log.error('Failed to log stock movements (abandoned)', err),
            );
          } catch (err) {
            log.error({
              event: 'abandoned_order_cancel_failed',
              orderId: abandonedOrder.orderId,
              error: err.message,
            });
          } finally {
            session.endSession();
          }
        }

        if (cancelledCount > 0) {
          await invalidateCache('products:*');
        }

        log.info({
          event: 'abandoned_order_cleanup_complete',
          found: abandonedOrders.length,
          cancelled: cancelledCount,
        });
      } catch (err) {
        log.error({
          event: 'abandoned_order_cleanup_failed',
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
  scheduleAbandonedOrderCleanup();
  log.info('Scheduled cleanup jobs registered');
}

module.exports = { registerCleanupJobs };
