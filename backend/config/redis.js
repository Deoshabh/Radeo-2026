/**
 * Valkey/Redis Configuration — Dual Database
 *
 * DB 0: Cache (TTL-based, evictable via allkeys-lru)
 * DB 1: Auth tokens (must persist, never evict)
 *
 * Exports: cacheClient, tokenClient, default (cacheClient for backward compat)
 */

const Redis = require("ioredis");
const { log } = require("../utils/logger");

const getBaseConfig = () => {
  const base = {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    enableReadyCheck: true,
    lazyConnect: false,
    enableOfflineQueue: true,
  };

  if (process.env.REDIS_URL) {
    return { ...base, connectionName: "radeo" };
  }

  return {
    ...base,
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    connectionName: "radeo",
  };
};

function createClient(db, label) {
  const config = getBaseConfig();

  let client;
  if (process.env.REDIS_URL) {
    client = new Redis(process.env.REDIS_URL, { ...config, db });
  } else {
    client = new Redis({ ...config, db });
  }

  client.on("connect", () => {
    log.success(`Valkey ${label} (DB ${db}) connected`);
  });

  client.on("error", (err) => {
    log.error(`Valkey ${label} (DB ${db}) error: ${err.message}`);
  });

  client.on("reconnecting", () => {
    log.warn(`Valkey ${label} (DB ${db}) reconnecting...`);
  });

  return client;
}

/** DB 0 — cache (evictable) */
const cacheClient = createClient(0, "cache");

/** DB 1 — auth tokens (persistent) */
const tokenClient = createClient(1, "tokens");

/**
 * Health check for Valkey — returns status + metrics
 */
async function checkRedisHealth() {
  const result = {
    status: "disconnected",
    usedMemory: null,
    hitRate: null,
    connectedClients: null,
  };

  try {
    if (cacheClient.status !== "ready" && cacheClient.status !== "connect") {
      return result;
    }

    await cacheClient.ping();
    const info = await cacheClient.info("memory");
    const statsInfo = await cacheClient.info("stats");
    const clientsInfo = await cacheClient.info("clients");

    const memMatch = info.match(/used_memory_human:(\S+)/);
    const hitsMatch = statsInfo.match(/keyspace_hits:(\d+)/);
    const missesMatch = statsInfo.match(/keyspace_misses:(\d+)/);
    const clientsMatch = clientsInfo.match(/connected_clients:(\d+)/);

    result.status = "operational";
    result.usedMemory = memMatch ? memMatch[1] : "unknown";
    result.connectedClients = clientsMatch ? parseInt(clientsMatch[1]) : 0;

    if (hitsMatch && missesMatch) {
      const hits = parseInt(hitsMatch[1]);
      const misses = parseInt(missesMatch[1]);
      const total = hits + misses;
      result.hitRate = total > 0 ? `${((hits / total) * 100).toFixed(1)}%` : "0%";
    }

    return result;
  } catch {
    result.status = "error";
    return result;
  }
}

// Default export = cacheClient for backward compatibility
// (all existing `require('../config/redis')` calls continue working)
module.exports = cacheClient;
module.exports.cacheClient = cacheClient;
module.exports.tokenClient = tokenClient;
module.exports.checkRedisHealth = checkRedisHealth;
