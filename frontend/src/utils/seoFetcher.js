/**
 * Server-side SEO data fetcher
 * Fetches SEO settings from the API and generates metadata for each page.
 * Used in layout.jsx / page.jsx files via generateMetadata or export const metadata.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.radeo.in/api/v1';

let cachedSeo = null;
let cacheTimestamp = 0;
const CACHE_TTL = 15_000; // 15 seconds

/**
 * Fetch SEO settings from backend (with in-memory cache for build/SSR)
 */
export async function fetchSeoSettings() {
  const now = Date.now();

  if (cachedSeo && now - cacheTimestamp < CACHE_TTL) {
    return cachedSeo;
  }

  try {
    const res = await fetch(`${API_URL}/seo/public`, {
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      console.warn('[SEO] Failed to fetch SEO settings:', res.status);
      return null;
    }

    const data = await res.json();
    cachedSeo = data.seoSettings || null;
    cacheTimestamp = now;
    return cachedSeo;
  } catch (err) {
    console.warn('[SEO] Error fetching SEO settings:', err.message);
    return null;
  }
}

/**
 * Get SEO config for a specific page.
 * Falls back to hardcoded defaults if the API doesn't return data.
 */
export async function getPageSeo(pageKey) {
  const seo = await fetchSeoSettings();

  if (!seo?.pages?.[pageKey]) {
    return null; // no admin-configured SEO → layouts use their hardcoded defaults
  }

  return {
    global: seo.global || {},
    page: seo.pages[pageKey],
  };
}

/**
 * Build a Next.js metadata object from admin SEO settings for a given page key.
 * Returns null if no admin config exists (so the layout can use its hardcoded fallback).
 */
export async function buildPageMetadata(pageKey, pagePath) {
  const seoData = await getPageSeo(pageKey);
  if (!seoData || !seoData.page?.title) return null;

  const { global: g, page: p } = seoData;
  const siteName = g.siteName || 'Radeo';
  const siteUrl = g.siteUrl || 'https://radeo.in';
  const fullTitle = `${p.title} | ${siteName}`;
  const url = `${siteUrl}${pagePath}`;
  const ogImage = p.ogImage || (g.defaultOgImage ? `${siteUrl}${g.defaultOgImage}` : `${siteUrl}/og-image.jpg`);
  const twitterHandle = g.twitterHandle || '@radeo_in';

  const metadata = {
    title: fullTitle,
    description: p.description || '',
    keywords: p.keywords || '',
    openGraph: {
      title: fullTitle,
      description: p.description || '',
      url,
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: p.description || '',
      images: [ogImage],
      site: twitterHandle,
      creator: twitterHandle,
    },
    alternates: {
      canonical: url,
    },
  };

  if (g.googleVerification) {
    metadata.verification = { ...metadata.verification, google: g.googleVerification };
  }
  if (g.yandexVerification) {
    metadata.verification = { ...metadata.verification, yandex: g.yandexVerification };
  }

  if (p.noindex) {
    metadata.robots = {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    };
  }

  return metadata;
}
