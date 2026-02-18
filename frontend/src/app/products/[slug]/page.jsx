import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';
import { generateProductMetadata } from '@/utils/seo';

async function getProduct(slug) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${slug}`, {
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
}

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

import ProductSchema from '@/components/ProductSchema';

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductSchema product={product} />
      <ProductClient product={product} />
    </>
  );
}
