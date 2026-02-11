import { notFound } from 'next/navigation';
import ProductClient from './ProductClient';

async function getProduct(slug) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${slug}`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds (SSG/ISR)
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found | Radeo',
    };
  }

  return {
    title: `${product.name} | Radeo`,
    description: product.description?.substring(0, 160),
    openGraph: {
      images: product.images?.[0]?.url || [],
    },
  };
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductClient product={product} />;
}
