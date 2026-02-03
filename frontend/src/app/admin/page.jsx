'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/utils/api';
import AdminLayout from '@/components/AdminLayout';
import { FiPackage, FiShoppingBag, FiUsers, FiDollarSign, FiTrendingUp, FiSettings, FiFilter } from 'react-icons/fi';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      console.log('📊 Admin stats:', response.data);
      setStats({
        totalOrders: response.data.totalOrders || 0,
        totalProducts: response.data.totalProducts || 0,
        totalUsers: response.data.totalUsers || 0,
        totalRevenue: response.data.totalRevenue || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Keep placeholder data on error
      setStats({
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0,
        totalRevenue: 0,
      });
    }
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!loading && user?.role !== 'admin') {
      router.push('/');
      return;
    }

    // Fetch real stats from backend (only on client side to prevent SSR 404)
    if (typeof window !== 'undefined' && isAuthenticated && user?.role === 'admin') {
      fetchStats();
    }
  }, [user, isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  const adminCards = [
    {
      title: 'Products',
      value: stats.totalProducts,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      link: '/admin/products',
    },
    {
      title: 'Orders',
      value: stats.totalOrders,
      icon: FiPackage,
      color: 'bg-green-500',
      link: '/admin/orders',
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      icon: FiUsers,
      color: 'bg-purple-500',
      link: '/admin/users',
    },
    {
      title: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-yellow-500',
      link: '/admin/stats',
    },
  ];

  const quickLinks = [
    { title: 'Manage Products', href: '/admin/products', icon: FiShoppingBag, description: 'Add, edit, or remove products' },
    { title: 'View Orders', href: '/admin/orders', icon: FiPackage, description: 'Manage customer orders' },
    { title: 'Manage Users', href: '/admin/users', icon: FiUsers, description: 'View and manage users' },
    { title: 'Categories', href: '/admin/categories', icon: FiSettings, description: 'Manage product categories' },
    { title: 'Coupons', href: '/admin/coupons', icon: FiTrendingUp, description: 'Create and manage coupons' },
    { title: 'Statistics', href: '/admin/stats', icon: FiDollarSign, description: 'View detailed analytics' },
  ];

  return (
    <AdminLayout>
    <div className="min-h-screen bg-primary-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-primary-600">Welcome back, {user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {adminCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                href={card.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-600 text-sm mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-primary-900">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-primary-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  href={link.href}
                  className="border border-primary-200 rounded-lg p-4 hover:border-primary-400 hover:bg-primary-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-brand-brown group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary-900 mb-1">{link.title}</h3>
                      <p className="text-sm text-primary-600">{link.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Admin Panel</h3>
              <p className="text-sm text-yellow-800">
                This is the admin dashboard. Individual admin pages (Products, Orders, Users, etc.) will be created as you need them. 
                Click on any of the quick actions above to manage different aspects of your e-commerce store.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}
