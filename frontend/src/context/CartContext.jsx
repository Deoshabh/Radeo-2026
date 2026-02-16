'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '@/utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
    }

    const handleStorageChange = (e) => {
      // Listen for custom 'cartUpdated' event or specific localStorage changes
      if (e.key === 'cartUpdated' || e.type === 'cartUpdated') {
        if (isAuthenticated) fetchCart();
      }
    };

    // Custom event listener for same-tab updates (if needed) and cross-tab storage events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleStorageChange);
    };
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.get();
      // Backend returns {items, totalItems, totalAmount} directly, not wrapped in {cart: {...}}
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, size, color = '', quantity = 1) => {
    try {
      const response = await cartAPI.add({ productId, size, color, quantity });
      // Backend returns {items, totalItems, totalAmount} directly
      setCart(response.data);
      // specific event for other components
      window.dispatchEvent(new Event('cartUpdated'));
      // trigger storage event for other tabs
      localStorage.setItem('cartUpdated', Date.now().toString());
      toast.success('Added to cart!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const removeFromCart = async (productId, size) => {
    try {
      const response = await cartAPI.remove(productId, size);
      // Backend returns {items, totalItems, totalAmount} directly
      setCart(response.data);
      // specific event for other components
      window.dispatchEvent(new Event('cartUpdated'));
      // trigger storage event for other tabs
      localStorage.setItem('cartUpdated', Date.now().toString());
      toast.success('Removed from cart');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from cart';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setCart(null);
      // specific event for other components
      window.dispatchEvent(new Event('cartUpdated'));
      // trigger storage event for other tabs
      localStorage.setItem('cartUpdated', Date.now().toString());
      toast.success('Cart cleared');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const getCartCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const updateItemQuantity = async (productId, size, quantity) => {
    try {
      const response = await cartAPI.update({ productId, size, quantity });
      setCart(response.data);
      // specific event for other components
      window.dispatchEvent(new Event('cartUpdated'));
      // trigger storage event for other tabs
      localStorage.setItem('cartUpdated', Date.now().toString());
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update quantity';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    clearCart,
    fetchCart, // Export fetchCart method
    refreshCart: fetchCart,
    cartCount: getCartCount(),
    cartTotal: getCartTotal(),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
