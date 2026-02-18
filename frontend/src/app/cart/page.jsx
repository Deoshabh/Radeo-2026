'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { FiTrash2, FiArrowLeft, FiMinus, FiPlus } from 'react-icons/fi';
import { formatPrice } from '@/utils/helpers';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { cart, removeFromCart, updateItemQuantity, cartTotal, loading } = useCart();
  const [updatingItems, setUpdatingItems] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const freeShippingThreshold = 1000;

  const handleUpdateQuantity = async (productId, size, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;

    const key = `${productId}-${size}`;
    setUpdatingItems(prev => ({ ...prev, [key]: true }));

    await updateItemQuantity(productId, size, newQty);

    setUpdatingItems(prev => ({ ...prev, [key]: false }));
  };

  const itemCount = cart?.items?.length || 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Breadcrumb-style back link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-xs tracking-[0.12em] uppercase mb-10 transition-colors duration-150 hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
          Continue Shopping
        </Link>

        {/* Page heading with item count */}
        <div className="flex items-baseline gap-4 mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            Your Bag
          </h1>
          {itemCount > 0 && (
            <span className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="spinner"></div>
          </div>
        ) : !cart || !cart.items || cart.items.length === 0 ? (
          /* ── Branded empty state ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-8 opacity-30">
              <rect x="10" y="24" width="60" height="46" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M26 24V18C26 10.268 32.268 4 40 4C47.732 4 54 10.268 54 18V24" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <line x1="30" y1="40" x2="50" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <line x1="34" y1="48" x2="46" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
            <h2 className="font-serif text-2xl sm:text-3xl font-light mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Your bag is empty
            </h2>
            <p className="text-sm max-w-xs mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Looks like you haven&apos;t added anything yet. Start curating your collection.
            </p>
            <Link href="/products" className="btn-editorial">
              Explore the Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* ── Cart Items ── */}
            <div className="lg:col-span-8">
              {/* Column headers (desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-6 pb-3 mb-0 text-[0.6875rem] tracking-[0.15em] uppercase" style={{ color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                <span className="col-span-7">Product</span>
                <span className="col-span-2 text-center">Quantity</span>
                <span className="col-span-3 text-right">Total</span>
              </div>

              {cart.items.map((item, index) => {
                const isUpdating = updatingItems[`${item.product._id}-${item.size}`];
                const lineTotal = (item.product.price ?? 0) * item.quantity;
                return (
                  <div
                    key={`${item.product._id}-${item.size}`}
                    className="group py-6 sm:py-8 sm:grid sm:grid-cols-12 sm:gap-6 flex flex-col gap-4"
                    style={{ borderBottom: index < cart.items.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                  >
                    {/* Product info */}
                    <div className="sm:col-span-7 flex gap-5">
                      <div className="relative w-[100px] h-[130px] sm:w-[120px] sm:h-[156px] flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--color-warm-bg)' }}>
                        <Image
                          src={item.product.images?.[0]?.url || item.product.images?.[0] || '/placeholder.svg'}
                          alt={item.product.name}
                          fill
                          sizes="(max-width: 640px) 100px, 120px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-col justify-between min-w-0 py-1">
                        <div>
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="font-serif text-base sm:text-lg font-normal leading-snug transition-colors duration-150 hover:opacity-70 block"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {item.product.name}
                          </Link>
                          <div className="mt-2 space-y-0.5">
                            {item.product.category?.name && (
                              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {item.product.category.name}
                              </p>
                            )}
                            <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                              Size: UK {item.size}
                            </p>
                          </div>
                          <p className="text-sm font-medium mt-2" style={{ color: 'var(--color-text-primary)' }}>
                            {formatPrice(item.product.price ?? 0)}
                          </p>
                        </div>
                        {/* Remove — visible on mobile, hover-only on desktop */}
                        <button
                          onClick={() => removeFromCart(item.product._id, item.size)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 inline-flex items-center gap-1.5 text-xs mt-3 sm:mt-0 self-start"
                          style={{ color: 'var(--color-text-secondary)' }}
                          title="Remove item"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Quantity stepper */}
                    <div className="sm:col-span-2 flex sm:items-center sm:justify-center">
                      <div className="inline-flex items-center h-10" style={{ border: '1px solid var(--color-border)' }}>
                        <button
                          onClick={() => handleUpdateQuantity(item.product._id, item.size, item.quantity, -1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="w-10 h-full flex items-center justify-center transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-warm-bg)]"
                          style={{ color: 'var(--color-text-primary)' }}
                          aria-label="Decrease quantity"
                        >
                          <FiMinus className="w-3.5 h-3.5" />
                        </button>
                        <span
                          className={`w-10 h-full flex items-center justify-center font-serif text-base select-none ${isUpdating ? 'opacity-40' : ''}`}
                          style={{ color: 'var(--color-text-primary)', borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product._id, item.size, item.quantity, 1)}
                          disabled={isUpdating}
                          className="w-10 h-full flex items-center justify-center transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-warm-bg)]"
                          style={{ color: 'var(--color-text-primary)' }}
                          aria-label="Increase quantity"
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <div className="sm:col-span-3 flex sm:items-center sm:justify-end">
                      <span className="font-serif text-base sm:text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Order Summary ── */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 p-6 sm:p-8" style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-warm-bg)' }}>
                <h2 className="label-upper text-xs mb-6" style={{ color: 'var(--color-text-secondary)' }}>Order Summary</h2>

                {/* Free Shipping */}
                <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {cartTotal >= freeShippingThreshold ? (
                    <div className="flex items-center gap-2 text-xs tracking-wide" style={{ color: 'var(--color-accent)' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8.5L6 12.5L14 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Complimentary shipping applied
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Add <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatPrice(freeShippingThreshold - cartTotal)}</span> for complimentary shipping
                      </p>
                      <div className="h-[2px] overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                        <div
                          className="h-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%`,
                            backgroundColor: 'var(--color-accent)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Line items */}
                <div className="space-y-3 mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span style={{ color: 'var(--color-text-primary)' }}>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span style={{ color: cartTotal >= freeShippingThreshold ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                      {cartTotal >= freeShippingThreshold ? 'Free' : 'At checkout'}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 mb-6" style={{ borderTop: '1px solid var(--color-text-primary)' }}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total</span>
                    <span className="font-serif text-xl sm:text-2xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] mt-1 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                    Including all applicable taxes
                  </p>
                </div>

                {/* CTA */}
                <button onClick={handleCheckout} className="btn-editorial w-full">
                  Proceed to Checkout
                </button>

                <p className="text-[0.625rem] tracking-[0.1em] uppercase text-center mt-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Secure checkout &middot; 30-day returns
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
