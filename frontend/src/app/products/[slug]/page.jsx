import { cache } from 'react';
import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import { generateProductMetadata } from '@/utils/seo';
import { getApiUrl } from '@/utils/getApiUrl';

const getProduct = cache(async function getProduct(slug) {
  try {
    const res = await fetch(`${getApiUrl()}/products/${slug}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds (SSG/ISR)
    });

    if (!res.ok) {
      console.error(`[ProductSSR] Failed to fetch: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(`[ProductSSR] Response: ${text}`);
      return null;
    }

    const data = await res.json();
    return data?.product || data?.data || data || null;
  } catch (error) {
    console.error('[ProductSSR] Fetch Error:', error);
    return null;
  }
});

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found | Radeo',
      robots: { index: false },
    };
  }

  return generateProductMetadata(product);
}

import { JsonLd, generateProductJsonLd } from '@/utils/seo';

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <JsonLd data={generateProductJsonLd(product)} />
      <ProductClient product={product} />
    </>
  );
}
