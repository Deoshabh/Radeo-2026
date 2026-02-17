import { generateMetadata as generateSEOMetadata, JsonLd, generateBreadcrumbJsonLd } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'Shipping Information',
  description: 'Learn about Radeo shipping policies, delivery times, shipping costs, and delivery zones across India.',
  url: 'https://radeo.in/shipping',
  keywords: ['shipping policy', 'delivery times', 'shipping costs India', 'free shipping shoes'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('shipping', '/shipping');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function ShippingLayout({ children }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shipping', path: '/shipping' },
        ])}
      />
      {children}
    </>
  );
}
