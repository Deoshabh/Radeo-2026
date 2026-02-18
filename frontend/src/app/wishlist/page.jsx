'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import { FiArrowLeft } from 'react-icons/fi';

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { wishlist, loading } = useWishlist();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs tracking-[0.12em] uppercase mb-10 transition-colors duration-150 hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          Continue Shopping
        </Link>

        <div className="flex items-baseline gap-4 mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Saved Pieces
          </h1>
          {wishlist && wishlist.length > 0 && (
            <span className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              ({wishlist.length})
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="spinner"></div>
          </div>
        ) : !wishlist || wishlist.length === 0 ? (
          /* ── Branded empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-8 opacity-25">
              <path
                d="M36 62S8 44 8 24C8 14 16 6 26 6C31.5 6 36 9 36 9C36 9 40.5 6 46 6C56 6 64 14 64 24C64 44 36 62 36 62Z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
            <h2 className="font-serif text-2xl sm:text-3xl font-light mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Nothing saved yet
            </h2>
            <p className="text-sm max-w-xs mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Your taste is the only thing missing. Start saving pieces that speak to you.
            </p>
            <Link href="/products" className="btn-editorial">
              Explore the Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
            {wishlist.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
