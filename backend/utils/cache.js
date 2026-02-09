const redis = require('../config/redis');

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
            console.log(`⚡ Cache HIT: ${key}`);
            return JSON.parse(cachedData);
        }

        console.log(`MISS: ${key}`);
        const freshData = await callback();

        if (freshData !== undefined && freshData !== null) {
            await redis.set(key, JSON.stringify(freshData), 'EX', ttl);
        }

        return freshData;
    } catch (error) {
        console.error(`Cache Error [${key}]:`, error);
        // Fallback to fetch without cache on error
        return callback();
    }
};

/**
 * Invalidate cache by key pattern
 * @param {string} pattern - Key pattern (e.g., "products:*")
 */
exports.invalidateCache = async (pattern) => {
    try {
        const stream = redis.scanStream({
            match: pattern,
            count: 100
        });

        stream.on('data', async (keys) => {
            if (keys.length) {
                const pipeline = redis.pipeline();
                keys.forEach((key) => {
                    pipeline.del(key);
                });
                await pipeline.exec();
            }
        });

        stream.on('end', () => {
            console.log(`🧹 Cache invalidated for pattern: ${pattern}`);
        });
    } catch (error) {
        console.error('Cache Invalidation Error:', error);
    }
};
