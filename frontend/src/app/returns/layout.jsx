import { generateMetadata as generateSEOMetadata, JsonLd, generateBreadcrumbJsonLd } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'Return & Refund Policy',
  description: 'Learn about the Radeo return and refund policy. Easy returns, hassle-free refunds, and our satisfaction guarantee.',
  url: 'https://radeo.in/returns',
  keywords: ['return policy', 'refund policy', 'easy returns', 'exchange shoes'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('returns', '/returns');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function ReturnsLayout({ children }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Returns', path: '/returns' },
        ])}
      />
      {children}
    </>
  );
}
