/**
 * Image Processing Queue (BullMQ)
 *
 * Processes uploaded images into responsive variants (thumb, card, full)
 * using Sharp. Stores variants back in MinIO/S3 and updates the Media
 * document with variant keys.
 *
 * Requires `bullmq` npm package and a running Valkey/Redis instance.
 *
 * Usage:
 *   const { imageQueue } = require('./services/imageProcessingQueue');
 *   await imageQueue.add('process', { bucket, key, mediaId });
 */

const { Queue, Worker } = require('bullmq');
const sharp = require('sharp');
const { uploadBuffer } = require('../utils/minio');
const Media = require('../models/Media');
const { log } = require('../utils/logger');

/**
 * BullMQ needs an ioredis-compatible connection object.
 * Re-use the same Valkey config the rest of the app uses.
 */
function getRedisConnection() {
  const opts = {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,    // required by BullMQ
  };

  if (process.env.REDIS_URL) {
    return { ...opts, url: process.env.REDIS_URL };
  }

  return {
    ...opts,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}

/** Variant specs — name, max dimensions, fit strategy */
const VARIANTS = [
  { name: 'thumb', width: 200, height: 200, fit: 'cover' },
  { name: 'card', width: 600, height: 600, fit: 'inside' },
  { name: 'full', width: 1200, height: 1200, fit: 'inside' },
];

const connection = getRedisConnection();

/** Queue: producers call imageQueue.add('process', { ... }) */
const imageQueue = new Queue('image-processing', { connection });

/** Worker: processes jobs from the queue */
const imageWorker = new Worker(
  'image-processing',
  async (job) => {
    const { bucket, key, mediaId } = job.data;

    log.info({ event: 'image_process_start', mediaId, key });

    // We use the minio getObject via the raw client — but since the exported
    // API doesn't expose getObject, we download via the publicly-accessible
    // storage URL already stored on the Media document.
    const media = await Media.findById(mediaId).lean();
    if (!media) {
      throw new Error(`Media ${mediaId} not found`);
    }

    // Fetch original via HTTP (works with CDN or direct storage URL)
    const sourceUrl = media.storageUrl || media.cdnUrl;
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch source image: ${response.status}`);
    }
    const originalBuffer = Buffer.from(await response.arrayBuffer());

    const variants = {};

    for (const variant of VARIANTS) {
      const variantKey = key.replace(/\.[^.]+$/, `_${variant.name}.webp`);

      const processedBuffer = await sharp(originalBuffer)
        .resize(variant.width, variant.height, {
          fit: variant.fit,
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      await uploadBuffer(processedBuffer, variantKey, 'image/webp', bucket);

      variants[variant.name] = variantKey;
    }

    // Update Media document with variant keys
    await Media.findByIdAndUpdate(mediaId, {
      $set: { variants, processedAt: new Date() },
    });

    log.info({ event: 'image_processed', mediaId, variants: Object.keys(variants) });
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 }, // max 10 jobs per minute
  },
);

imageWorker.on('failed', (job, err) => {
  log.error({
    event: 'image_process_failed',
    jobId: job?.id,
    mediaId: job?.data?.mediaId,
    error: err.message,
  });
});

imageWorker.on('completed', (job) => {
  log.info({
    event: 'image_process_completed',
    jobId: job.id,
    mediaId: job.data.mediaId,
  });
});

module.exports = { imageQueue, imageWorker, VARIANTS };
