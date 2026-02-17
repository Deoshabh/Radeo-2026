import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'My Orders',
  description: 'View and track your orders at Radeo.',
  noindex: true,
  nofollow: true,
});

export default function OrdersLayout({ children }) {
  return children;
}
