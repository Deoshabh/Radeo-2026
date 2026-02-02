'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }

    if (!product.sizes || product.sizes.length === 0) {
      toast.error('No sizes available');
      return;
    }

    // Add first available size - handle both string and object formats
    const firstSize = typeof product.sizes[0] === 'object' ? product.sizes[0].size : product.sizes[0];
    await addToCart(product._id, firstSize);
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      router.push('/auth/login');
      return;
    }

    await toggleWishlist(product._id);
  };

  const isProductInWishlist = isInWishlist(product._id);

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="card group overflow-hidden h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-primary-100">
          <Image
            src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all ${
              isProductInWishlist
                ? 'bg-red-500 text-white'
                : 'bg-white/80 text-primary-900 hover:bg-white'
            }`}
          >
            <FiHeart className={`w-5 h-5 ${isProductInWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Availability Badge */}
          {!product.inStock && (
            <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
              Unavailable
            </div>
          )}

          {/* Action Buttons on Hover */}
          {product.inStock && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(e).then(() => {
                    const router = require('next/navigation').useRouter;
                    if (typeof window !== 'undefined') {
                      window.location.href = '/cart';
                    }
                  });
                }}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
              >
                <FiShoppingCart className="w-4 h-4" />
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm py-2.5"
              >
                Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Category */}
          <p className="text-xs uppercase tracking-wider text-primary-600 mb-2">
            {product.category?.name || 'Shoes'}
          </p>

          {/* Name */}
          <h3 className="font-serif text-xl font-semibold text-primary-900 mb-2 group-hover:text-brand-brown transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-primary-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xl font-bold text-primary-800">
                ₹{product.price?.toLocaleString()}
              </p>
              
              {/* Sizes Available */}
              {product.sizes && product.sizes.length > 0 && (
                <p className="text-sm text-primary-600">
                  {product.sizes.length} sizes
                </p>
              )}
            </div>

            {/* Bottom Action Buttons - Always Visible */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!product.inStock) {
                    toast.error('Product currently unavailable');
                    return;
                  }
                  handleAddToCart(e).then(() => {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/cart';
                    }
                  });
                }}
                disabled={!product.inStock}
                className={`flex-1 btn text-sm py-2 ${
                  product.inStock 
                    ? 'btn-primary' 
                    : 'bg-primary-200 text-primary-500 cursor-not-allowed hover:bg-primary-200'
                }`}
              >
                {product.inStock ? 'Buy Now' : 'Out of Stock'}
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`btn text-sm py-2 px-3 ${
                  isProductInWishlist
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'btn-ghost'
                }`}
              >
                <FiHeart className={`w-5 h-5 ${isProductInWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
