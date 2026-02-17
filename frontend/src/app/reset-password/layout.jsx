import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Reset Password',
  noindex: true,
  nofollow: true,
});

export default function ResetPasswordLayout({ children }) {
  return children;
}
