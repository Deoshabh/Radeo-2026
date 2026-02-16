'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { toast } from 'react-hot-toast';
import anime from 'animejs';

const BLUR_DATA_URL = 'data:image/gray;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export default function ProductCard({ product, priority = false }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { settings } = useSiteSettings();

  const themeProducts = settings?.theme?.products || {};
  const cardStyle = themeProducts.cardStyle || 'shadow';
  const hoverEffect = themeProducts.hoverEffect || 'lift';
  const showSaleBadge = themeProducts.showSaleBadge !== false;
  const showRating = themeProducts.showRating !== false;
  const showInstallment = themeProducts.showInstallmentText !== false;

  const rawAverageRating =
    product?.averageRating ?? product?.ratings?.average ?? product?.rating ?? 0;
  const averageRating = Number.isFinite(Number(rawAverageRating))
    ? Number(rawAverageRating)
    : 0;
  const rawReviewCount =
    product?.numReviews ?? product?.ratings?.count ?? product?.reviewCount ?? 0;
  const reviewCount = Number.isFinite(Number(rawReviewCount))
    ? Number(rawReviewCount)
    : 0;
  const shouldShowRating = showRating && averageRating > 0;

  const categoryLabel = typeof product.category === 'object'
    ? product.category?.name
    : product.category;

  // Compute Card Classes based on Theme
  const getCardClasses = () => {
    let classes = 'card group overflow-hidden h-full flex flex-col transition-all duration-300 ';

    // Card Style
    switch (cardStyle) {
      case 'minimal': classes += 'border border-gray-100 '; break;
      case 'bordered': classes += 'border border-gray-200 '; break;
      case 'glass': classes += 'backdrop-blur-md bg-white/40 border border-white/50 '; break;
      case 'shadow': default: classes += 'bg-white shadow-sm '; break;
    }

    // Hover Effect
    switch (hoverEffect) {
      case 'lift': classes += 'hover:-translate-y-1 hover:shadow-lg '; break;
      case 'none': break;
      // Zoom and Color Shift handled in image/content
      default: classes += 'hover:shadow-md '; break;
    }
    return classes;
  };

  const getHoverImageClasses = () => {
    let classes = 'object-cover transition-transform duration-500 ';
    if (hoverEffect === 'zoom') classes += 'group-hover:scale-110 ';
    return classes;
  };

  // ... (flyToCart, handleAddToCart, etc. - keep existing)
  const flyToCart = (e) => {
    try {
      const card = e.currentTarget.closest('.card');
      const img = card?.querySelector('img');
      const cartIcon = document.getElementById('cart-icon-container');

      if (!img || !cartIcon) return;

      const imgRect = img.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      const clone = img.cloneNode();
      clone.style.position = 'fixed';
      clone.style.left = `${imgRect.left}px`;
      clone.style.top = `${imgRect.top}px`;
      clone.style.width = `${imgRect.width}px`;
      clone.style.height = `${imgRect.height}px`;
      clone.style.zIndex = '9999';
      clone.style.borderRadius = '50%';
      clone.style.opacity = '0.8';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);

      anime({
        targets: clone,
        left: cartRect.left + cartRect.width / 2 - 20,
        top: cartRect.top + cartRect.height / 2 - 20,
        width: 40,
        height: 40,
        opacity: [0.8, 0],
        duration: 800,
        easing: 'cubicBezier(.5, .05, .1, .3)',
        complete: () => {
          clone.remove();
        }
      });
    } catch (error) {
      console.error("Animation error:", error);
    }
  };

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

    // Trigger animation before async add to feel instant
    flyToCart(e);

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
      <div className={getCardClasses()}>
        {/* Image Container */}
        <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-primary-100">
          <Image
            src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.svg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={getHoverImageClasses()}
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

          {/* Sale Badge from Theme */}
          {showSaleBadge && product.comparePrice > product.price && product.inStock && (
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 px-2 py-1 sm:px-3 bg-black text-white text-[10px] sm:text-xs font-medium">
              SALE
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

          {shouldShowRating && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => {
                  const filled = index < Math.round(averageRating);
                  return (
                    <FiStar
                      key={`rating-star-${product._id || product.slug || index}-${index}`}
                      className={`w-3.5 h-3.5 ${filled ? 'fill-current' : ''}`}
                    />
                  );
                })}
              </div>
              <span className="text-xs text-primary-600">
                {averageRating.toFixed(1)}
                {reviewCount > 0 ? ` (${reviewCount})` : ''}
              </span>
            </div>
          )}

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
                {showInstallment && (
                  <p className="text-[10px] text-gray-500 mt-1">Pay in 3 interest-free installments</p>
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
