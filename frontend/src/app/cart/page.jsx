'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { FiTrash2, FiShoppingBag, FiArrowLeft, FiMinus, FiPlus, FiAward } from 'react-icons/fi';

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

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <Link href="/products" className="inline-flex items-center gap-2 text-sm sm:text-base text-primary-600 hover:text-brand-brown mb-6 sm:mb-8 transition-colors">
          <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          Continue Shopping
        </Link>

        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-900 mb-6 sm:mb-8">
          Shopping Cart
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="spinner"></div>
          </div>
        ) : !cart || !cart.items || cart.items.length === 0 ? (
          <div className="text-center py-20">
            <FiShoppingBag className="w-20 h-20 text-primary-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-primary-900 mb-2">Your cart is empty</h2>
            <p className="text-primary-600 mb-6">Add some products to get started</p>
            <Link href="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cart.items.map((item) => {
                const isUpdating = updatingItems[`${item.product._id}-${item.size}`];
                return (
                  <div key={`${item.product._id}-${item.size}`} className="bg-white rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="relative w-full sm:w-24 md:w-32 h-48 sm:h-24 md:h-32 flex-shrink-0">
                      <Image
                        src={item.product.images?.[0]?.url || item.product.images?.[0] || '/placeholder.svg'}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 128px"
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1">
                      <Link href={`/products/${item.product.slug}`} className="font-serif text-lg sm:text-xl font-semibold text-primary-900 hover:text-brand-brown transition-colors">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-primary-600 mt-1">{item.product.category?.name}</p>
                      <p className="text-sm text-primary-600 mt-1">Size: UK {item.size}</p>
                      <p className="text-lg sm:text-xl font-bold text-brand-brown mt-2">
                        ₹{item.product.price?.toLocaleString()}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-primary-200 rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(item.product._id, item.size, item.quantity, -1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="p-2 hover:bg-primary-50 text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiMinus className="w-4 h-4" />
                          </button>
                          <span className={`w-8 text-center font-medium ${isUpdating ? 'opacity-50' : ''}`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product._id, item.size, item.quantity, 1)}
                            disabled={isUpdating}
                            className="p-2 hover:bg-primary-50 text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <FiPlus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product._id, item.size)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
                          title="Remove item"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 sticky top-24">
                <h2 className="font-serif text-2xl font-bold text-primary-900 mb-6">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  {/* Free Shipping Progress */}
                  <div className="bg-primary-50 rounded-lg p-3 mb-4">
                    {cartTotal >= freeShippingThreshold ? (
                      <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                        <FiAward className="w-5 h-5" />
                        Your order qualifies for Free Shipping!
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-primary-700">Add <strong>₹{(freeShippingThreshold - cartTotal).toLocaleString()}</strong> for Free Shipping</span>
                          <span className="text-primary-500">{Math.min(100, Math.round((cartTotal / freeShippingThreshold) * 100))}%</span>
                        </div>
                        <div className="h-2 bg-primary-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-brown transition-all duration-500 ease-out"
                            style={{ width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-primary-700">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-primary-700">
                    <span>Shipping</span>
                    <span>{cartTotal >= freeShippingThreshold ? <span className="text-green-600">Free</span> : 'Calculated at checkout'}</span>
                  </div>
                  <div className="border-t border-primary-200 pt-3">
                    <div className="flex justify-between text-lg font-bold text-primary-900">
                      <span>Total</span>
                      <span>₹{cartTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleCheckout} className="w-full btn btn-primary mb-4">
                  Proceed to Checkout
                </button>

                <p className="text-xs text-center text-primary-600">
                  Secure checkout • Free shipping on all orders
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
