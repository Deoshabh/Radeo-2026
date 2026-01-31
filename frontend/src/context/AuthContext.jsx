'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '@/utils/api';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('accessToken');
      if (token) {
        const response = await authAPI.getCurrentUser();
        // Backend returns user data directly, not wrapped in response.data.user
        setUser(response.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only clear accessToken (backend manages refreshToken)
      Cookies.remove('accessToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { accessToken, user } = response.data;
      
      // Only store accessToken in cookies (refreshToken is in httpOnly cookie from backend)
      Cookies.set('accessToken', accessToken, { expires: 1 }); // 1 day
      
      setUser(user);
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { accessToken, user } = response.data;
      
      // Only store accessToken in cookies (refreshToken is in httpOnly cookie from backend)
      Cookies.set('accessToken', accessToken, { expires: 1 });
      
      setUser(user);
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('accessToken');
      // Backend clears the httpOnly refreshToken cookie
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
