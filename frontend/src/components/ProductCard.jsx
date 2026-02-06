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
      <div className="card group overflow-hidden h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-primary-100">
          <Image
            src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
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
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
                >
                  <FiShoppingCart className="w-4 h-4" />
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
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
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          {/* Category */}
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-primary-600 mb-1">
            {categoryLabel || 'Uncategorized'}
          </p>

          {/* Name */}
          <h3 className="font-serif text-base sm:text-lg font-semibold text-primary-900 mb-2 group-hover:text-brand-brown transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-primary-600 mb-2 line-clamp-1">{product.description}</p>
          )}

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center justify-between">
              <p className="text-base sm:text-lg font-bold text-primary-800">
                {`\u20B9${(product.price ?? 0).toLocaleString('en-IN')}`}
              </p>

              {/* Sizes Available */}
              {product.sizes && product.sizes.length > 0 && (
                <p className="text-[10px] sm:text-xs text-primary-600">
                  {product.sizes.length} sizes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
