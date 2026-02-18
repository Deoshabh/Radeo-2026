const sharp = require('sharp');
const { log } = require('./logger');

/**
 * Image optimization presets
 */
const PRESETS = {
  product: {
    full: { width: 1200, height: 1200, quality: 82 },
    thumb: { width: 400, height: 400, quality: 75 },
    og: { width: 1200, height: 630, quality: 80 },
  },
  category: {
    full: { width: 1200, height: 800, quality: 82 },
    thumb: { width: 600, height: 400, quality: 75 },
  },
  banner: {
    full: { width: 1920, height: 800, quality: 85 },
    mobile: { width: 768, height: 600, quality: 80 },
  },
};

/**
 * Optimize an image buffer using sharp
 * @param {Buffer} inputBuffer - Raw image buffer
 * @param {Object} options
 * @param {number} [options.width=1200] - Max width
 * @param {number} [options.height=1200] - Max height
 * @param {number} [options.quality=82] - WebP quality (1-100)
 * @param {'webp'|'avif'|'jpeg'|'png'} [options.format='webp'] - Output format
 * @param {boolean} [options.stripMetadata=true] - Remove EXIF data
 * @returns {Promise<{buffer: Buffer, info: Object}>}
 */
async function optimizeImage(inputBuffer, options = {}) {
  const {
    width = 1200,
    height = 1200,
    quality = 82,
    format = 'webp',
    stripMetadata = true,
  } = options;

  let pipeline = sharp(inputBuffer);

  // Strip metadata (EXIF, GPS, camera info)
  if (stripMetadata) {
    pipeline = pipeline.rotate(); // Auto-rotate based on EXIF before stripping
  }

  // Resize (fit inside bounds, no upscale)
  pipeline = pipeline.resize(width, height, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Convert format
  switch (format) {
    case 'avif':
      pipeline = pipeline.avif({ quality, effort: 4 });
      break;
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9, palette: true });
      break;
    case 'webp':
    default:
      pipeline = pipeline.webp({ quality, effort: 4 });
      break;
  }

  const { data: buffer, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer,
    info: {
      width: info.width,
      height: info.height,
      format: info.format,
      size: info.size,
      originalSize: inputBuffer.length,
      savings: Math.round((1 - info.size / inputBuffer.length) * 100),
    },
  };
}

/**
 * Generate multiple variants of an image (e.g., full + thumbnail + OG)
 * @param {Buffer} inputBuffer
 * @param {'product'|'category'|'banner'} presetName
 * @returns {Promise<Object.<string, {buffer: Buffer, info: Object}>>}
 */
async function generateVariants(inputBuffer, presetName = 'product') {
  const preset = PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}`);
  }

  const results = {};
  const entries = Object.entries(preset);

  await Promise.all(
    entries.map(async ([variantName, config]) => {
      try {
        results[variantName] = await optimizeImage(inputBuffer, config);
      } catch (error) {
        log.error(`Failed to generate ${variantName} variant:`, error);
        results[variantName] = { error: error.message };
      }
    }),
  );

  return results;
}

/**
 * Get image metadata without processing
 * @param {Buffer} inputBuffer
 * @returns {Promise<Object>}
 */
async function getImageMetadata(inputBuffer) {
  const metadata = await sharp(inputBuffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    space: metadata.space,
    channels: metadata.channels,
    size: inputBuffer.length,
    hasAlpha: metadata.hasAlpha,
    isAnimated: metadata.pages > 1,
  };
}

module.exports = {
  optimizeImage,
  generateVariants,
  getImageMetadata,
  PRESETS,
};
