/**
 * DNS Patch to bypass Cloudflare for MinIO internal connection
 * 
 * Usage: node --require ./dns-patch.js server.js
 */
const dns = require('dns');

const originalLookup = dns.lookup;
const BYPASS_HOSTS = {
  'minio.radeo.in': '157.173.218.96',
  'api.minio.radeo.in': '157.173.218.96', // Just in case
};

dns.lookup = function (hostname, options, callback) {
  if (arguments.length === 2) {
    callback = options;
    options = {};
  }

  if (BYPASS_HOSTS[hostname]) {
    // console.log(`[DNS-PATCH] Bypassing ${hostname} -> ${BYPASS_HOSTS[hostname]}`);
    return callback(null, BYPASS_HOSTS[hostname], 4);
  }

  return originalLookup(hostname, options, callback);
};

// Also patch promises API if needed (Node 18+)
if (dns.promises && dns.promises.lookup) {
  const originalPromiseLookup = dns.promises.lookup;
  dns.promises.lookup = async function (hostname, options) {
    if (BYPASS_HOSTS[hostname]) {
      // console.log(`[DNS-PATCH] Bypassing (Promise) ${hostname} -> ${BYPASS_HOSTS[hostname]}`);
      return { address: BYPASS_HOSTS[hostname], family: 4 };
    }
    return originalPromiseLookup(hostname, options);
  };
}

console.log('[DNS-PATCH] Loaded custom DNS overrides for MinIO');
