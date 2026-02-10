'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Tiny 1x1 neutral blur placeholder (avoids layout shift)
const BLUR_DATA_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN89OhRPQAIhwMwaKSvfQAAAABJRU5ErkJggg==';

export default function ProductCard({ product, priority = false }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const categoryLabel =
    typeof product.category === 'object'
      ? product.category?.name
      : product.category;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      router.push('/auth/login');
      return false;
    }

    if (!product.sizes || product.sizes.length === 0) {
      toast.error('No sizes available');
      return false;
    }

    // Add first available size - handle both string and object formats
    const firstSize =
      typeof product.sizes[0] === 'object' ? product.sizes[0].size : product.sizes[0];
    const result = await addToCart(product._id, firstSize);
    return result.success;
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
      <div className="card group overflow-hidden h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
        {/* Image Container */}
        <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-primary-100">
          <Image
            src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.svg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            priority={priority}
          />

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            aria-label={isProductInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            className={`absolute top-2 right-2 sm:top-4 sm:right-4 p-2 sm:p-2.5 rounded-full backdrop-blur-sm transition-all shadow-md ${isProductInWishlist
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-primary-900 hover:bg-white active:scale-95'
              }`}
          >
            <FiHeart className={`w-4 h-4 sm:w-5 sm:h-5 ${isProductInWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Availability Badge */}
          {!product.inStock && (
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-3 bg-red-500 text-white text-[10px] sm:text-xs font-medium rounded-full">
              Unavailable
            </div>
          )}

          {/* Action Buttons on Hover - Hidden on mobile, shown on hover on desktop */}
          <div className="hidden sm:flex absolute bottom-4 left-4 right-4 gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            {product.inStock ? (
              <>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const result = await handleAddToCart(e);
                    if (result !== false) {
                      router.push('/cart');
                    }
                  }}
                  aria-label="Buy now"
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
                >
                  <FiShoppingCart className="w-4 h-4" />
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  aria-label="Add to cart"
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm py-2.5"
                >
                  <FiShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </>
            ) : (
              <button
                disabled
                className="flex-1 btn bg-primary-200 text-primary-500 cursor-not-allowed text-sm py-2.5"
              >
                Out of Stock
              </button>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4 md:p-6 flex-1 flex flex-col">
          {/* Category */}
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-primary-600 mb-1 sm:mb-1.5">
            {categoryLabel || 'Uncategorized'}
          </p>

          {/* Name */}
          <h3 className="font-serif text-sm sm:text-base md:text-lg font-semibold text-primary-900 mb-1.5 sm:mb-2 group-hover:text-brand-brown transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Description - Hidden on mobile */}
          {product.description && (
            <p className="hidden sm:block text-xs text-primary-600 mb-2 line-clamp-1">{product.description}</p>
          )}

          {/* Price */}
          <div className="mt-auto">
            {/* Price with Discount */}
            {product.comparePrice && product.comparePrice > product.price ? (
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-green-600">
                    ₹{(product.price ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 line-through">
                    ₹{(product.comparePrice ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span className="bg-red-500 text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}% OFF
                  </span>
                </div>
                {product.sizes && product.sizes.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-primary-600">
                    {product.sizes.length} sizes
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-base sm:text-lg md:text-xl font-bold text-primary-800">
                  ₹{(product.price ?? 0).toLocaleString('en-IN')}
                </p>
                {product.sizes && product.sizes.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-primary-600">
                    {product.sizes.length} sizes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
