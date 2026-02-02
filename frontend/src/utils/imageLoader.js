/**
 * Custom image loader for Next.js Image component
 * Bypasses Next.js image optimization for external URLs
 * This prevents 400 errors when loading images from MinIO/external sources
 */
export default function imageLoader({ src, width, quality }) {
  // If it's an external URL (from MinIO or other sources), return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  // For local/relative paths, you could add custom logic here
  return src;
}
