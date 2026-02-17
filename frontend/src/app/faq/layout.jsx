import { generateMetadata as generateSEOMetadata, JsonLd, generateBreadcrumbJsonLd } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about Radeo — orders, shipping, returns, sizing, product care and more.',
  url: 'https://radeo.in/faq',
  keywords: ['FAQ', 'frequently asked questions', 'shoe sizing help', 'shipping questions', 'returns policy'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('faq', '/faq');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function FaqLayout({ children }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'FAQ', path: '/faq' },
        ])}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [],
        }}
      />
      {children}
    </>
  );
}
