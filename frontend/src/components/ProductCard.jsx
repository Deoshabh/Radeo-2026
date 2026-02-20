'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiHeart, FiShoppingCart, FiStar } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { formatPrice } from '@/utils/helpers';
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

        {/* â”€â”€ Image â”€â”€ */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[color:var(--color-subtle-bg)]">
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

          {/* Discount badge â€” top left */}
          {hasDiscount && product.inStock && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-[color:var(--color-accent)] text-white text-[10px] font-bold tracking-wider uppercase"
              style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
              {discountPercent}% OFF
            </div>
          )}

          {/* Out of stock badge */}
          {!product.inStock && (
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-[color:var(--color-heading)] text-[color:var(--color-subtle-bg)] text-[10px] font-bold tracking-wider uppercase"
              style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
              Sold Out
            </div>
          )}

          {/* Wishlist — ghost circle, always visible on mobile, hover on desktop */}
          <button
            onClick={handleToggleWishlist}
            aria-label={isProductInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
              isProductInWishlist
                ? 'bg-red-500 text-white opacity-100'
                : 'bg-white/80 text-[#1A1714] opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            } hover:scale-110`}
          >
            <FiHeart className={`w-3.5 h-3.5 ${isProductInWishlist ? 'fill-current' : ''}`} />
          </button>

          {/* ADD TO CART — slides up on card hover */}
          <div className="hidden sm:block absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out">
            {product.inStock ? (
              <button
                onClick={handleAddToCart}
                aria-label="Add to cart"
                className="w-full flex items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-[0.15em] transition-colors duration-150"
                style={{ height: '44px', fontFamily: "var(--font-dm-mono, 'DM Sans', sans-serif)", backgroundColor: 'var(--color-button-primary-bg, #1A1714)', color: 'var(--color-button-primary-text, #F0EBE1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-button-primary-hover, #B8973A)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-button-primary-bg, #1A1714)'; }}
              >
                <FiShoppingCart className="w-3.5 h-3.5" style={{ fontSize: '14px' }} />
                ADD TO CART
              </button>
            ) : (
              <div
                className="w-full flex items-center justify-center text-[12px] font-medium uppercase tracking-[0.15em] opacity-60"
                style={{ height: '44px', fontFamily: "var(--font-dm-mono, 'DM Sans', sans-serif)", backgroundColor: 'var(--color-button-primary-bg, #4A4540)', color: 'var(--color-button-primary-text, #A09A94)' }}
              >
                Out of Stock
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ Product Info â”€â”€ */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col">

          {/* Category */}
          <p className="text-[11px] sm:text-[11px] uppercase tracking-[0.2em] text-[color:var(--color-accent)] mb-1.5"
            style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
            {categoryLabel || 'Uncategorized'}
          </p>

          {/* Name */}
          <h3 className="text-sm sm:text-[15px] font-semibold text-[color:var(--color-heading)] mb-2 group-hover:text-[color:var(--color-muted)] transition-colors line-clamp-2 leading-snug"
            style={{ fontFamily: "var(--font-playfair, 'Lora', serif)" }}>
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
                      ? 'fill-[color:var(--color-accent)] text-[color:var(--color-accent)]'
                      : 'text-[color:var(--color-border-light)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[color:var(--color-body)]"
                style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
                {averageRating.toFixed(1)}{reviewCount > 0 ? ` (${reviewCount})` : ''}
              </span>
            </div>
          )}

          {/* Price â€” always at bottom */}
          <div className="mt-auto pt-2 border-t border-[color:var(--color-subtle-bg)]">
            {hasDiscount ? (
              <div className="flex items-baseline gap-2 flex-wrap">
                {/* Offer price â€” prominent */}
                <span className="text-lg sm:text-xl font-bold text-[color:var(--color-heading)]"
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
                  {formatPrice(product.price ?? 0)}
                </span>
                {/* Original price â€" struck through */}
                <span className="text-xs sm:text-sm text-[color:var(--color-body)] line-through"
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
                  {formatPrice(product.comparePrice ?? 0)}
                </span>
                {/* Savings */}
                <span className="text-[10px] font-bold text-[color:var(--color-accent)] uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
                  Save {formatPrice((product.comparePrice - product.price) ?? 0)}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg sm:text-xl font-bold text-[color:var(--color-heading)]"
                  style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
                  {formatPrice(product.price ?? 0)}
                </span>
                {product.sizes && product.sizes.length > 0 && (
                  <span className="text-[10px] text-[color:var(--color-body)]"
                    style={{ fontFamily: "var(--font-dm-mono, 'Space Mono', monospace)" }}>
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
              className="w-full flex items-center justify-center gap-2 text-[12px] font-medium uppercase tracking-[0.15em] transition-colors duration-150"
              style={{ height: '44px', fontFamily: "var(--font-dm-mono, 'DM Sans', sans-serif)", backgroundColor: 'var(--color-button-primary-bg, #1A1714)', color: 'var(--color-button-primary-text, #F0EBE1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-button-primary-hover, #B8973A)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-button-primary-bg, #1A1714)'; }}
            >
              <FiShoppingCart className="w-3.5 h-3.5" style={{ fontSize: '14px' }} />
              ADD TO CART
            </button>
          ) : (
            <div
              className="w-full flex items-center justify-center text-[12px] font-medium uppercase tracking-[0.15em] opacity-60"
              style={{ height: '44px', fontFamily: "var(--font-dm-mono, 'DM Sans', sans-serif)" }}
            >
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
