import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Shopping Cart',
  description: 'Review items in your shopping cart at Radeo.',
  noindex: true,
  nofollow: true,
});

export default function CartLayout({ children }) {
  return children;
}
