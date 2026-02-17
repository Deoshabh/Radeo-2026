import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Wishlist',
  description: 'Your saved items at Radeo.',
  noindex: true,
  nofollow: true,
});

export default function WishlistLayout({ children }) {
  return children;
}
