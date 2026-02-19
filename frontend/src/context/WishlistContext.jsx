'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { wishlistAPI } from '@/utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated]);

  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.get();
      // Backend returns wishlist object directly: {_id, user, products: [...]}
      setWishlist(response.data?.products || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToWishlist = useCallback(async (productId) => {
    try {
      const response = await wishlistAPI.add(productId);
      // Backend returns wishlist object directly: {_id, user, products: [...]}
      setWishlist(response.data?.products || []);
      toast.success('Added to wishlist!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to wishlist';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId) => {
    try {
      const response = await wishlistAPI.remove(productId);
      // Backend returns wishlist object directly: {_id, user, products: [...]}
      setWishlist(response.data?.products || []);
      toast.success('Removed from wishlist');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from wishlist';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  const isInWishlist = useCallback((productId) => {
    return wishlist.some(item => item._id === productId);
  }, [wishlist]);

  const toggleWishlist = useCallback(async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

  const value = useMemo(() => ({
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount,
  }), [wishlist, loading, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist, wishlistCount]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
