import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd, generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/utils/seo';
import { SITE_SETTINGS_DEFAULTS } from '@/constants/siteSettingsDefaults';
import HomeSections from '@/components/storefront/HomeSections';

// Force dynamic rendering since we rely on external API data that changes
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// --- Data Fetching ---

async function getSiteSettings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch settings:', res.status, res.statusText);
      return SITE_SETTINGS_DEFAULTS;
    }

    const data = await res.json();
    return data.settings || SITE_SETTINGS_DEFAULTS;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return SITE_SETTINGS_DEFAULTS;
  }
}

async function getFeaturedProducts(limit = 8, selection = 'latest', manualIds = []) {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/products?limit=${limit}`;

    if (selection === 'top-rated') {
      url = `${process.env.NEXT_PUBLIC_API_URL}/products/top-rated?limit=${limit}`;
    } else if (selection === 'manual' && manualIds.length > 0) {
      url = `${process.env.NEXT_PUBLIC_API_URL}/products?ids=${manualIds.join(',')}`;
    }

    const res = await fetch(url, { cache: 'no-store' }); // Ensure fresh products
    if (!res.ok) return [];

    const data = await res.json();
    let products = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);

    // Manual sort
    if (selection === 'manual' && manualIds.length > 0) {
      const orderMap = new Map(manualIds.map((id, index) => [String(id), index]));
      products = products.sort((a, b) => (orderMap.get(String(a._id)) || 0) - (orderMap.get(String(b._id)) || 0));
    }

    // Random shuffle if needed
    if (selection === 'random') {
      products = products.sort(() => Math.random() - 0.5);
    }

    return products.slice(0, limit);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// --- Main Page Component ---

export default async function Home() {
  const settings = await getSiteSettings();

  const featuredSection = settings.homeSections?.featuredProducts || {};
  const products = await getFeaturedProducts(
    featuredSection.productLimit,
    featuredSection.productSelection,
    featuredSection.manualProductIds
  );

  return (
    <>
      <JsonLd data={generateWebsiteJsonLd()} />
      <JsonLd data={generateOrganizationJsonLd()} />

      <HomeSections initialSettings={settings} initialProducts={products} />
    </>
  );
}
