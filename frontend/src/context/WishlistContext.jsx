'use client';

import { createContext, useContext, useState, useEffect } from 'react';
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

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setWishlist(response.data.wishlist?.products || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      const response = await wishlistAPI.addToWishlist(productId);
      setWishlist(response.data.wishlist?.products || []);
      toast.success('Added to wishlist!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add to wishlist';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const response = await wishlistAPI.removeFromWishlist(productId);
      setWishlist(response.data.wishlist?.products || []);
      toast.success('Removed from wishlist');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to remove from wishlist';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    wishlistCount: wishlist.length,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};
