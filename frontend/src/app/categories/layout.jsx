import { generateMetadata as generateSEOMetadata, JsonLd, generateBreadcrumbJsonLd } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'Shop by Category',
  description: 'Explore our premium shoe categories — oxfords, derbys, brogues, loafers, boots and more. Find the perfect handcrafted pair for every occasion.',
  url: 'https://radeo.in/categories',
  keywords: ['shoe categories', 'types of shoes', 'oxford shoes', 'derby shoes', 'brogue shoes', 'loafers', 'boots'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('categories', '/categories');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function CategoriesLayout({ children }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Categories', path: '/categories' },
        ])}
      />
      {children}
    </>
  );
}
