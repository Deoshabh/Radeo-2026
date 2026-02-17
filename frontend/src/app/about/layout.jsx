import { generateMetadata as generateSEOMetadata, JsonLd, generateOrganizationJsonLd, generateBreadcrumbJsonLd } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'About Us',
  description: 'Learn about Radeo — our passion for premium handcrafted shoes, our story, values, and commitment to quality craftsmanship and sustainable practices.',
  url: 'https://radeo.in/about',
  keywords: ['about Radeo', 'handcrafted shoes brand', 'premium shoe maker India', 'luxury footwear craftsmanship'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('about', '/about');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function AboutLayout({ children }) {
  return (
    <>
      <JsonLd data={generateOrganizationJsonLd()} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'About Us', path: '/about' },
        ])}
      />
      {children}
    </>
  );
}
