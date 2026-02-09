'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import { FiHeart, FiArrowLeft } from 'react-icons/fi';

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
    <div className="min-h-screen bg-primary-50 pt-24">
      <div className="container-custom section-padding">
        <Link href="/products" className="inline-flex items-center gap-2 text-primary-600 hover:text-brand-brown mb-8">
          <FiArrowLeft />
          Continue Shopping
        </Link>

        <h1 className="font-serif text-4xl lg:text-5xl font-bold text-primary-900 mb-8">
          My Wishlist
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="spinner"></div>
          </div>
        ) : !wishlist || wishlist.length === 0 ? (
          <div className="text-center py-20">
            <FiHeart className="w-20 h-20 text-primary-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-primary-900 mb-2">Your wishlist is empty</h2>
            <p className="text-primary-600 mb-6">Save your favorite products here</p>
            <Link href="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <p className="text-primary-600 mb-8">{wishlist.length} items saved</p>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {wishlist.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
