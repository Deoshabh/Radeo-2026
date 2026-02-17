import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Category',
  description: 'Browse premium handcrafted shoes in this category at Radeo.',
  url: 'https://radeo.in/category',
});

export default function CategorySlugLayout({ children }) {
  return children;
}
