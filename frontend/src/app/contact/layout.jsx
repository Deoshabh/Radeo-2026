import { generateMetadata as generateSEOMetadata, JsonLd, generateBreadcrumbJsonLd } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'Contact Us',
  description: 'Get in touch with Radeo. Reach out for questions about orders, products, returns or anything else. We are here to help.',
  url: 'https://radeo.in/contact',
  keywords: ['contact Radeo', 'customer support', 'shoe store contact', 'help'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('contact', '/contact');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function ContactLayout({ children }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' },
        ])}
      />
      {children}
    </>
  );
}
