import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'My Profile',
  description: 'Manage your Radeo account and profile settings.',
  noindex: true,
  nofollow: true,
});

export default function ProfileLayout({ children }) {
  return children;
}
