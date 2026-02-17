import { generateMetadata as generateSEOMetadata, JsonLd, generateBreadcrumbJsonLd } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'Shop Premium Shoes',
  description: 'Browse our complete collection of premium handcrafted shoes. Filter by category, material, color and price. Free shipping on orders across India.',
  url: 'https://radeo.in/products',
  keywords: ['buy shoes online', 'premium shoes collection', 'leather shoes India', 'shop footwear', 'handcrafted shoes online'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('products', '/products');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function ProductsLayout({ children }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Products', path: '/products' },
        ])}
      />
      {children}
    </>
  );
}
