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
  const showRating = themeProducts.showRating !== false;

  const rawAverageRating = product?.averageRating ?? product?.ratings?.average ?? product?.rating ?? 0;
  const averageRating = Number.isFinite(Number(rawAverageRating)) ? Number(rawAverageRating) : 0;
  const rawReviewCount = product?.numReviews ?? product?.ratings?.count ?? product?.reviewCount ?? 0;
  const reviewCount = Number.isFinite(Number(rawReviewCount)) ? Number(rawReviewCount) : 0;
  const shouldShowRating = showRating && averageRating > 0;

  const categoryLabel = typeof product.category === 'object' ? product.category?.name : product.category;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPercent = hasDiscount ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
  const isProductInWishlist = isInWishlist(product._id);

  const flyToCart = (e) => {
    try {
      const card = e.currentTarget.closest('.product-card');
      const img = card?.querySelector('img');
      const cartIcon = document.getElementById('cart-icon-container');
      if (!img || !cartIcon) return;
      const imgRect = img.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();
      const clone = img.cloneNode();
      Object.assign(clone.style, {
        position: 'fixed', left: `${imgRect.left}px`, top: `${imgRect.top}px`,
        width: `${imgRect.width}px`, height: `${imgRect.height}px`,
        zIndex: '9999', borderRadius: '50%', opacity: '0.8', pointerEvents: 'none',
      });
      document.body.appendChild(clone);
      anime({
        targets: clone,
        left: cartRect.left + cartRect.width / 2 - 20,
        top: cartRect.top + cartRect.height / 2 - 20,
        width: 40, height: 40, opacity: [0.8, 0],
        duration: 800, easing: 'cubicBezier(.5, .05, .1, .3)',
        complete: () => clone.remove(),
      });
    } catch (err) { console.error('Animation error:', err); }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); router.push('/auth/login'); return false; }
    if (!product.sizes || product.sizes.length === 0) { toast.error('No sizes available'); return false; }
    const firstSize = typeof product.sizes[0] === 'object' ? product.sizes[0].size : product.sizes[0];
    flyToCart(e);
    const result = await addToCart(product._id, firstSize);
    return result.success;
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add items to wishlist'); router.push('/auth/login'); return; }
    await toggleWishlist(product._id);
  };

  return (
    <Link href={`/products/${product.slug}`}>
      <div className="product-card group relative bg-white overflow-hidden h-full flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">

        {/* ── Image ── */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f5f2ed]">
          <Image
            src={product.images?.[0]?.url || product.images?.[0] || '/placeholder.svg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            priority={priority}
          />

          {/* Discount badge — top left */}
          {hasDiscount && product.inStock && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#c9a96e] text-white text-[10px] font-bold tracking-wider uppercase"
              style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
              {discountPercent}% OFF
            </div>
          )}

          {/* Out of stock badge */}
          {!product.inStock && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#2a1a0a] text-[#f2ede4] text-[10px] font-bold tracking-wider uppercase"
              style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
              Sold Out
            </div>
          )}

          {/* Wishlist */}
          <button
            onClick={handleToggleWishlist}
            aria-label={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-300 ${
              isProductInWishlist
                ? 'bg-red-500 text-white shadow-lg shadow-red-200'
                : 'bg-white/80 text-[#2a1a0a] hover:bg-white hover:shadow-md'
            }`}
          >
            <FiHeart className={`w-4 h-4 ${isProductInWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* Quick actions on hover */}
          <div className="hidden sm:flex absolute bottom-0 left-0 right-0 gap-0 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400">
            {product.inStock ? (
              <>
                <button
                  onClick={handleAddToCart}
                  aria-label="Add to cart"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#2a1a0a]/90 backdrop-blur-sm text-[#f2ede4] text-[10px] font-medium uppercase tracking-[0.15em] hover:bg-[#2a1a0a] transition-colors"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                >
                  <FiShoppingCart className="w-3.5 h-3.5" />
                  Add to Cart
                </button>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const result = await handleAddToCart(e);
                    if (result !== false) router.push('/cart');
                  }}
                  aria-label="Buy now"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#c9a96e]/90 backdrop-blur-sm text-white text-[10px] font-medium uppercase tracking-[0.15em] hover:bg-[#c9a96e] transition-colors"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
                >
                  Buy Now
                </button>
              </>
            ) : (
              <div className="flex-1 py-3 text-center bg-[#e8e0d0]/90 text-[#8a7460] text-[10px] font-medium uppercase tracking-[0.15em]"
                style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                Out of Stock
              </div>
            )}
          </div>
        </div>

        {/* ── Product Info ── */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">

          {/* Category */}
          <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] mb-1.5"
            style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
            {categoryLabel || 'Uncategorized'}
          </p>

          {/* Name */}
          <h3 className="text-sm sm:text-[15px] font-semibold text-[#2a1a0a] mb-2 group-hover:text-[#5c3d1e] transition-colors line-clamp-2 leading-snug"
            style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            {product.name}
          </h3>

          {/* Rating */}
          {shouldShowRating && (
            <div className="flex items-center gap-1 mb-2.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <FiStar
                    key={`star-${product._id || index}-${index}`}
                    className={`w-3 h-3 ${index < Math.round(averageRating)
                      ? 'fill-[#c9a96e] text-[#c9a96e]'
                      : 'text-[#e8e0d0]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[#8a7460]"
                style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                {averageRating.toFixed(1)}{reviewCount > 0 ? ` (${reviewCount})` : ''}
              </span>
            </div>
          )}

          {/* Price — always at bottom */}
          <div className="mt-auto pt-2 border-t border-[#f2ede4]">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                {/* Offer price — prominent */}
                <span className="text-lg sm:text-xl font-bold text-[#2a1a0a]"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                  ₹{(product.price ?? 0).toLocaleString('en-IN')}
                </span>
                {/* Original price — struck through */}
                <span className="text-xs sm:text-sm text-[#b0a090] line-through"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                  ₹{(product.comparePrice ?? 0).toLocaleString('en-IN')}
                </span>
                {/* Savings */}
                <span className="text-[10px] font-bold text-[#c9a96e] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                  Save ₹{((product.comparePrice - product.price) ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-xl font-bold text-[#2a1a0a]"
                  style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                  ₹{(product.price ?? 0).toLocaleString('en-IN')}
                </span>
                {product.sizes && product.sizes.length > 0 && (
                  <span className="text-[10px] text-[#8a7460]"
                    style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
                    {product.sizes.length} sizes
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile add-to-cart button */}
        <div className="sm:hidden px-4 pb-4">
          {product.inStock ? (
            <button
              onClick={handleAddToCart}
              className="w-full py-2.5 bg-[#2a1a0a] text-[#f2ede4] text-[10px] font-medium uppercase tracking-[0.15em] hover:bg-[#5c3d1e] transition-colors"
              style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}
            >
              <FiShoppingCart className="w-3.5 h-3.5 inline mr-1.5" />
              Add to Cart
            </button>
          ) : (
            <div className="w-full py-2.5 bg-[#e8e0d0] text-[#8a7460] text-[10px] font-medium uppercase tracking-[0.15em] text-center"
              style={{ fontFamily: "var(--font-dm-mono, 'DM Mono', monospace)" }}>
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
