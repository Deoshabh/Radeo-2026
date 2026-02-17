import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: 'Forgot Password',
  noindex: true,
  nofollow: true,
});

export default function ForgotPasswordLayout({ children }) {
  return children;
}
