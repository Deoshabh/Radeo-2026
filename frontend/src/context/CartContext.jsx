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
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      // Backend returns {items, totalItems, totalAmount} directly, not wrapped in {cart: {...}}
      console.log('📦 Cart API response:', response.data);
      setCart(response.data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, size, quantity = 1) => {
    try {
      const response = await cartAPI.addToCart({ productId, size, quantity });
      // Backend returns {items, totalItems, totalAmount} directly
      setCart(response.data);
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
      const response = await cartAPI.removeFromCart(productId, size);
      // Backend returns {items, totalItems, totalAmount} directly
      setCart(response.data);
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
      await cartAPI.clearCart();
      setCart(null);
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

  const value = {
    cart,
    loading,
    addToCart,
    removeFromCart,
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
