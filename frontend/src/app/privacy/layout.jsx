import { generateMetadata as generateSEOMetadata } from '@/utils/seo';
import { buildPageMetadata } from '@/utils/seoFetcher';

const FALLBACK = {
  title: 'Privacy Policy',
  description: 'Read the Radeo privacy policy. Learn how we collect, use, and protect your personal information when you shop with us.',
  url: 'https://radeo.in/privacy',
  keywords: ['privacy policy', 'data protection', 'personal information'],
};

export async function generateMetadata() {
  const adminMeta = await buildPageMetadata('privacy', '/privacy');
  return adminMeta || generateSEOMetadata(FALLBACK);
}

export default function PrivacyLayout({ children }) {
  return children;
}
