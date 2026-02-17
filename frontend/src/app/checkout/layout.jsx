import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Checkout',
  description: 'Complete your purchase at Radeo.',
  noindex: true,
  nofollow: true,
});

export default function CheckoutLayout({ children }) {
  return children;
}
