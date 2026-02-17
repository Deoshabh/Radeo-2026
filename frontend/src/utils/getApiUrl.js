/**
 * Smart API URL resolver — eliminates CORS by routing client-side
 * requests through the Next.js rewrite proxy (same origin).
 *
 * CLIENT-SIDE (browser):
 *   Returns "/api/v1"
 *   → browser makes same-origin request to radeo.in/api/v1/…
 *   → Next.js rewrites it to BACKEND_INTERNAL_URL/api/v1/… (see next.config.mjs)
 *   → Zero CORS, zero preflight, works even when Traefik returns 502
 *
 * SERVER-SIDE (SSR / ISR / sitemap):
 *   Returns the full backend URL (e.g. https://api.radeo.in/api/v1)
 *   so server-to-server fetches reach the backend directly.
 */
export function getApiUrl() {
  if (typeof window === 'undefined') {
    // Server-side: need full URL for server-to-server communication
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      `${process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:5000'}/api/v1`
    );
  }

  // Client-side: use Next.js rewrite proxy (same origin → no CORS)
  return '/api/v1';
}

export default getApiUrl;
