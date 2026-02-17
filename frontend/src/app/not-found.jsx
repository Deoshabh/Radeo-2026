import Link from 'next/link';
import { generateMetadata as generateSEOMetadata } from '@/utils/seo';

export const metadata = generateSEOMetadata({
  title: '404 - Page Not Found',
  description: 'The page you are looking for could not be found. Browse our premium shoe collection instead.',
  noindex: true,
});

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-8xl font-bold text-[color:var(--color-brand-brown,#8B4513)] mb-4 font-[family-name:var(--font-playfair)]">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-[color:var(--color-text-primary,#1a1a1a)] mb-4 font-[family-name:var(--font-cormorant)]">
          Page Not Found
        </h2>
        <p className="text-[color:var(--color-text-secondary,#6b7280)] mb-8 leading-relaxed">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[color:var(--color-brand-brown,#8B4513)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Go Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-6 py-3 border border-[color:var(--color-brand-brown,#8B4513)] text-[color:var(--color-brand-brown,#8B4513)] rounded-lg hover:bg-[color:var(--color-brand-brown,#8B4513)] hover:text-white transition-colors font-medium"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
