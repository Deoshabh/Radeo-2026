const redis = require('../config/redis');
const { log } = require('./logger');

/**
 * Get data from cache or execute callback and set cache
 * @param {string} key - Cache key
 * @param {Function} callback - Async function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {Promise<any>} - Cached or fresh data
 */
exports.getOrSetCache = async (key, callback, ttl = 3600) => {
    try {
        const cachedData = await redis.get(key);
        if (cachedData) {
            log.debug(`Cache HIT: ${key}`);
            return JSON.parse(cachedData);
        }

        log.debug(`Cache MISS: ${key}`);
        const freshData = await callback();

        if (freshData !== undefined && freshData !== null) {
            await redis.set(key, JSON.stringify(freshData), 'EX', ttl);
        }

        return freshData;
    } catch (error) {
        log.error(`Cache Error [${key}]:`, error);
        // Fallback to fetch without cache on error
        return callback();
    }
};

/**
 * Invalidate cache by key pattern
 * @param {string} pattern - Key pattern (e.g., "products:*")
 */
exports.invalidateCache = (pattern) => {
    return new Promise((resolve, reject) => {
        try {
            const stream = redis.scanStream({
                match: pattern,
                count: 100
            });

            stream.on('data', async (keys) => {
                if (keys.length) {
                    stream.pause();
                    try {
                        const pipeline = redis.pipeline();
                        keys.forEach((key) => {
                            pipeline.del(key);
                        });
                        await pipeline.exec();
                    } catch (err) {
                        log.error('Cache pipeline error:', err);
                    }
                    stream.resume();
                }
            });

            stream.on('end', () => {
                resolve();
            });

            stream.on('error', (err) => {
                log.error('Cache Invalidation Error:', err);
                resolve(); // Don't reject â€” cache errors shouldn't crash callers
            });
        } catch (error) {
            log.error('Cache Invalidation Error:', error);
            resolve();
        }
    });
};
