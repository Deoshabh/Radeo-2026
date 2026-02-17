import { JsonLd, generateWebsiteJsonLd, generateOrganizationJsonLd, generateMetadata as generateSEOMetadata } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';
import RadeoHome from '@/components/storefront/RadeoHome';

const FALLBACK = {
  title: 'Radeo - Premium Handcrafted Shoes | Luxury Footwear Online',
  description: 'Shop premium handcrafted leather shoes at Radeo. Explore our exquisite collection of oxfords, derbys, brogues, loafers and more. Free shipping across India.',
  keywords: ['premium shoes', 'handcrafted leather shoes', 'luxury footwear India', 'buy shoes online', 'oxford shoes', 'derby shoes', 'loafers'],
  url: 'https://radeo.in',
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('home', '/');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function Home() {
  return (
    <>
      <JsonLd data={generateWebsiteJsonLd()} />
      <JsonLd data={generateOrganizationJsonLd()} />

      <RadeoHome />
    </>
  );
}
