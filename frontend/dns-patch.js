/**
 * DNS Patch to bypass Cloudflare for MinIO internal connection
 * 
 * Usage: node --require ./dns-patch.js server.js
 */
const dns = require('dns');

const originalLookup = dns.lookup;
const BYPASS_HOSTS = {
  'minio.radeo.in': '157.173.218.96',
  'api.minio.radeo.in': '157.173.218.96',
};

dns.lookup = function (hostname, options, callback) {
  // Handle optional options argument
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (!options) {
    options = {};
  }

  // Check if we need to bypass
  const bypassIP = BYPASS_HOSTS[hostname];
  if (bypassIP) {
    console.log(`[DNS-PATCH] Intercepted lookup for: ${hostname}`);
    
    // Handle 'all: true' option which expects an array
    if (options.all) {
      console.log(`[DNS-PATCH] Returning array for ${hostname} -> ${bypassIP}`);
      return callback(null, [{ address: bypassIP, family: 4 }]);
    }
    
    console.log(`[DNS-PATCH] Returning single IP for ${hostname} -> ${bypassIP}`);
    return callback(null, bypassIP, 4);
  }

  // Fallback to original lookup
  return originalLookup(hostname, options, callback);
};

// Also patch promises API if needed (Node 18+)
if (dns.promises && dns.promises.lookup) {
  const originalPromiseLookup = dns.promises.lookup;
  dns.promises.lookup = async function (hostname, options) {
    options = options || {};
    
    const bypassIP = BYPASS_HOSTS[hostname];
    if (bypassIP) {
      console.log(`[DNS-PATCH] Intercepted Promise lookup for: ${hostname}`);
      
      if (options.all) {
        return [{ address: bypassIP, family: 4 }];
      }
      return { address: bypassIP, family: 4 };
    }
    
    return originalPromiseLookup(hostname, options);
  };
}

console.log('[DNS-PATCH] Loaded custom DNS overrides for MinIO (v2)');
